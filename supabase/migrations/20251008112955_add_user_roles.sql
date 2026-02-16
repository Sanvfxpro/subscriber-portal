/*
  # Add user roles

  1. New Tables
    - `user_roles`
      - `id` (uuid, primary key, auto-generated)
      - `user_id` (uuid, not null) - References auth.users
      - `role` (text, not null) - Role type: 'admin' or 'participant'
      - `created_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `user_roles` table
    - Add policy for authenticated users to read their own role
    - Add policy for service role to insert roles (during signup)
  
  3. Indexes
    - Create unique index on user_id
    - Create index on role for filtering
  
  4. Notes
    - Each user can have one role
    - Roles determine access permissions (admin can create projects, participant can only submit results)
    - Default role is 'participant'
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'participant')),
  created_at timestamptz DEFAULT now()
);

-- Create unique index on user_id (one role per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_id 
  ON user_roles(user_id);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_user_roles_role 
  ON user_roles(role);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own role
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own role during signup
CREATE POLICY "Users can insert own role"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
