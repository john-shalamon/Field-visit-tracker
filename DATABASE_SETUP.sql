-- =============================================================================
-- Field Visit Tracker - Complete Supabase Database Setup
-- =============================================================================
-- Run this ENTIRE SQL in your Supabase Dashboard > SQL Editor > New Query
-- This creates all tables, indexes, RLS policies, functions, triggers,
-- and storage configuration needed for the app.
-- =============================================================================

-- =====================
-- 1. EXTENSIONS
-- =====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- 2. DROP EXISTING (safe re-run)
-- =====================
-- Drop policies first (they depend on tables)
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Drop tables in dependency order
DROP TABLE IF EXISTS approvals CASCADE;
DROP TABLE IF EXISTS signatures CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- =====================
-- 3. TABLES
-- =====================

-- Users table (linked to Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'field_officer'
    CHECK (role IN ('field_officer', 'hod', 'collector', 'admin')),
  department TEXT,
  zone TEXT,
  employee_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visits table
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  visited_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspections table
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  inspector_name TEXT NOT NULL,
  inspection_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  findings TEXT NOT NULL,
  recommendations TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Signatures table
CREATE TABLE signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  signed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signature_path TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  signature_type TEXT NOT NULL CHECK (signature_type IN ('inspector', 'hod', 'collector'))
);

-- Approvals table
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approver_role TEXT NOT NULL DEFAULT 'hod'
    CHECK (approver_role IN ('field_officer', 'hod', 'collector', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- 4. INDEXES
-- =====================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_zone ON users(zone);

CREATE INDEX idx_visits_user_id ON visits(user_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_visited_date ON visits(visited_date);
CREATE INDEX idx_visits_created_at ON visits(created_at);

CREATE INDEX idx_inspections_visit_id ON inspections(visit_id);
CREATE INDEX idx_inspections_status ON inspections(status);

CREATE INDEX idx_photos_visit_id ON photos(visit_id);
CREATE INDEX idx_photos_inspection_id ON photos(inspection_id);

CREATE INDEX idx_signatures_inspection_id ON signatures(inspection_id);

CREATE INDEX idx_approvals_inspection_id ON approvals(inspection_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX idx_approvals_status ON approvals(status);

-- =====================
-- 5. FUNCTIONS & TRIGGERS
-- =====================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile when a new auth user signs up
-- This is a BACKUP in case the app-side profile insert fails
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'field_officer',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================
-- 6. ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- USERS policies
-- -----------------------------------------------
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins and HODs can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'hod', 'collector'))
  );

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- -----------------------------------------------
-- VISITS policies
-- -----------------------------------------------
-- Users can view their own visits
CREATE POLICY "Users can view own visits" ON visits
  FOR SELECT USING (auth.uid() = user_id);

-- HODs / Collectors / Admins can view all visits for approval
CREATE POLICY "Managers can view all visits" ON visits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hod', 'collector', 'admin'))
  );

-- Users can insert their own visits
CREATE POLICY "Users can insert own visits" ON visits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own visits (any status - for submit/edit)
CREATE POLICY "Users can update own visits" ON visits
  FOR UPDATE USING (auth.uid() = user_id);

-- Managers can update visit status (approve/reject)
CREATE POLICY "Managers can update visits" ON visits
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hod', 'collector', 'admin'))
  );

-- Users can delete their own draft visits
CREATE POLICY "Users can delete own draft visits" ON visits
  FOR DELETE USING (auth.uid() = user_id AND status = 'draft');

-- -----------------------------------------------
-- INSPECTIONS policies
-- -----------------------------------------------
-- Users can view inspections for their visits
CREATE POLICY "Users can view own inspections" ON inspections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND user_id = auth.uid())
  );

-- Managers can view all inspections
CREATE POLICY "Managers can view all inspections" ON inspections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hod', 'collector', 'admin'))
  );

-- Users can insert inspections for their visits
CREATE POLICY "Users can insert inspections" ON inspections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND user_id = auth.uid())
  );

-- Users can update inspections for their visits
CREATE POLICY "Users can update own inspections" ON inspections
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND user_id = auth.uid())
  );

-- Managers can update inspection status (approve/reject)
CREATE POLICY "Managers can update inspections" ON inspections
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hod', 'collector', 'admin'))
  );

-- Users can delete draft inspections for their visits
CREATE POLICY "Users can delete own draft inspections" ON inspections
  FOR DELETE USING (
    status = 'draft' AND
    EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND user_id = auth.uid())
  );

-- -----------------------------------------------
-- PHOTOS policies
-- -----------------------------------------------
-- Users can view photos for their visits
CREATE POLICY "Users can view own photos" ON photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND user_id = auth.uid())
  );

-- Managers can view all photos
CREATE POLICY "Managers can view all photos" ON photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hod', 'collector', 'admin'))
  );

-- Users can insert photos for their visits
CREATE POLICY "Users can insert photos" ON photos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND user_id = auth.uid())
  );

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos" ON photos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND user_id = auth.uid())
  );

-- -----------------------------------------------
-- SIGNATURES policies
-- -----------------------------------------------
-- Users can view signatures related to their visits
CREATE POLICY "Users can view own signatures" ON signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inspections i
      JOIN visits v ON v.id = i.visit_id
      WHERE i.id = inspection_id AND v.user_id = auth.uid()
    )
  );

-- Managers can view all signatures
CREATE POLICY "Managers can view all signatures" ON signatures
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hod', 'collector', 'admin'))
  );

-- Authenticated users can insert signatures
CREATE POLICY "Users can insert signatures" ON signatures
  FOR INSERT WITH CHECK (auth.uid() = signed_by_user_id);

-- -----------------------------------------------
-- APPROVALS policies
-- -----------------------------------------------
-- Approvers can view their own approvals
CREATE POLICY "Approvers can view own approvals" ON approvals
  FOR SELECT USING (auth.uid() = approver_id);

-- Visit owners can view approvals for their visits
CREATE POLICY "Visit owners can view approvals" ON approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inspections i
      JOIN visits v ON v.id = i.visit_id
      WHERE i.id = inspection_id AND v.user_id = auth.uid()
    )
  );

-- Admins can view all approvals
CREATE POLICY "Admins can view all approvals" ON approvals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Managers can insert approvals
CREATE POLICY "Managers can insert approvals" ON approvals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hod', 'collector', 'admin'))
  );

-- Approvers can update their own approvals
CREATE POLICY "Approvers can update own approvals" ON approvals
  FOR UPDATE USING (auth.uid() = approver_id);

-- =====================
-- 7. STORAGE BUCKET
-- =====================
-- Create storage bucket for visit photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-photos', 'visit-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (drop first for safe re-run)
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'visit-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'visit-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'visit-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'visit-photos' AND
    auth.role() = 'authenticated'
  );

-- =====================
-- 8. DONE
-- =====================
-- Schema setup complete! Your app is ready to use.
-- 
-- Tables created:
--   users        - User profiles (linked to Supabase Auth)
--   visits       - Field visit records with GPS coordinates
--   inspections  - Inspection reports linked to visits
--   photos       - Photo attachments for visits/inspections
--   signatures   - Digital signatures for inspections
--   approvals    - Approval workflow records
--
-- Features:
--   ✓ Row Level Security on all tables
--   ✓ Auto-create user profile on signup (trigger)
--   ✓ Auto-update timestamps on record changes
--   ✓ Storage bucket for visit photos
--   ✓ Indexes for query performance
-- =============================================================================