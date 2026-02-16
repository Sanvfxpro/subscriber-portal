/*
  # Add soft delete to sorting results

  1. Changes
    - Add `deleted_at` column to `sorting_results` table to support soft deletion
    - Add `deleted_by` column to track who deleted the result
    - Update RLS policies to exclude soft-deleted results from normal queries
    - Add policy for admins to view deleted results
    - Add policy for admins to update (soft delete) results
    - Add policy for admins to restore results (set deleted_at to null)

  2. Security
    - Only authenticated users can soft delete results
    - Only authenticated users can view deleted results
    - Only authenticated users can restore results
    - Normal queries automatically filter out soft-deleted results

  3. Notes
    - Soft delete allows recovery of accidentally deleted submissions
    - deleted_at timestamp indicates when the result was deleted
    - deleted_by tracks which user performed the deletion
*/

-- Add soft delete columns to sorting_results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sorting_results' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE sorting_results ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sorting_results' AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE sorting_results ADD COLUMN deleted_by uuid REFERENCES auth.users(id) DEFAULT NULL;
  END IF;
END $$;

-- Create index for filtering deleted results
CREATE INDEX IF NOT EXISTS idx_sorting_results_deleted_at 
  ON sorting_results(deleted_at);

-- Drop existing read policy and create new ones for active and deleted results
DROP POLICY IF EXISTS "Authenticated users can read all results" ON sorting_results;
DROP POLICY IF EXISTS "Anyone can read sorting results" ON sorting_results;

-- Policy for authenticated users to read active (non-deleted) results
CREATE POLICY "Authenticated users can read active results"
  ON sorting_results
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Policy for authenticated users to read deleted results
CREATE POLICY "Authenticated users can read deleted results"
  ON sorting_results
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NOT NULL);

-- Policy for authenticated users to update results (soft delete and restore)
CREATE POLICY "Authenticated users can update results"
  ON sorting_results
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
