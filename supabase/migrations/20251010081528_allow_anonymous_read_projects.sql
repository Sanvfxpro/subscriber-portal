/*
  # Allow anonymous access to projects for participants

  1. Changes
    - Add RLS policy to allow anonymous users to read projects
    - This enables participants to access card sorting projects via shared links without authentication
  
  2. Security
    - Anonymous users can only SELECT (read) projects, not modify them
    - All other operations (INSERT, UPDATE, DELETE) still require authentication and ownership
*/

-- Allow anonymous users to read projects (for participants accessing via shared links)
CREATE POLICY "Anonymous users can read projects"
  ON projects
  FOR SELECT
  TO anon
  USING (true);
