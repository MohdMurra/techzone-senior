-- Create function to assign admin role to specific email
CREATE OR REPLACE FUNCTION assign_admin_role_for_specific_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign admin role to mohdmurra@gmail.com
  IF NEW.email = 'mohdmurra@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
CREATE TRIGGER assign_admin_role_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_admin_role_for_specific_email();