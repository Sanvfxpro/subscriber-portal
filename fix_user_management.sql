-- Complete fix for User Management
-- Run this entire script in Supabase SQL Editor

-- Step 1: Backfill email addresses for existing users
UPDATE public.user_profiles 
SET email = (
  SELECT email 
  FROM auth.users 
  WHERE auth.users.id = user_profiles.id
)
WHERE email IS NULL OR email = '';

-- Step 2: Verify users exist (this should show all users)
SELECT id, email, role, created_at 
FROM public.user_profiles;

-- Step 3: Check if current user is admin
SELECT id, email, role 
FROM public.user_profiles 
WHERE id = auth.uid();

-- Step 4: Test if is_admin() function works
SELECT is_admin() as am_i_admin;
