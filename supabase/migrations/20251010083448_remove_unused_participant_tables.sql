/*
  # Remove unused participant tables

  1. Changes
    - Drop `participants` table - not used in the application
    - Drop `participant_ids` table - not used in the application
  
  2. Notes
    - These tables were remnants from an earlier design
    - The application uses anonymous participation via email stored in `sorting_results.participant_email`
    - No functionality will be affected by removing these tables
*/

-- Drop unused tables
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS participant_ids CASCADE;
