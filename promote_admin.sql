-- update the role of a user to 'admin' based on their email
-- Replace 'PUT_EMAIL_HERE' with the email address of the second admin

UPDATE public.user_profiles
SET role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'PUT_EMAIL_HERE'
);
