-- Field Visit Tracker - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor to set up the complete database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('field_officer', 'hod', 'collector', 'admin')),
  department TEXT,
  zone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  visited_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  inspector_name TEXT NOT NULL,
  inspection_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  findings TEXT NOT NULL,
  recommendations TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signatures table
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  signed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signature_path TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('inspector', 'hod', 'collector'))
);

-- Create approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approver_role TEXT NOT NULL CHECK (approver_role IN ('field_officer', 'hod', 'collector', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visits_user_id ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_visited_date ON visits(visited_date);
CREATE INDEX IF NOT EXISTS idx_inspections_visit_id ON inspections(visit_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_photos_visit_id ON photos(visit_id);
CREATE INDEX IF NOT EXISTS idx_photos_inspection_id ON photos(inspection_id);
CREATE INDEX IF NOT EXISTS idx_signatures_inspection_id ON signatures(inspection_id);
CREATE INDEX IF NOT EXISTS idx_approvals_inspection_id ON approvals(inspection_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON approvals(approver_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for visits table
-- Users can view their own visits
CREATE POLICY "Users can view own visits" ON visits
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own visits
CREATE POLICY "Users can insert own visits" ON visits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own draft visits
CREATE POLICY "Users can update own draft visits" ON visits
  FOR UPDATE USING (auth.uid() = user_id AND status = 'draft');

-- HODs and Collectors can view visits for approval
CREATE POLICY "HODs and Collectors can view visits for approval" ON visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hod', 'collector', 'admin')
    )
  );

-- RLS Policies for inspections table
-- Authorized users can view inspections
CREATE POLICY "Authorized users can view inspections" ON inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM visits v WHERE v.id = visit_id AND v.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hod', 'collector', 'admin')
    )
  );

-- Users can insert inspections for their visits
CREATE POLICY "Users can insert inspections for their visits" ON inspections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND user_id = auth.uid())
  );

-- RLS Policies for photos table
-- Authorized users can view photos
CREATE POLICY "Authorized users can view photos" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM visits v WHERE v.id = visit_id AND v.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hod', 'collector', 'admin')
    )
  );

-- RLS Policies for signatures table
-- Authorized users can view signatures
CREATE POLICY "Authorized users can view signatures" ON signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inspections i JOIN visits v ON i.id = inspection_id
      WHERE v.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hod', 'collector', 'admin')
    )
  );

-- RLS Policies for approvals table
-- Approvers can view approvals they're involved in
CREATE POLICY "Approvers can view their approvals" ON approvals
  FOR SELECT USING (
    auth.uid() = approver_id OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin')
    )
  );

-- Create a storage bucket for photos (run this in Supabase dashboard)
-- Storage buckets need to be created via the UI, but RLS policies can be set via SQL:

-- RLS Policies for storage.objects (visit-photos bucket)
-- Users can upload photos for their visits
CREATE POLICY "Users can upload photos for their visits" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'visit-photos' AND
    auth.role() = 'authenticated'
  );

-- Users can view photos for their visits
CREATE POLICY "Users can view their photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'visit-photos' AND
    (auth.role() = 'authenticated')
  );

-- Users can delete their own photos
CREATE POLICY "Users can delete their photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'visit-photos' AND
    auth.role() = 'authenticated'
  );
