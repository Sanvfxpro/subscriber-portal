-- Backfill email addresses for existing users
-- This updates the user_profiles table with emails from auth.users

UPDATE public.user_profiles 
SET email = (
  SELECT email 
  FROM auth.users 
  WHERE auth.users.id = user_profiles.id
)
WHERE email IS NULL OR email = '';
