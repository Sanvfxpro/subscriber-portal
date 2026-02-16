/*
  # Allow anonymous access to read app settings

  1. Changes
    - Drop existing read policy that requires authentication
    - Create new policy that allows anyone (including anonymous users) to read settings
  
  2. Security
    - Only SELECT operations are allowed for anonymous users
    - INSERT, UPDATE, DELETE still require authentication
*/

-- Drop the existing authenticated-only read policy
DROP POLICY IF EXISTS "Authenticated users can read settings" ON app_settings;

-- Create new policy that allows anyone to read settings
CREATE POLICY "Anyone can read settings"
  ON app_settings
  FOR SELECT
  USING (true);