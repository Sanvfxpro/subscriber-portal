/*
  # Fix user_details function data types

  1. Changes
    - Drop and recreate get_user_details function with correct data types
    - email should be varchar instead of text to match auth.users schema
  
  2. Security
    - Maintains SECURITY DEFINER for elevated access
    - Only accessible to authenticated users
*/

-- Drop the existing function and view
DROP VIEW IF EXISTS user_details;
DROP FUNCTION IF EXISTS get_user_details();

-- Create a secure function to get user details with correct types
CREATE OR REPLACE FUNCTION get_user_details()
RETURNS TABLE (
  id uuid,
  email varchar,
  role varchar,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE(ur.role, 'participant')::varchar as role,
    u.created_at
  FROM auth.users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_details() TO authenticated;

-- Create view using the function
CREATE OR REPLACE VIEW user_details AS
SELECT * FROM get_user_details();

-- Grant access to authenticated users
GRANT SELECT ON user_details TO authenticated;