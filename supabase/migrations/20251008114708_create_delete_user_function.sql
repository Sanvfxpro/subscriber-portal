/*
  # Create function to delete users from auth

  1. New Function
    - `delete_user` function that allows admins to delete users from auth.users
    - Takes user_id as parameter
  
  2. Security
    - Only accessible to authenticated users (admins can call it)
*/

-- Create a function to delete users from auth.users
CREATE OR REPLACE FUNCTION delete_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user(uuid) TO authenticated;