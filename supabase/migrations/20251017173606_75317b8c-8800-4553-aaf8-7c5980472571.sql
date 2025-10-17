-- Add sample product images and seed more products with actual image URLs
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800' WHERE category = 'laptop';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800' WHERE category = 'cpu';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800' WHERE category = 'gpu';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800' WHERE category = 'motherboard';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1541348263662-e068662d82af?w=800' WHERE category = 'ram';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800' WHERE category = 'storage';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587202372583-49330a15584d?w=800' WHERE category = 'psu';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800' WHERE category = 'case';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800' WHERE category = 'cooler';

-- Create user_roles table for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'customer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update products RLS to allow admins full access
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update orders RLS
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));