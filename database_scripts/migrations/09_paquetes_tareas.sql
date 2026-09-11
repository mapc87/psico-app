-- 09_paquetes_tareas.sql
-- Migración para Paquetes de Sesiones y Tareas Entre-sesiones

-- 1. Paquetes de Sesiones (Catálogo por Clínica)
CREATE TABLE IF NOT EXISTS public.paquetes_sesiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    num_sesiones INTEGER NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.paquetes_sesiones ENABLE ROW LEVEL SECURITY;

-- Políticas para paquetes_sesiones
CREATE POLICY "Superadmin tiene acceso total a paquetes_sesiones" ON public.paquetes_sesiones
    FOR ALL TO authenticated USING (auth.jwt() ->> 'rol' = 'superadmin');

CREATE POLICY "Usuarios de clínica pueden ver paquetes_sesiones" ON public.paquetes_sesiones
    FOR SELECT TO authenticated USING (clinica_id = (auth.jwt() ->> 'clinica_id')::uuid);

CREATE POLICY "Admins pueden gestionar paquetes_sesiones" ON public.paquetes_sesiones
    FOR ALL TO authenticated USING (
        clinica_id = (auth.jwt() ->> 'clinica_id')::uuid 
        AND auth.jwt() ->> 'rol' = 'admin'
    );


-- 2. Paquetes comprados por el Paciente
CREATE TABLE IF NOT EXISTS public.paciente_paquetes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    paquete_id UUID NOT NULL REFERENCES public.paquetes_sesiones(id) ON DELETE RESTRICT,
    sesiones_restantes INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activo', -- 'activo', 'agotado'
    fecha_compra TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.paciente_paquetes ENABLE ROW LEVEL SECURITY;

-- Políticas para paciente_paquetes
CREATE POLICY "Superadmin tiene acceso total a paciente_paquetes" ON public.paciente_paquetes
    FOR ALL TO authenticated USING (auth.jwt() ->> 'rol' = 'superadmin');

CREATE POLICY "Usuarios de clínica pueden gestionar paciente_paquetes" ON public.paciente_paquetes
    FOR ALL TO authenticated USING (clinica_id = (auth.jwt() ->> 'clinica_id')::uuid);


-- 3. Tareas del Paciente (Entre-sesiones)
CREATE TABLE IF NOT EXISTS public.tareas_paciente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'completada'
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_completada TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.tareas_paciente ENABLE ROW LEVEL SECURITY;

-- Políticas para tareas_paciente
CREATE POLICY "Superadmin tiene acceso total a tareas_paciente" ON public.tareas_paciente
    FOR ALL TO authenticated USING (auth.jwt() ->> 'rol' = 'superadmin');

CREATE POLICY "Usuarios de clínica pueden gestionar tareas_paciente" ON public.tareas_paciente
    FOR ALL TO authenticated USING (clinica_id = (auth.jwt() ->> 'clinica_id')::uuid);
