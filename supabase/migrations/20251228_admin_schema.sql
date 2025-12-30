-- Add Role and Status to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
ADD COLUMN IF NOT EXISTS phone text;

-- Add Fields to Routes
ALTER TABLE public.routes
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'offline')),
ADD COLUMN IF NOT EXISTS start_point text,
ADD COLUMN IF NOT EXISTS end_point text,
ADD COLUMN IF NOT EXISTS waypoints text, -- Stored as comma separated string or JSON
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS description text;

-- Create Policy for Admins (Assuming we use a service role in backend, but good for RLS)
-- We will use a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Policies to allow Admins full access
CREATE POLICY "Admins can do everything on profiles"
ON public.profiles
FOR ALL
USING (public.is_admin());

CREATE POLICY "Admins can do everything on routes"
ON public.routes
FOR ALL
USING (public.is_admin());
