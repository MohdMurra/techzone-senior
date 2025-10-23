-- Add INSERT policy for orders table to prevent unauthorized order creation
CREATE POLICY "Users can create own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);