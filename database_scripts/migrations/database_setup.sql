-- ==========================================
-- SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS
-- SUPABASE - CLÍNICA PSICOLÓGICA (MULTI-TENANT)
-- ==========================================
-- NOTA: Este archivo contiene las tablas, triggers y políticas RLS críticas 
-- que se aplicaron durante la migración para blindar la aplicación.
-- ==========================================

-- 1. TABLA DE INVITACIONES (Gestión de Códigos VIP)
CREATE TABLE IF NOT EXISTS public.invitaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    creado_por UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL UNIQUE,
    rol_asignado TEXT NOT NULL,
    usado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_select_inv" ON public.invitaciones FOR SELECT USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "superadmin_insert_inv" ON public.invitaciones FOR INSERT WITH CHECK ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "superadmin_update_inv" ON public.invitaciones FOR UPDATE USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "superadmin_delete_inv" ON public.invitaciones FOR DELETE USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "user_select_inv" ON public.invitaciones FOR SELECT USING ( clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()) );

-- 2. TRIGGER DE REGISTRO AUTOMÁTICO DE USUARIOS
-- Intercepta registros de Supabase Auth para leer el código VIP y asignar clinica_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  _clinica_id UUID := NULL;
  _rol TEXT := 'admin';
  _invitacion_id UUID;
BEGIN
  IF new.raw_user_meta_data->>'codigo_invitacion' IS NOT NULL THEN
     SELECT id, clinica_id, rol_asignado INTO _invitacion_id, _clinica_id, _rol 
     FROM public.invitaciones 
     WHERE codigo = (new.raw_user_meta_data->>'codigo_invitacion') AND usado = false
     LIMIT 1;
     
     IF _invitacion_id IS NOT NULL THEN
       UPDATE public.invitaciones SET usado = true WHERE id = _invitacion_id;
     END IF;
  END IF;

  INSERT INTO public.usuarios (id, email, nombre, rol, clinica_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nombre', 'Doctor'), 
    _rol, 
    _clinica_id
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Asegurarse de que el trigger esté enlazado al sistema Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. POLÍTICAS RLS INFALIBLES PARA TODAS LAS TABLAS CLÍNICAS
-- Bloquea a los usuarios para que solo vean/editen datos de su propia clínica.

-- CLINICAS (Excepción: SuperAdmin tiene acceso total)
DROP POLICY IF EXISTS "Permitir todo a superadmin" ON public.clinicas;
DROP POLICY IF EXISTS "Permitir leer su propia clinica" ON public.clinicas;
CREATE POLICY "superadmin_select_clinicas" ON public.clinicas FOR SELECT USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "superadmin_insert_clinicas" ON public.clinicas FOR INSERT WITH CHECK ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "superadmin_update_clinicas" ON public.clinicas FOR UPDATE USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "superadmin_delete_clinicas" ON public.clinicas FOR DELETE USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "user_select_clinicas" ON public.clinicas FOR SELECT USING ( id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()) );

-- PACIENTES
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.pacientes;
DROP POLICY IF EXISTS "Permitir leer pacientes de su clinica" ON public.pacientes;
DROP POLICY IF EXISTS "Permitir actualizar pacientes de su clinica" ON public.pacientes;
CREATE POLICY "user_insert_pacientes" ON public.pacientes FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_pacientes" ON public.pacientes FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_pacientes" ON public.pacientes FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- CITAS
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.citas;
DROP POLICY IF EXISTS "Permitir leer citas de su clinica" ON public.citas;
DROP POLICY IF EXISTS "Permitir actualizar citas de su clinica" ON public.citas;
DROP POLICY IF EXISTS "Permitir eliminar citas de su clinica" ON public.citas;
CREATE POLICY "user_insert_citas" ON public.citas FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_citas" ON public.citas FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_citas" ON public.citas FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_citas" ON public.citas FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- DIAGNOSTICOS
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.diagnosticos;
DROP POLICY IF EXISTS "Permitir leer diagnosticos de su clinica" ON public.diagnosticos;
DROP POLICY IF EXISTS "Permitir actualizar diagnosticos de su clinica" ON public.diagnosticos;
CREATE POLICY "user_insert_diagnosticos" ON public.diagnosticos FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_diagnosticos" ON public.diagnosticos FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_diagnosticos" ON public.diagnosticos FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- MEDICAMENTOS
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.medicamentos;
DROP POLICY IF EXISTS "Permitir leer medicamentos de su clinica" ON public.medicamentos;
DROP POLICY IF EXISTS "Permitir actualizar medicamentos de su clinica" ON public.medicamentos;
CREATE POLICY "user_insert_medicamentos" ON public.medicamentos FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_medicamentos" ON public.medicamentos FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_medicamentos" ON public.medicamentos FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- EXAMENES
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.examenes;
DROP POLICY IF EXISTS "Permitir leer examenes de su clinica" ON public.examenes;
DROP POLICY IF EXISTS "Permitir actualizar examenes de su clinica" ON public.examenes;
CREATE POLICY "user_insert_examenes" ON public.examenes FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_examenes" ON public.examenes FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_examenes" ON public.examenes FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- SIGNOS VITALES
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.signos_vitales;
DROP POLICY IF EXISTS "Permitir leer signos de su clinica" ON public.signos_vitales;
CREATE POLICY "user_insert_signos_vitales" ON public.signos_vitales FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_signos_vitales" ON public.signos_vitales FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- NOTAS CLINICAS
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.notas_clinicas;
DROP POLICY IF EXISTS "Permitir leer notas de su clinica" ON public.notas_clinicas;
CREATE POLICY "user_insert_notas_clinicas" ON public.notas_clinicas FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_notas_clinicas" ON public.notas_clinicas FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- 4. COMANDOS MANUALES POST-INSTALACIÓN
-- Si creas un proyecto nuevo, deberás ejecutar este comando una vez registrado 
-- tu primer usuario para otorgarle el rol de "Dueño del Sistema" (SuperAdmin):
-- UPDATE public.usuarios SET rol = 'superadmin' WHERE email = 'tu_correo@admin.com';
-- ==========================================
-- SCRIPT DE MÓDULO DE FACTURACIÓN
-- ==========================================

-- 1. TABLA DE FACTURAS
CREATE TABLE IF NOT EXISTS public.facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    cita_id UUID REFERENCES public.citas(id) ON DELETE SET NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    saldo_pendiente DECIMAL(10,2) NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'pagada', 'parcial', 'cancelada')),
    concepto TEXT NOT NULL,
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
