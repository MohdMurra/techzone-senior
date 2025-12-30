-- Create flash_sales table for limited time offers
CREATE TABLE public.flash_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  original_price NUMERIC(10,2) NOT NULL,
  sale_price NUMERIC(10,2) NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  stock_limit INTEGER,
  sold_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

-- Everyone can view active flash sales
CREATE POLICY "Flash sales are viewable by everyone" 
ON public.flash_sales 
FOR SELECT 
USING (is_active = true AND ends_at > now());

-- Only admins can manage flash sales
CREATE POLICY "Admins can manage flash sales" 
ON public.flash_sales 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for performance
CREATE INDEX idx_flash_sales_active ON public.flash_sales(is_active, ends_at);
CREATE INDEX idx_flash_sales_product ON public.flash_sales(product_id);

-- Enable realtime for flash sales updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.flash_sales;