-- Migración para Facturación en Guatemala (NIT, Nombre, Dirección, FEL)
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS direccion TEXT DEFAULT 'Ciudad';
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS numero_factura TEXT;
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS serie TEXT;
