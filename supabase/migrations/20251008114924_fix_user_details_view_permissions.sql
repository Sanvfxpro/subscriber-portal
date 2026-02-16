/*
  # Fix user_details view permissions

  1. Changes
    - Drop the existing view and recreate with proper security
    - Use SECURITY DEFINER to allow access to auth.users table
  
  2. Security
    - View runs with elevated privileges to access auth.users
    - Only accessible to authenticated users
*/

-- Drop the existing view
DROP VIEW IF EXISTS user_details;

-- Create a secure function to get user details
CREATE OR REPLACE FUNCTION get_user_details()
RETURNS TABLE (
  id uuid,
  email text,
  role text,
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
    COALESCE(ur.role, 'participant') as role,
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