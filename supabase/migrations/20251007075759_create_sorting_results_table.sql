/*
  # Create sorting results table

  1. New Tables
    - `sorting_results`
      - `id` (uuid, primary key, auto-generated)
      - `project_id` (text, not null) - References the project
      - `participant_email` (text, not null) - Email of the participant
      - `result_data` (jsonb, not null) - The complete sorting result as JSON
      - `created_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `sorting_results` table
    - Add policy for anyone to insert results (participants can submit)
    - Add policy for authenticated users to read all results (admins can view)
  
  3. Notes
    - Result data will contain the complete sorting result including categories and cards
    - No authentication required for submission to allow anonymous participation
    - Admins need authentication to view results
*/

CREATE TABLE IF NOT EXISTS sorting_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  participant_email text NOT NULL,
  result_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries by project
CREATE INDEX IF NOT EXISTS idx_sorting_results_project_id 
  ON sorting_results(project_id);

-- Create index for faster queries by email
CREATE INDEX IF NOT EXISTS idx_sorting_results_email 
  ON sorting_results(participant_email);

ALTER TABLE sorting_results ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert results (participants can submit without auth)
CREATE POLICY "Anyone can insert sorting results"
  ON sorting_results
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to read all results (admins)
CREATE POLICY "Authenticated users can read all results"
  ON sorting_results
  FOR SELECT
  TO authenticated
  USING (true);
