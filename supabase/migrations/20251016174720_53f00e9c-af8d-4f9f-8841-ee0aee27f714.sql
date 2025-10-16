-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE product_category AS ENUM ('laptop', 'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler', 'monitor', 'keyboard', 'mouse', 'headset');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'manager');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'customer' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category product_category NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  stock INTEGER DEFAULT 0 NOT NULL,
  image_url TEXT,
  specs JSONB DEFAULT '{}'::jsonb,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- PC Builds table
CREATE TABLE public.builds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  components JSONB DEFAULT '{}'::jsonb NOT NULL,
  total_price DECIMAL(10,2),
  is_public BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own builds" ON public.builds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public builds" ON public.builds
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own builds" ON public.builds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own builds" ON public.builds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own builds" ON public.builds
  FOR DELETE USING (auth.uid() = user_id);

-- Cart items table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status order_status DEFAULT 'pending' NOT NULL,
  shipping_address JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage orders" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_builds_updated_at BEFORE UPDATE ON public.builds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed some sample products
INSERT INTO public.products (name, slug, description, category, price, sale_price, stock, featured, specs, image_url) VALUES
('Gaming Laptop Pro X1', 'gaming-laptop-pro-x1', 'High-performance gaming laptop with RTX 4080', 'laptop', 2499.99, 2299.99, 15, true, '{"cpu": "Intel i9-13900H", "gpu": "RTX 4080", "ram": "32GB DDR5", "storage": "1TB NVMe", "screen": "17.3\" QHD 240Hz"}', '/placeholder.svg'),
('Workstation Elite', 'workstation-elite', 'Professional workstation for content creators', 'laptop', 3299.99, NULL, 8, true, '{"cpu": "Intel i9-13980HX", "gpu": "RTX 4090", "ram": "64GB DDR5", "storage": "2TB NVMe", "screen": "16\" 4K OLED"}', '/placeholder.svg'),
('AMD Ryzen 9 7950X', 'amd-ryzen-9-7950x', '16-core processor for high-end builds', 'cpu', 699.99, 649.99, 25, true, '{"cores": 16, "threads": 32, "base_clock": "4.5GHz", "boost_clock": "5.7GHz", "socket": "AM5", "tdp": 170}', '/placeholder.svg'),
('Intel Core i9-14900K', 'intel-core-i9-14900k', '24-core flagship processor', 'cpu', 589.99, NULL, 20, false, '{"cores": 24, "threads": 32, "base_clock": "3.2GHz", "boost_clock": "6.0GHz", "socket": "LGA1700", "tdp": 253}', '/placeholder.svg'),
('NVIDIA RTX 4090', 'nvidia-rtx-4090', 'Ultimate gaming graphics card', 'gpu', 1599.99, NULL, 10, true, '{"vram": "24GB GDDR6X", "cuda_cores": 16384, "boost_clock": "2.52GHz", "tdp": 450, "length": "304mm"}', '/placeholder.svg'),
('AMD RX 7900 XTX', 'amd-rx-7900-xtx', 'High-end AMD graphics card', 'gpu', 999.99, 949.99, 18, false, '{"vram": "24GB GDDR6", "compute_units": 96, "boost_clock": "2.5GHz", "tdp": 355, "length": "287mm"}', '/placeholder.svg'),
('ASUS ROG Strix Z790', 'asus-rog-strix-z790', 'Premium Intel motherboard', 'motherboard', 449.99, NULL, 12, false, '{"socket": "LGA1700", "chipset": "Z790", "ram_type": "DDR5", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 3, "m2_slots": 4, "form_factor": "ATX"}', '/placeholder.svg'),
('MSI X670E Tomahawk', 'msi-x670e-tomahawk', 'High-performance AMD motherboard', 'motherboard', 389.99, 369.99, 15, false, '{"socket": "AM5", "chipset": "X670E", "ram_type": "DDR5", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 2, "m2_slots": 4, "form_factor": "ATX"}', '/placeholder.svg'),
('Corsair Vengeance 32GB', 'corsair-vengeance-32gb', 'DDR5 RAM kit 6000MHz', 'ram', 159.99, 149.99, 40, false, '{"capacity": "32GB", "type": "DDR5", "speed": "6000MHz", "modules": 2, "cas_latency": "CL36"}', '/placeholder.svg'),
('Samsung 990 Pro 2TB', 'samsung-990-pro-2tb', 'Ultra-fast NVMe SSD', 'storage', 199.99, NULL, 30, true, '{"capacity": "2TB", "type": "NVMe", "interface": "PCIe 4.0", "read_speed": "7450MB/s", "write_speed": "6900MB/s", "form_factor": "M.2"}', '/placeholder.svg'),
('Corsair RM1000e', 'corsair-rm1000e', '1000W 80+ Gold PSU', 'psu', 179.99, 169.99, 22, false, '{"wattage": 1000, "efficiency": "80+ Gold", "modular": true, "form_factor": "ATX"}', '/placeholder.svg'),
('NZXT H7 Flow', 'nzxt-h7-flow', 'Mid-tower case with airflow', 'case', 129.99, NULL, 18, false, '{"form_factor": "ATX", "gpu_clearance": "400mm", "cpu_cooler_height": "185mm", "fans_included": 3}', '/placeholder.svg'),
('Noctua NH-D15', 'noctua-nh-d15', 'Premium air cooler', 'cooler', 109.99, NULL, 25, false, '{"type": "Air", "height": "165mm", "tdp": 250, "socket_support": ["AM5", "LGA1700"]}', '/placeholder.svg');
