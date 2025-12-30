-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Update trigger function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger as $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'username', 
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email; -- Ensure email is synced if profile exists
  RETURN new;
END;
$$ language plpgsql security definer;

-- 3. Sync existing emails from auth.users to public.profiles
-- We need to bypass RLS or ensure we have permissions. 
-- Since this is run by admin script, it should be fine.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;
