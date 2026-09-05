-- ==========================================
-- SCRIPT DE MÓDULO DE FACTURACIÓN
-- ==========================================

-- 1. TABLA DE FACTURAS
CREATE TABLE IF NOT EXISTS public.facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
    cita_id UUID REFERENCES public.citas(id) ON DELETE SET NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    saldo_pendiente DECIMAL(10,2) NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'pagada', 'parcial', 'cancelada')),
    concepto TEXT NOT NULL,
    nit TEXT DEFAULT 'CF',
    nombre_factura TEXT,
    direccion TEXT DEFAULT 'Ciudad',
    numero_factura TEXT,
    serie TEXT,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para Facturas
CREATE POLICY "user_select_facturas" ON public.facturas FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_insert_facturas" ON public.facturas FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_facturas" ON public.facturas FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_facturas" ON public.facturas FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- 2. TABLA DE PAGOS
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'seguro')),
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para Pagos
CREATE POLICY "user_select_pagos" ON public.pagos FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_insert_pagos" ON public.pagos FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_pagos" ON public.pagos FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_pagos" ON public.pagos FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
