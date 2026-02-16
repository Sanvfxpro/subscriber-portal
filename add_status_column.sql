-- Add status column to sorting_results
ALTER TABLE sorting_results 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

-- Add check constraint to ensure valid status values
ALTER TABLE sorting_results 
ADD CONSTRAINT check_status CHECK (status IN ('draft', 'completed'));
