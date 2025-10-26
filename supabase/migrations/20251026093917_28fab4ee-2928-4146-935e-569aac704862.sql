-- Add foreign key relationship between user_roles and profiles
-- This allows Supabase to understand how to join these tables

-- First, drop the existing foreign key to auth.users if it exists
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Add foreign key to profiles table instead
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;