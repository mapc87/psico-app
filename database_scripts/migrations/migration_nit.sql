-- Migración para Facturación en Guatemala (NIT y Nombre)
ALTER TABLE public.facturas ALTER COLUMN paciente_id DROP NOT NULL;
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS nit TEXT DEFAULT 'CF';
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS nombre_factura TEXT;
