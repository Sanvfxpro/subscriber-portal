/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (text, primary key) - Unique project identifier
      - `name` (text, not null) - Project name
      - `description` (text) - Optional project description
      - `type` (text, not null) - Sort type: 'open', 'closed', or 'hybrid'
      - `cards` (jsonb, not null) - Array of card objects with id, content, and sortOrder
      - `categories` (jsonb, not null, default '[]') - Array of category objects with id, name, and sortOrder
      - `user_id` (uuid, not null) - References auth.users, owner of the project
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `projects` table
    - Add policy for authenticated users to read their own projects
    - Add policy for authenticated users to insert their own projects
    - Add policy for authenticated users to update their own projects
    - Add policy for authenticated users to delete their own projects
  
  3. Indexes
    - Create index on user_id for faster queries
    - Create index on created_at for sorting
  
  4. Notes
    - Projects are stored with all their cards and categories as JSONB for efficient retrieval
    - Each user can only access their own projects
    - The id field uses text to maintain compatibility with existing client-side code
*/

CREATE TABLE IF NOT EXISTS projects (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('open', 'closed', 'hybrid')),
  cards jsonb NOT NULL,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id 
  ON projects(user_id);

CREATE INDEX IF NOT EXISTS idx_projects_created_at 
  ON projects(created_at DESC);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own projects
CREATE POLICY "Users can read own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own projects
CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
