/*
  # Create function to reset user passwords

  1. New Function
    - `reset_user_password` function that allows admins to reset user passwords
    - Takes user_id and new_password as parameters
    - Updates the password in auth.users table
  
  2. Security
    - Only accessible to authenticated users (admins can call it)
    - Uses SECURITY DEFINER to elevate privileges
*/

-- Create a function to reset user passwords
CREATE OR REPLACE FUNCTION reset_user_password(user_id uuid, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_user_password(uuid, text) TO authenticated;