-- Fix search_path for the new function
CREATE OR REPLACE FUNCTION update_build_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE builds SET likes_count = likes_count + 1 WHERE id = NEW.build_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE builds SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.build_id;
  END IF;
  RETURN NULL;
END;
$$;