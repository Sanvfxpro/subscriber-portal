-- Fix admin status for your account
-- This will make you an admin so you can see and manage users

-- First, let's see who you are currently logged in as
SELECT 
  auth.uid() as my_user_id,
  email as my_email,
  role as my_current_role
FROM auth.users
LEFT JOIN public.user_profiles ON auth.users.id = user_profiles.id
WHERE auth.users.id = auth.uid();

-- Update YOUR account to admin
-- This uses auth.uid() to automatically target the currently logged-in user
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = auth.uid();

-- Verify the update worked
SELECT 
  id,
  email,
  role,
  created_at
FROM public.user_profiles
WHERE id = auth.uid();

-- Test if you're now an admin
SELECT is_admin() as am_i_admin_now;
