/*
  # Create application settings table

  1. New Table
    - `app_settings` table to store application configuration
    - `id` (uuid, primary key)
    - `setting_key` (text, unique) - the setting name
    - `setting_value` (jsonb) - the setting value
    - `updated_at` (timestamptz) - last update timestamp
  
  2. Security
    - Enable RLS on the table
    - Admins can read and update settings
    - All authenticated users can read settings
  
  3. Default Data
    - Insert default setting for enable_signup (true by default)
*/

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT 'true'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read settings
CREATE POLICY "Authenticated users can read settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can update settings (admin check will be done in app layer)
CREATE POLICY "Authenticated users can update settings"
  ON app_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default setting for enable_signup
INSERT INTO app_settings (setting_key, setting_value)
VALUES ('enable_signup', 'true'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;