-- 1. Add email column to user_profiles if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email text;

-- 2. Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, email)
  VALUES (new.id, 'user', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create is_admin function to avoid RLS recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies

-- Allow admins to do everything
DROP POLICY IF EXISTS "Admins can do everything on user_profiles" ON user_profiles;
CREATE POLICY "Admins can do everything on user_profiles"
ON user_profiles
FOR ALL
USING (
  is_admin()
);

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
ON user_profiles
FOR SELECT
USING (
  auth.uid() = id
);

-- Allow users to maintain their own profile (e.g. update name if we add it later)
-- For now, updates are admin-only for roles.

-- Allow the trigger/system to insert profiles (handled by SECURITY DEFINER function usually, but good to have)
-- Actually, insert is done by trigger. Trigger bypasses RLS if SECURITY DEFINER.

-- 6. Backfill emails (Optional, run if needed manually)
-- UPDATE user_profiles SET email = (SELECT email FROM auth.users WHERE auth.users.id = user_profiles.id);
