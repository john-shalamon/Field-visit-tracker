-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types
CREATE TYPE user_role AS ENUM ('field_officer', 'hod', 'collector', 'admin');
CREATE TYPE visit_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'completed');
CREATE TYPE inspection_item_status AS ENUM ('pending', 'pass', 'fail', 'not_applicable');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'field_officer',
  department VARCHAR(100),
  zone VARCHAR(100),
  employee_id VARCHAR(100),
  district_id UUID,
  profile_photo_url VARCHAR(500),
  fingerprint_enrolled BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Districts table
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  state VARCHAR(100),
  location GEOMETRY(Point, 4326),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Field Visits table
CREATE TABLE field_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_officer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  location GEOMETRY(Point, 4326),
  location_address VARCHAR(500),
  status visit_status DEFAULT 'draft',
  notes TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspection Items table
CREATE TABLE inspection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES field_visits(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  status inspection_item_status DEFAULT 'pending',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspection Reports table
CREATE TABLE inspection_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES field_visits(id) ON DELETE CASCADE,
  report_content TEXT NOT NULL,
  signature_url VARCHAR(500),
  signed_at TIMESTAMP WITH TIME ZONE,
  is_digitally_signed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES field_visits(id) ON DELETE CASCADE,
  inspection_item_id UUID REFERENCES inspection_items(id) ON DELETE SET NULL,
  photo_url VARCHAR(500) NOT NULL,
  description TEXT,
  captured_at TIMESTAMP WITH TIME ZONE,
  location GEOMETRY(Point, 4326),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approvals table
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES field_visits(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approval_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Summary table
CREATE TABLE analytics_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  total_visits INT DEFAULT 0,
  completed_visits INT DEFAULT 0,
  pending_approvals INT DEFAULT 0,
  avg_inspection_time NUMERIC,
  pass_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline Drafts table for local sync
CREATE TABLE offline_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL,
  sync_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_district_id ON users(district_id);
CREATE INDEX idx_field_visits_field_officer_id ON field_visits(field_officer_id);
CREATE INDEX idx_field_visits_district_id ON field_visits(district_id);
CREATE INDEX idx_field_visits_status ON field_visits(status);
CREATE INDEX idx_field_visits_visit_date ON field_visits(visit_date);
CREATE INDEX idx_inspection_items_visit_id ON inspection_items(visit_id);
CREATE INDEX idx_photos_visit_id ON photos(visit_id);
CREATE INDEX idx_approvals_visit_id ON approvals(visit_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX idx_analytics_district_id ON analytics_summary(district_id);
CREATE INDEX idx_offline_drafts_user_id ON offline_drafts(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can view themselves, admins can view all
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Field Visits: Field officers see own, HOD/Collector/Admin see filtered
CREATE POLICY "Field officers see own visits" ON field_visits
  FOR SELECT USING (
    field_officer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'hod', 'collector'))
  );

CREATE POLICY "Field officers can insert own visits" ON field_visits
  FOR INSERT WITH CHECK (field_officer_id = auth.uid());

CREATE POLICY "Field officers can update own draft visits" ON field_visits
  FOR UPDATE USING (
    field_officer_id = auth.uid() AND status = 'draft'
  );

-- Photos: Accessible to visit participants
CREATE POLICY "Photos are accessible to visit team" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM field_visits 
      WHERE id = visit_id AND (
        field_officer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM approvals WHERE visit_id = field_visits.id AND approver_id = auth.uid())
      )
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Approvals: HOD/Collector can approve assigned visits
CREATE POLICY "Approvers can see assigned visits" ON approvals
  FOR SELECT USING (
    approver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM field_visits 
      WHERE id = visit_id AND field_officer_id = auth.uid()
    )
  );

CREATE POLICY "Approvers can update their approvals" ON approvals
  FOR UPDATE USING (approver_id = auth.uid());

-- Offline Drafts: Users can only see own drafts
CREATE POLICY "Users can see own drafts" ON offline_drafts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own drafts" ON offline_drafts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own drafts" ON offline_drafts
  FOR UPDATE USING (user_id = auth.uid());
