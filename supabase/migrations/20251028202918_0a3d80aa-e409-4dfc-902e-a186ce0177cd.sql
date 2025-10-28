-- Allow anyone to view profiles (needed for community builds page to show creator names)
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
USING (true);