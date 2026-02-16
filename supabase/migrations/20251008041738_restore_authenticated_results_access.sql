/*
  # Restore authenticated access for results
  
  1. Changes
    - Drop the permissive policy that allows anyone to read results
    - Restore policy requiring authentication to read results
  
  2. Security
    - Only authenticated admins can view results
    - Participants can still submit without authentication
  
  3. Notes
    - This ensures proper security now that admin authentication is implemented
*/

DROP POLICY IF EXISTS "Anyone can read sorting results" ON sorting_results;

CREATE POLICY "Authenticated users can read sorting results"
  ON sorting_results
  FOR SELECT
  TO authenticated
  USING (true);
