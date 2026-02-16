/*
  CONSOLIDATED SETUP SCRIPT
  Run this entire script in your Supabase SQL Editor to set up the database.
*/

-- 1. Create 'user_profiles' table (Replencing old user_roles)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert profiles" ON user_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update all profiles" ON user_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete profiles" ON user_profiles FOR DELETE TO authenticated USING (true);


-- 2. Create 'projects' table
CREATE TABLE IF NOT EXISTS projects (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('open', 'closed', 'hybrid')),
  cards jsonb NOT NULL,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 3. Create 'app_settings' table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT 'true'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings" ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update settings" ON app_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO app_settings (setting_key, setting_value) VALUES ('enable_signup', 'true'::jsonb) ON CONFLICT (setting_key) DO NOTHING;


-- 4. Project RLS Policies (Including Admin Access)
-- Drop existing distinct policies if they exist (to be safe)
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- SELECT
CREATE POLICY "Users can read own projects or admins read all"
  ON projects FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT
CREATE POLICY "Users can insert own projects or admins insert any"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE
CREATE POLICY "Users can update own projects or admins update all"
  ON projects FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE
CREATE POLICY "Users can delete own projects or admins delete all"
  ON projects FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- 5. Auto-create profile on signup (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
