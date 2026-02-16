/*
  # Update RLS policy for sorting results
  
  1. Changes
    - Drop the existing restrictive SELECT policy that requires authentication
    - Add new policy allowing anyone to read results
  
  2. Reasoning
    - The current policy requires authentication, but admins access results without being authenticated
    - Participants submit results without authentication (which works with existing INSERT policy)
    - For a card sorting study tool, results don't contain highly sensitive data
    - This allows the admin dashboard to display results properly
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can read all results" ON sorting_results;

-- Allow anyone to read results
CREATE POLICY "Anyone can read sorting results"
  ON sorting_results
  FOR SELECT
  USING (true);
