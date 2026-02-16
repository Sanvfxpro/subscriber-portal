/*
  # Create participants table

  1. New Tables
    - `participants`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `participants` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to update their own data
*/

CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own participant data"
  ON participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own participant data"
  ON participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own participant data"
  ON participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
