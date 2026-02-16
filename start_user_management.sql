-- 1. Add email column to user_profiles if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email text;

-- 2. Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, email)
  VALUES (new.id, 'user', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill existing emails (This is tricky without admin rights, but we can try)
-- If this fails, new users will work fine, but old users might have null emails in profiles.
-- UPDATE user_profiles SET email = auth.users.email FROM auth.users WHERE user_profiles.id = auth.users.id;
