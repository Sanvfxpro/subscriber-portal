-- Create 'sorting_results' table
CREATE TABLE IF NOT EXISTS sorting_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  participant_email text NOT NULL,
  result_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  deleted_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_sorting_results_project_id ON sorting_results(project_id);

ALTER TABLE sorting_results ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE (including our import script) to insert and read results
-- You can restrict this later if needed.
CREATE POLICY "Public insert access" ON sorting_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read access" ON sorting_results FOR SELECT USING (true);
CREATE POLICY "Public update access" ON sorting_results FOR UPDATE USING (true);
