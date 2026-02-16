/*
  # Grant Admin Users Full Access to All Projects

  1. Changes
    - Update all existing RLS policies on projects table to include admin users
    - Admin users (role = 'admin' in user_profiles table) can:
      - Read all projects (not just their own)
      - Update all projects
      - Delete all projects
      - Insert projects on behalf of any user

  2. Security
    - Maintains existing owner-based access for regular users
    - Adds admin override to all policies using OR conditions
    - Checks user role from user_profiles table

  3. Notes
    - Admin role check: EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    - All policies use secure auth.uid() function
    - Regular users maintain same access as before
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Create new policies with admin access

-- SELECT policy: Users can read their own projects OR admins can read all projects
CREATE POLICY "Users can read own projects or admins read all"
  ON projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT policy: Users can insert their own projects OR admins can insert any project
CREATE POLICY "Users can insert own projects or admins insert any"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE policy: Users can update their own projects OR admins can update all projects
CREATE POLICY "Users can update own projects or admins update all"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE policy: Users can delete their own projects OR admins can delete all projects
CREATE POLICY "Users can delete own projects or admins delete all"
  ON projects FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );