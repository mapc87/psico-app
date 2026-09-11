-- ==========================================
-- MÓDULO DE CAJA Y MOVIMIENTOS
-- ==========================================

-- Tabla de Turnos de Caja
CREATE TABLE IF NOT EXISTS public.cajas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    usuario_apertura_id UUID NOT NULL REFERENCES public.usuarios(id),
    usuario_cierre_id UUID REFERENCES public.usuarios(id),
    monto_apertura DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monto_cierre_esperado DECIMAL(10,2),
    monto_cierre_real DECIMAL(10,2),
    diferencia DECIMAL(10,2),
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    estado TEXT NOT NULL CHECK (estado IN ('abierta', 'cerrada')) DEFAULT 'abierta',
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;

-- Políticas para Cajas
CREATE POLICY "user_select_cajas" ON public.cajas FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_insert_cajas" ON public.cajas FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_cajas" ON public.cajas FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_cajas" ON public.cajas FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- Tabla de Movimientos de Caja (Libro Mayor)
CREATE TABLE IF NOT EXISTS public.movimientos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_id UUID NOT NULL REFERENCES public.cajas(id) ON DELETE CASCADE,
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro')),
    concepto TEXT NOT NULL,
    referencia_id UUID, -- Opcional: Puede ser el ID de un pago, factura, etc.
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.movimientos_caja ENABLE ROW LEVEL SECURITY;

-- Políticas para Movimientos
CREATE POLICY "user_select_movimientos" ON public.movimientos_caja FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_insert_movimientos" ON public.movimientos_caja FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_movimientos" ON public.movimientos_caja FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_movimientos" ON public.movimientos_caja FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
