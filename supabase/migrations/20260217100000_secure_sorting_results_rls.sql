-- Secure sorting_results RLS
-- Restrict SELECT access to project owners and admins only.

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read sorting results" ON sorting_results;
DROP POLICY IF EXISTS "Anyone can read sorting results" ON sorting_results;
DROP POLICY IF EXISTS "Authenticated users can read all results" ON sorting_results;

-- 2. Create the refined SELECT policy
CREATE POLICY "Owners and admins can read sorting results"
  ON sorting_results
  FOR SELECT
  TO authenticated
  USING (
    -- User is an admin
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- User is the owner of the project this result belongs to
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = sorting_results.project_id AND user_id = auth.uid()
    )
  );
