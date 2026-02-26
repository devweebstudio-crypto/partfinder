-- ============================================================
-- PARTFINDER - Final Supabase Setup (Single Script)
-- Safe to re-run; uses IF NOT EXISTS and DROP POLICY IF EXISTS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'vendor', 'admin')),
  business_name TEXT,
  category TEXT,
  city TEXT,
  state TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  authorized_dealer BOOLEAN DEFAULT FALSE,
  companies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REQUESTS TABLE
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  part_name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  preferred_company TEXT,
  area_radius INTEGER,
  area_city TEXT,
  area_state TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  CONSTRAINT requests_client_or_vendor_check CHECK (client_id IS NOT NULL OR vendor_id IS NOT NULL)
);

-- 3. REQUEST RESPONSES TABLE
CREATE TABLE IF NOT EXISTS request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, vendor_id)
);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT notifications_vendor_or_client_check CHECK (vendor_id IS NOT NULL OR client_id IS NOT NULL)
);

-- ============================================================
-- ALTERS FOR EXISTING DATABASES
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS authorized_dealer BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS companies JSONB DEFAULT '[]'::jsonb;

ALTER TABLE requests ADD COLUMN IF NOT EXISTS area_state TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE requests ALTER COLUMN client_id DROP NOT NULL;

-- Fix existing rows that have both client_id and vendor_id as NULL
-- Set client_id to a default value for orphaned rows (delete them or assign to first user)
DO $$
DECLARE
  first_client_id UUID;
BEGIN
  -- Get the first client user ID as a fallback
  SELECT id INTO first_client_id FROM profiles WHERE role = 'client' LIMIT 1;
  
  -- If there are any requests with both NULL, delete them or assign to first client
  -- Option 1: Delete orphaned requests
  DELETE FROM requests WHERE client_id IS NULL AND vendor_id IS NULL;
  
  -- Option 2: Alternatively, assign them to first client (comment out delete above and uncomment below)
  -- UPDATE requests SET client_id = first_client_id WHERE client_id IS NULL AND vendor_id IS NULL AND first_client_id IS NOT NULL;
END $$;

-- Now add the constraint
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_client_or_vendor_check;
ALTER TABLE requests ADD CONSTRAINT requests_client_or_vendor_check CHECK (client_id IS NOT NULL OR vendor_id IS NOT NULL);

ALTER TABLE request_responses DROP CONSTRAINT IF EXISTS request_responses_status_check;
ALTER TABLE request_responses ADD CONSTRAINT request_responses_status_check 
  CHECK (status IN ('accepted', 'rejected', 'completed'));

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- REQUESTS policies
DROP POLICY IF EXISTS "Anyone can view requests" ON requests;
DROP POLICY IF EXISTS "Clients can insert requests" ON requests;
DROP POLICY IF EXISTS "Vendors can insert vendor requests" ON requests;
DROP POLICY IF EXISTS "Clients can update their own requests" ON requests;
DROP POLICY IF EXISTS "Vendors can update their own requests" ON requests;

CREATE POLICY "Anyone can view requests" ON requests FOR SELECT USING (true);
CREATE POLICY "Clients can insert requests" ON requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Vendors can insert vendor requests" ON requests FOR INSERT WITH CHECK (
  auth.uid() = vendor_id AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'vendor'
  )
);
CREATE POLICY "Clients can update their own requests" ON requests FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Vendors can update their own requests" ON requests FOR UPDATE USING (auth.uid() = vendor_id);

-- REQUEST_RESPONSES policies
DROP POLICY IF EXISTS "Anyone can view responses" ON request_responses;
DROP POLICY IF EXISTS "Vendors can insert responses" ON request_responses;
DROP POLICY IF EXISTS "Vendors can update their own responses" ON request_responses;

CREATE POLICY "Anyone can view responses" ON request_responses FOR SELECT USING (true);
CREATE POLICY "Vendors can insert responses" ON request_responses FOR INSERT WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "Vendors can update their own responses" ON request_responses FOR UPDATE USING (auth.uid() = vendor_id);

-- NOTIFICATIONS policies
DROP POLICY IF EXISTS "Users can view notifications for them" ON notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

CREATE POLICY "Users can view notifications for them" ON notifications FOR SELECT USING (auth.uid() = vendor_id OR auth.uid() = client_id);
CREATE POLICY "Authenticated users can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = vendor_id OR auth.uid() = client_id);
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = vendor_id OR auth.uid() = client_id);

-- Enable real-time replication on notifications table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON c.oid = pr.prrelid
    JOIN pg_publication p ON p.oid = pr.prpubid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('request-images', 'request-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view request images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload request images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;

CREATE POLICY "Anyone can view request images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'request-images');

CREATE POLICY "Authenticated users can upload request images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'request-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'request-images' AND auth.uid()::text = (storage.foldername(name))[2]);

-- ============================================================
-- ADMIN USER SETUP
-- After running this, manually set role to 'admin' for your email:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
-- ============================================================