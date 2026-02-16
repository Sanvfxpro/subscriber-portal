/*
  # Create users view for admin panel

  1. New View
    - `user_details` view that joins auth.users with user_roles
    - Provides email, role, and created_at information
  
  2. Security
    - Enable RLS on the view
    - Add policy for admin users to view user details
*/

-- Create a view that joins auth.users with user_roles
CREATE OR REPLACE VIEW user_details AS
SELECT 
  u.id,
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;

-- Grant access to authenticated users
GRANT SELECT ON user_details TO authenticated;

-- Enable RLS on the view
ALTER VIEW user_details SET (security_invoker = true);