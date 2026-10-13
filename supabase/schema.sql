-- RoofFlow — kompletny schemat Supabase z RLS
-- Uruchom w SQL Editor w projekcie Supabase.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- TABELA TENANTS (Firmy B2B)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#0F766E',
  phone TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  plan_tier TEXT DEFAULT 'starter',
  has_insulation_addon BOOLEAN DEFAULT false,
  has_facade_addon BOOLEAN DEFAULT false,
  custom_domain TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS tenants_user_id_idx ON tenants(user_id);
CREATE INDEX IF NOT EXISTS tenants_slug_idx ON tenants(slug);
CREATE INDEX IF NOT EXISTS tenants_custom_domain_idx ON tenants(custom_domain);

-- TABELA PRICING_CONFIGS (Cenniki firm)
CREATE TABLE IF NOT EXISTS pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  base_labor_rate NUMERIC DEFAULT 80,
  timber_rate NUMERIC DEFAULT 1200,
  tile_rates JSONB DEFAULT '{"budget": 45, "standard": 75, "premium": 120}'::jsonb,
  insulation_rates JSONB DEFAULT '{"wool": 60, "pur": 85, "pir": 110}'::jsonb,
  facade_rates JSONB DEFAULT '{"styrofoam": 90, "wool": 140}'::jsonb,
  margin_buffer NUMERIC DEFAULT 0.08,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABELA LEADS (Zapytania od klientów dekarza)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  location TEXT,
  schedule TEXT,
  roof_type TEXT,
  roof_area_m2 NUMERIC,
  insulation_area_m2 NUMERIC,
  facade_area_m2 NUMERIC,
  est_price_min NUMERIC,
  est_price_max NUMERIC,
  project_file_url TEXT,
  status TEXT DEFAULT 'new',
  calculation_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS leads_tenant_id_idx ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);

-- TABELA B2C_ORDERS (Zakupy wycen 59/78/87 zł)
CREATE TABLE IF NOT EXISTS b2c_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  client_email TEXT NOT NULL,
  calculation_data JSONB NOT NULL,
  amount_paid NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- WŁĄCZENIE RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2c_orders ENABLE ROW LEVEL SECURITY;

-- POLITYKI RLS — tenants
DROP POLICY IF EXISTS "Użytkownik widzi tylko swój profil tenant" ON tenants;
CREATE POLICY "Użytkownik widzi tylko swój profil tenant" ON tenants
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Publiczny odczyt tenanta po slug (widget)
DROP POLICY IF EXISTS "Publiczny odczyt tenanta po slug" ON tenants;
CREATE POLICY "Publiczny odczyt tenanta po slug" ON tenants
  FOR SELECT USING (true);

-- POLITYKI RLS — pricing_configs
DROP POLICY IF EXISTS "Użytkownik zarządza swoim cennikiem" ON pricing_configs;
CREATE POLICY "Użytkownik zarządza swoim cennikiem" ON pricing_configs
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Publiczny odczyt cennika widgetu" ON pricing_configs;
CREATE POLICY "Publiczny odczyt cennika widgetu" ON pricing_configs
  FOR SELECT USING (true);

-- POLITYKI RLS — leads
DROP POLICY IF EXISTS "Użytkownik widzi tylko swoje leady" ON leads;
CREATE POLICY "Użytkownik widzi tylko swoje leady" ON leads
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Publiczny zapis leadów z widgetu" ON leads;
CREATE POLICY "Publiczny zapis leadów z widgetu" ON leads
  FOR INSERT WITH CHECK (true);

-- POLITYKI RLS — b2c_orders (tylko service role / webhook)
DROP POLICY IF EXISTS "Brak bezpośredniego dostępu użytkownika do zamówień B2C" ON b2c_orders;
CREATE POLICY "Brak bezpośredniego dostępu użytkownika do zamówień B2C" ON b2c_orders
  FOR SELECT USING (false);

-- Trigger: automatyczny cennik po utworzeniu tenanta
CREATE OR REPLACE FUNCTION public.handle_new_tenant_pricing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO pricing_configs (tenant_id)
  VALUES (NEW.id)
  ON CONFLICT (tenant_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_tenant_created_pricing ON tenants;
CREATE TRIGGER on_tenant_created_pricing
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_tenant_pricing();
