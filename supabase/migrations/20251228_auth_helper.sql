-- Function to check if email exists (for login flow)
-- Only accessible by service_role (backend) to prevent enumeration attacks from public
CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(email_input text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_input
  );
END;
$$ LANGUAGE plpgsql;

-- Revoke execution from public/anon
REVOKE EXECUTE ON FUNCTION public.check_user_exists_by_email(text) FROM public;
REVOKE EXECUTE ON FUNCTION public.check_user_exists_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_user_exists_by_email(text) FROM authenticated;

-- Grant execution to service_role
GRANT EXECUTE ON FUNCTION public.check_user_exists_by_email(text) TO service_role;
