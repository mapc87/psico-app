-- ==========================================
-- SCRIPT UNIFICADO / INICIALIZACIÓN COMPLETA
-- SUPABASE - CLÍNICA PSICOLÓGICA (MULTI-TENANT)
-- ==========================================
-- Este script reemplaza a los 19 archivos anteriores
-- (init_database_full.sql + migraciones). Contiene TODO:
-- facturación, invitaciones, RLS, plantillas/consentimientos,
-- evaluaciones psicométricas, videoconsultas, perfil de usuario,
-- control de caja, paquetes/tareas y archivos de pacientes.
--
-- Es IDEMPOTENTE: se puede ejecutar varias veces sin errores
-- (usa IF EXISTS / IF NOT EXISTS / guardianes en los seeds).
--
-- PRERREQUISITO: el proyecto debe tener ya las TABLAS BASE:
--   public.clinicas, public.usuarios, public.pacientes,
--   public.citas, public.diagnosticos, public.medicamentos,
--   public.examenes, public.signos_vitales, public.notas_clinicas
-- (no se crean aquí; existen desde el setup inicial del proyecto).
--
-- POST-INSTALACIÓN (inicio de proyecto nuevo):
--   Tras registrar tu primer usuario, promuévelo a SuperAdmin:
--   UPDATE public.usuarios SET rol = 'superadmin' WHERE email = 'tu_correo@admin.com';
-- ==========================================

-- Extensión requerida por uuid_generate_v4() en algunos módulos
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- 1. MÓDULO FACTURACIÓN (Facturas + Pagos)
-- ==========================================

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

ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

-- Ajustes para bases existentes (facturación Guatemala: NIT / FEL)
ALTER TABLE public.facturas ALTER COLUMN paciente_id DROP NOT NULL;
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS nit TEXT DEFAULT 'CF';
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS nombre_factura TEXT;
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS direccion TEXT DEFAULT 'Ciudad';
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS numero_factura TEXT;
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS serie TEXT;

DROP POLICY IF EXISTS "user_select_facturas" ON public.facturas;
DROP POLICY IF EXISTS "user_insert_facturas" ON public.facturas;
DROP POLICY IF EXISTS "user_update_facturas" ON public.facturas;
DROP POLICY IF EXISTS "user_delete_facturas" ON public.facturas;
CREATE POLICY "user_select_facturas" ON public.facturas FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_insert_facturas" ON public.facturas FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_facturas" ON public.facturas FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_facturas" ON public.facturas FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'seguro')),
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_select_pagos" ON public.pagos;
DROP POLICY IF EXISTS "user_insert_pagos" ON public.pagos;
DROP POLICY IF EXISTS "user_update_pagos" ON public.pagos;
DROP POLICY IF EXISTS "user_delete_pagos" ON public.pagos;
CREATE POLICY "user_select_pagos" ON public.pagos FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_insert_pagos" ON public.pagos FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_pagos" ON public.pagos FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_pagos" ON public.pagos FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- ==========================================
-- 2. DATOS COMERCIALES / FISCALES Y EMAIL DE CLÍNICAS
-- ==========================================

ALTER TABLE public.clinicas
  ADD COLUMN IF NOT EXISTS nit VARCHAR(20),
  ADD COLUMN IF NOT EXISTS razon_social VARCHAR(255),
  ADD COLUMN IF NOT EXISTS nombre_comercial VARCHAR(255),
  ADD COLUMN IF NOT EXISTS direccion_fiscal TEXT,
  ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(50),
  ADD COLUMN IF NOT EXISTS no_patente VARCHAR(100),
  ADD COLUMN IF NOT EXISTS abreviatura VARCHAR(50);

ALTER TABLE public.clinicas
  ADD COLUMN IF NOT EXISTS resend_api_key TEXT,
  ADD COLUMN IF NOT EXISTS email_remitente TEXT;

-- ==========================================
-- 3. INVITACIONES (Códigos VIP) + RLS
-- ==========================================

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

DROP POLICY IF EXISTS "superadmin_select_inv" ON public.invitaciones;
DROP POLICY IF EXISTS "superadmin_insert_inv" ON public.invitaciones;
DROP POLICY IF EXISTS "superadmin_update_inv" ON public.invitaciones;
DROP POLICY IF EXISTS "superadmin_delete_inv" ON public.invitaciones;
DROP POLICY IF EXISTS "user_select_inv" ON public.invitaciones;
DROP POLICY IF EXISTS "admin_insert_inv" ON public.invitaciones;
DROP POLICY IF EXISTS "admin_delete_inv" ON public.invitaciones;

CREATE POLICY "superadmin_select_inv" ON public.invitaciones FOR SELECT USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "superadmin_insert_inv" ON public.invitaciones FOR INSERT WITH CHECK ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "superadmin_update_inv" ON public.invitaciones FOR UPDATE USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "superadmin_delete_inv" ON public.invitaciones FOR DELETE USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "user_select_inv" ON public.invitaciones FOR SELECT USING ( clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()) );
CREATE POLICY "admin_insert_inv" ON public.invitaciones FOR INSERT WITH CHECK (
  (SELECT rol FROM public.usuarios WHERE id = auth.uid()) IN ('admin', 'doctor') AND
  clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid())
);
CREATE POLICY "admin_delete_inv" ON public.invitaciones FOR DELETE USING (
  (SELECT rol FROM public.usuarios WHERE id = auth.uid()) IN ('admin', 'doctor') AND
  clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid())
);

-- ==========================================
-- 4. TRIGGER DE REGISTRO AUTOMÁTICO DE USUARIOS
-- Intercepta registros de Supabase Auth para leer el código VIP
-- y asignar clinica_id / rol.
-- ==========================================

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 5. POLÍTICAS RLS DE TABLAS CLÍNICAS
-- Cada usuario solo ve/edita datos de su propia clínica.
-- SuperAdmin tiene acceso total (excepción en clinicas).
-- ==========================================

-- CLINICAS
DROP POLICY IF EXISTS "Permitir todo a superadmin" ON public.clinicas;
DROP POLICY IF EXISTS "Permitir leer su propia clinica" ON public.clinicas;
DROP POLICY IF EXISTS "superadmin_select_clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "superadmin_insert_clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "superadmin_update_clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "superadmin_delete_clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "user_select_clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "admin_update_clinicas" ON public.clinicas;

CREATE POLICY "superadmin_select_clinicas" ON public.clinicas FOR SELECT USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "superadmin_insert_clinicas" ON public.clinicas FOR INSERT WITH CHECK ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "superadmin_update_clinicas" ON public.clinicas FOR UPDATE USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "superadmin_delete_clinicas" ON public.clinicas FOR DELETE USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );
CREATE POLICY "user_select_clinicas" ON public.clinicas FOR SELECT USING ( id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()) );
CREATE POLICY "admin_update_clinicas" ON public.clinicas FOR UPDATE USING (
  id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid())
  AND (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin'
);

-- PACIENTES
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.pacientes;
DROP POLICY IF EXISTS "Permitir leer pacientes de su clinica" ON public.pacientes;
DROP POLICY IF EXISTS "Permitir actualizar pacientes de su clinica" ON public.pacientes;
DROP POLICY IF EXISTS "user_insert_pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "user_select_pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "user_update_pacientes" ON public.pacientes;
CREATE POLICY "user_insert_pacientes" ON public.pacientes FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_pacientes" ON public.pacientes FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_pacientes" ON public.pacientes FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- CITAS
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.citas;
DROP POLICY IF EXISTS "Permitir leer citas de su clinica" ON public.citas;
DROP POLICY IF EXISTS "Permitir actualizar citas de su clinica" ON public.citas;
DROP POLICY IF EXISTS "Permitir eliminar citas de su clinica" ON public.citas;
DROP POLICY IF EXISTS "user_insert_citas" ON public.citas;
DROP POLICY IF EXISTS "user_select_citas" ON public.citas;
DROP POLICY IF EXISTS "user_update_citas" ON public.citas;
DROP POLICY IF EXISTS "user_delete_citas" ON public.citas;
CREATE POLICY "user_insert_citas" ON public.citas FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_citas" ON public.citas FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_citas" ON public.citas FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_citas" ON public.citas FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- DIAGNOSTICOS
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.diagnosticos;
DROP POLICY IF EXISTS "Permitir leer diagnosticos de su clinica" ON public.diagnosticos;
DROP POLICY IF EXISTS "Permitir actualizar diagnosticos de su clinica" ON public.diagnosticos;
DROP POLICY IF EXISTS "user_insert_diagnosticos" ON public.diagnosticos;
DROP POLICY IF EXISTS "user_select_diagnosticos" ON public.diagnosticos;
DROP POLICY IF EXISTS "user_update_diagnosticos" ON public.diagnosticos;
CREATE POLICY "user_insert_diagnosticos" ON public.diagnosticos FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_diagnosticos" ON public.diagnosticos FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_diagnosticos" ON public.diagnosticos FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- MEDICAMENTOS
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.medicamentos;
DROP POLICY IF EXISTS "Permitir leer medicamentos de su clinica" ON public.medicamentos;
DROP POLICY IF EXISTS "Permitir actualizar medicamentos de su clinica" ON public.medicamentos;
DROP POLICY IF EXISTS "user_insert_medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "user_select_medicamentos" ON public.medicamentos;
DROP POLICY IF EXISTS "user_update_medicamentos" ON public.medicamentos;
CREATE POLICY "user_insert_medicamentos" ON public.medicamentos FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_medicamentos" ON public.medicamentos FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_medicamentos" ON public.medicamentos FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- EXAMENES
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.examenes;
DROP POLICY IF EXISTS "Permitir leer examenes de su clinica" ON public.examenes;
DROP POLICY IF EXISTS "Permitir actualizar examenes de su clinica" ON public.examenes;
DROP POLICY IF EXISTS "user_insert_examenes" ON public.examenes;
DROP POLICY IF EXISTS "user_select_examenes" ON public.examenes;
DROP POLICY IF EXISTS "user_update_examenes" ON public.examenes;
CREATE POLICY "user_insert_examenes" ON public.examenes FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_examenes" ON public.examenes FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_examenes" ON public.examenes FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- SIGNOS VITALES
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.signos_vitales;
DROP POLICY IF EXISTS "Permitir leer signos de su clinica" ON public.signos_vitales;
DROP POLICY IF EXISTS "user_insert_signos_vitales" ON public.signos_vitales;
DROP POLICY IF EXISTS "user_select_signos_vitales" ON public.signos_vitales;
CREATE POLICY "user_insert_signos_vitales" ON public.signos_vitales FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_signos_vitales" ON public.signos_vitales FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- NOTAS CLINICAS
DROP POLICY IF EXISTS "Permitir insertar a su clinica" ON public.notas_clinicas;
DROP POLICY IF EXISTS "Permitir leer notas de su clinica" ON public.notas_clinicas;
DROP POLICY IF EXISTS "user_insert_notas_clinicas" ON public.notas_clinicas;
DROP POLICY IF EXISTS "user_select_notas_clinicas" ON public.notas_clinicas;
CREATE POLICY "user_insert_notas_clinicas" ON public.notas_clinicas FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_select_notas_clinicas" ON public.notas_clinicas FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- ==========================================
-- 6. PLANTILLAS DE DOCUMENTOS Y CONSENTIMIENTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.plantillas_documentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  contenido text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.plantillas_documentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_select_plantillas" ON public.plantillas_documentos;
DROP POLICY IF EXISTS "user_insert_plantillas" ON public.plantillas_documentos;
DROP POLICY IF EXISTS "user_update_plantillas" ON public.plantillas_documentos;
DROP POLICY IF EXISTS "user_delete_plantillas" ON public.plantillas_documentos;
CREATE POLICY "user_select_plantillas" ON public.plantillas_documentos FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_insert_plantillas" ON public.plantillas_documentos FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_plantillas" ON public.plantillas_documentos FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_plantillas" ON public.plantillas_documentos FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.consentimientos_firmados (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE,
  plantilla_id uuid REFERENCES public.plantillas_documentos(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  contenido_firmado text NOT NULL,
  firma_data_url text NOT NULL,
  fecha_firma timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  estado text DEFAULT 'firmado' CHECK (estado IN ('pendiente', 'firmado'))
);

ALTER TABLE public.consentimientos_firmados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_select_consentimientos" ON public.consentimientos_firmados;
DROP POLICY IF EXISTS "user_insert_consentimientos" ON public.consentimientos_firmados;
DROP POLICY IF EXISTS "public_update_consentimientos_pendientes" ON public.consentimientos_firmados;
DROP POLICY IF EXISTS "public_select_consentimientos_pendientes" ON public.consentimientos_firmados;
CREATE POLICY "user_select_consentimientos" ON public.consentimientos_firmados FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_insert_consentimientos" ON public.consentimientos_firmados FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "public_update_consentimientos_pendientes" ON public.consentimientos_firmados FOR UPDATE USING (estado = 'pendiente');
CREATE POLICY "public_select_consentimientos_pendientes" ON public.consentimientos_firmados FOR SELECT USING (estado = 'pendiente');

-- Plantilla por defecto (autocreada al crear una clínica)
CREATE OR REPLACE FUNCTION public.crear_plantilla_defecto()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.plantillas_documentos (clinica_id, titulo, contenido)
  VALUES (
    NEW.id,
    'Consentimiento Informado General (Adultos)',
    'CONSENTIMIENTO INFORMADO PARA EVALUACIÓN Y TRATAMIENTO PSICOLÓGICO

1. IDENTIFICACIÓN
Yo, {{PACIENTE_NOMBRE}}, autorizo libre y voluntariamente a participar en el proceso de evaluación y tratamiento psicológico.

2. NATURALEZA DEL SERVICIO
Entiendo que el tratamiento psicológico es una relación colaborativa. Los resultados dependen en gran medida de mi participación activa. El profesional utilizará técnicas basadas en evidencia científica orientadas a mi bienestar.

3. CONFIDENCIALIDAD
Toda la información revelada durante las sesiones será estrictamente confidencial. Las únicas excepciones legales para romper esta confidencialidad son:
- Riesgo inminente contra mi propia vida o la vida de terceros.
- Sospecha de abuso a menores de edad o personas vulnerables.
- Requerimiento u orden de un juez.

4. POLÍTICAS DE CANCELACIÓN Y HONORARIOS
Me comprometo a notificar cualquier cancelación con al menos 24 horas de anticipación. De lo contrario, la sesión podrá ser cobrada en su totalidad. Entiendo las tarifas acordadas y me comprometo a cumplir con los pagos de manera oportuna.

5. VOLUNTARIEDAD
Entiendo que mi participación es totalmente voluntaria y tengo el derecho de retirar este consentimiento y finalizar el tratamiento en el momento que lo considere necesario, sin que esto implique penalización alguna.

Con mi firma abajo, declaro que he leído, comprendido y aceptado las condiciones aquí expuestas, habiendo tenido la oportunidad de aclarar cualquier duda con mi terapeuta.'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_clinica_created_plantilla ON public.clinicas;
CREATE TRIGGER on_clinica_created_plantilla
  AFTER INSERT ON public.clinicas
  FOR EACH ROW EXECUTE FUNCTION public.crear_plantilla_defecto();

-- Re-poblar la plantilla por defecto para clínicas que no la tengan (idempotente)
INSERT INTO public.plantillas_documentos (clinica_id, titulo, contenido)
SELECT
  id,
  'Consentimiento Informado General (Adultos)',
  'CONSENTIMIENTO INFORMADO PARA EVALUACIÓN Y TRATAMIENTO PSICOLÓGICO

1. IDENTIFICACIÓN
Yo, {{PACIENTE_NOMBRE}}, autorizo libre y voluntariamente a participar en el proceso de evaluación y tratamiento psicológico.

2. NATURALEZA DEL SERVICIO
Entiendo que el tratamiento psicológico es una relación colaborativa. Los resultados dependen en gran medida de mi participación activa. El profesional utilizará técnicas basadas en evidencia científica orientadas a mi bienestar.

3. CONFIDENCIALIDAD
Toda la información revelada durante las sesiones será estrictamente confidencial. Las únicas excepciones legales para romper esta confidencialidad son:
- Riesgo inminente contra mi propia vida o la vida de terceros.
- Sospecha de abuso a menores de edad o personas vulnerables.
- Requerimiento u orden de un juez.

4. POLÍTICAS DE CANCELACIÓN Y HONORARIOS
Me comprometo a notificar cualquier cancelación con al menos 24 horas de anticipación. De lo contrario, la sesión podrá ser cobrada en su totalidad. Entiendo las tarifas acordadas y me comprometo a cumplir con los pagos de manera oportuna.

5. VOLUNTARIEDAD
Entiendo que mi participación es totalmente voluntaria y tengo el derecho de retirar este consentimiento y finalizar el tratamiento en el momento que lo considere necesario, sin que esto implique penalización alguna.

Con mi firma abajo, declaro que he leído, comprendido y aceptado las condiciones aquí expuestas, habiendo tenido la oportunidad de aclarar cualquier duda con mi terapeuta.'
FROM public.clinicas
WHERE NOT EXISTS (
  SELECT 1 FROM public.plantillas_documentos WHERE clinica_id = public.clinicas.id
);

-- ==========================================
-- 7. EVALUACIONES PSICOMÉTRICAS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.evaluaciones_plantillas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID REFERENCES public.clinicas(id) ON DELETE CASCADE, -- NULL = global
    titulo TEXT NOT NULL,
    descripcion TEXT,
    preguntas JSONB NOT NULL DEFAULT '[]'::jsonb,
    escalas JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.evaluaciones_plantillas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_select_evaluaciones_plantillas" ON public.evaluaciones_plantillas;
DROP POLICY IF EXISTS "user_insert_evaluaciones_plantillas" ON public.evaluaciones_plantillas;
DROP POLICY IF EXISTS "user_update_evaluaciones_plantillas" ON public.evaluaciones_plantillas;
DROP POLICY IF EXISTS "user_delete_evaluaciones_plantillas" ON public.evaluaciones_plantillas;
CREATE POLICY "user_select_evaluaciones_plantillas" ON public.evaluaciones_plantillas
FOR SELECT USING (clinica_id IS NULL OR clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_insert_evaluaciones_plantillas" ON public.evaluaciones_plantillas
FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_evaluaciones_plantillas" ON public.evaluaciones_plantillas
FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_evaluaciones_plantillas" ON public.evaluaciones_plantillas
FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.evaluaciones_pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    plantilla_id UUID NOT NULL REFERENCES public.evaluaciones_plantillas(id) ON DELETE RESTRICT,
    respuestas JSONB NOT NULL DEFAULT '{}'::jsonb,
    puntaje_total INTEGER NOT NULL DEFAULT 0,
    interpretacion TEXT,
    estado TEXT NOT NULL DEFAULT 'completado',
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.evaluaciones_pacientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_select_evaluaciones_pacientes" ON public.evaluaciones_pacientes;
DROP POLICY IF EXISTS "user_insert_evaluaciones_pacientes" ON public.evaluaciones_pacientes;
DROP POLICY IF EXISTS "user_update_evaluaciones_pacientes" ON public.evaluaciones_pacientes;
DROP POLICY IF EXISTS "user_delete_evaluaciones_pacientes" ON public.evaluaciones_pacientes;
CREATE POLICY "user_select_evaluaciones_pacientes" ON public.evaluaciones_pacientes
FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_insert_evaluaciones_pacientes" ON public.evaluaciones_pacientes
FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_evaluaciones_pacientes" ON public.evaluaciones_pacientes
FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_evaluaciones_pacientes" ON public.evaluaciones_pacientes
FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- ---- SEEDS GLOBALES (solo se insertan si no existen) ----

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.evaluaciones_plantillas WHERE titulo = 'GAD-7 (Trastorno de Ansiedad Generalizada)') THEN
    INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
    VALUES (
        'GAD-7 (Trastorno de Ansiedad Generalizada)',
        'Herramienta de detección breve para medir la gravedad de la ansiedad.',
        '[
          {"id": "q1", "texto": "Sentirse nervioso/a, intranquilo/a o con los nervios de punta", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q2", "texto": "No poder dejar de preocuparse o no poder controlar la preocupación", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q3", "texto": "Preocuparse demasiado por diferentes cosas", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q4", "texto": "Dificultad para relajarse", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q5", "texto": "Estar tan inquieto/a que es difícil quedarse quieto/a", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q6", "texto": "Estar fácilmente irritable o molestarse con facilidad", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q7", "texto": "Sentir miedo como si algo terrible fuera a pasar", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]}
        ]'::jsonb,
        '[
          {"min": 0, "max": 4, "interpretacion": "Ansiedad Mínima"},
          {"min": 5, "max": 9, "interpretacion": "Ansiedad Leve"},
          {"min": 10, "max": 14, "interpretacion": "Ansiedad Moderada"},
          {"min": 15, "max": 21, "interpretacion": "Ansiedad Severa"}
        ]'::jsonb
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.evaluaciones_plantillas WHERE titulo = 'PHQ-9 (Cuestionario de Salud del Paciente)') THEN
    INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
    VALUES (
        'PHQ-9 (Cuestionario de Salud del Paciente)',
        'Herramienta de detección para evaluar la presencia y gravedad de la depresión.',
        '[
          {"id": "q1", "texto": "Poco interés o placer en hacer las cosas", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q2", "texto": "Sentirse desanimado/a, deprimido/a o sin esperanza", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q3", "texto": "Problemas para dormir o mantenerse dormido/a, o dormir demasiado", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q4", "texto": "Sentirse cansado/a o tener poca energía", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q5", "texto": "Tener poco apetito o comer en exceso", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q6", "texto": "Sentirse mal con usted mismo/a, o que es un fracaso, o que se ha decepcionado a usted mismo/a o a su familia", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q7", "texto": "Dificultad para concentrarse en cosas tales como leer el periódico o ver la televisión", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q8", "texto": "Moverse o hablar tan lentamente que otras personas podrían haberlo notado. O, por el contrario, estar tan inquieto/a o agitado/a que se ha estado moviendo mucho más de lo normal", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]},
          {"id": "q9", "texto": "Pensamientos de que estaría mejor muerto/a o de lastimarse de alguna manera", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios días", "puntaje": 1}, {"texto": "Más de la mitad de los días", "puntaje": 2}, {"texto": "Casi todos los días", "puntaje": 3}]}
        ]'::jsonb,
        '[
          {"min": 0, "max": 4, "interpretacion": "Depresión Mínima"},
          {"min": 5, "max": 9, "interpretacion": "Depresión Leve"},
          {"min": 10, "max": 14, "interpretacion": "Depresión Moderada"},
          {"min": 15, "max": 19, "interpretacion": "Depresión Moderadamente Severa"},
          {"min": 20, "max": 27, "interpretacion": "Depresión Severa"}
        ]'::jsonb
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.evaluaciones_plantillas WHERE titulo = 'PSS-14 (Escala de Estrés Percibido)') THEN
    INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
    VALUES (
        'PSS-14 (Escala de Estrés Percibido)',
        'Evalúa el grado en que las situaciones de la vida son valoradas como estresantes.',
        '[
          {"id": "q1", "texto": "En el último mes, ¿con qué frecuencia ha estado afectado por algo que ha ocurrido inesperadamente?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
          {"id": "q2", "texto": "En el último mes, ¿con qué frecuencia se ha sentido incapaz de controlar las cosas importantes en su vida?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
          {"id": "q3", "texto": "En el último mes, ¿con qué frecuencia se ha sentido nervioso o estresado?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
          {"id": "q4", "texto": "En el último mes, ¿con qué frecuencia ha manejado con éxito los pequeños problemas irritantes de la vida?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
          {"id": "q5", "texto": "En el último mes, ¿con qué frecuencia ha sentido que ha afrontado efectivamente los cambios importantes que han estado ocurriendo en su vida?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
          {"id": "q6", "texto": "En el último mes, ¿con qué frecuencia ha estado seguro sobre su capacidad para manejar sus problemas personales?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
          {"id": "q7", "texto": "En el último mes, ¿con qué frecuencia ha sentido que las cosas le van bien?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
          {"id": "q8", "texto": "En el último mes, ¿con qué frecuencia ha sentido que no podía afrontar todas las cosas que tenía que hacer?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
          {"id": "q9", "texto": "En el último mes, ¿con qué frecuencia ha podido controlar las dificultades de su vida?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
          {"id": "q10", "texto": "En el último mes, ¿con qué frecuencia se ha sentido dueño de la situación?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
          {"id": "q11", "texto": "En el último mes, ¿con qué frecuencia ha estado enfadado porque las cosas que le han ocurrido estaban fuera de su control?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
          {"id": "q12", "texto": "En el último mes, ¿con qué frecuencia ha pensado sobre las cosas que le quedan por hacer?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
          {"id": "q13", "texto": "En el último mes, ¿con qué frecuencia ha podido controlar la forma de pasar el tiempo?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
          {"id": "q14", "texto": "En el último mes, ¿con qué frecuencia ha sentido que las dificultades se acumulan tanto que no puede superarlas?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]}
        ]'::jsonb,
        '[
          {"min": 0, "max": 14, "interpretacion": "Casi nunca o nunca está estresado"},
          {"min": 15, "max": 28, "interpretacion": "De vez en cuando está estresado"},
          {"min": 29, "max": 42, "interpretacion": "A menudo está estresado"},
          {"min": 43, "max": 56, "interpretacion": "Muy a menudo está estresado"}
        ]'::jsonb
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.evaluaciones_plantillas WHERE titulo = 'Escala de Autoestima de Rosenberg') THEN
    INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
    VALUES (
        'Escala de Autoestima de Rosenberg',
        'Uno de los instrumentos más utilizados para evaluar la autoestima global.',
        '[
          {"id": "q1", "texto": "Siento que soy una persona digna de aprecio, al menos en igual medida que los demás", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
          {"id": "q2", "texto": "Siento que tengo cualidades positivas", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
          {"id": "q3", "texto": "En general, me inclino a pensar que soy un fracasado/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]},
          {"id": "q4", "texto": "Soy capaz de hacer las cosas tan bien como la mayoría de los demás", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
          {"id": "q5", "texto": "Siento que no tengo mucho de lo que sentirme orgulloso/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]},
          {"id": "q6", "texto": "Tomo una actitud positiva hacia mí mismo/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
          {"id": "q7", "texto": "En general, estoy satisfecho/a conmigo mismo/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
          {"id": "q8", "texto": "Me gustaría poder sentir más respeto por mí mismo/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]},
          {"id": "q9", "texto": "A veces me siento inútil", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]},
          {"id": "q10", "texto": "A veces pienso que no sirvo para nada", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]}
        ]'::jsonb,
        '[
          {"min": 10, "max": 25, "interpretacion": "Autoestima Baja"},
          {"min": 26, "max": 29, "interpretacion": "Autoestima Media (Normal)"},
          {"min": 30, "max": 40, "interpretacion": "Autoestima Alta"}
        ]'::jsonb
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.evaluaciones_plantillas WHERE titulo = 'DASS-21 (Escala de Depresión, Ansiedad y Estrés)') THEN
    INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
    VALUES (
        'DASS-21 (Escala de Depresión, Ansiedad y Estrés)',
        'Evalúa los estados emocionales de depresión, ansiedad y estrés.',
        '[
          {"id": "q1", "texto": "Me costó mucho relajarme", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco aplicable", "puntaje": 1}, {"texto": "Bastante aplicable", "puntaje": 2}, {"texto": "Muy aplicable", "puntaje": 3}]},
          {"id": "q2", "texto": "Me di cuenta de que tenía la boca seca", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q3", "texto": "No podía sentir ningún sentimiento positivo", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q4", "texto": "Tuve dificultad para respirar", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q5", "texto": "Se me hizo difícil tomar la iniciativa para hacer cosas", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q6", "texto": "Reaccioné exageradamente en ciertas situaciones", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q7", "texto": "Sentí que mis manos temblaban", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q8", "texto": "He sentido que estaba gastando mucha energía nerviosa", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q9", "texto": "Estaba preocupado por situaciones en las que podía tener pánico", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q10", "texto": "He sentido que no había nada que me ilusionara", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q11", "texto": "Me he sentido inquieto", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q12", "texto": "Se me hizo difícil relajarme", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q13", "texto": "Me sentí triste y deprimido", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q14", "texto": "No toleré nada que no me permitiera continuar con lo que estaba haciendo", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q15", "texto": "Sentí que estaba a punto de pánico", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q16", "texto": "Fui incapaz de entusiasmarme con nada", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q17", "texto": "Sentí que valía poco como persona", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q18", "texto": "He tendido a sentirme muy susceptible", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q19", "texto": "Noté latidos de mi corazón sin haber hecho esfuerzo físico", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q20", "texto": "Tuve miedo sin razón", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
          {"id": "q21", "texto": "Sentí que la vida no tenía sentido", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]}
        ]'::jsonb,
        '[
          {"min": 0, "max": 14, "interpretacion": "Normal (Sin síntomas clínicos significativos)"},
          {"min": 15, "max": 23, "interpretacion": "Sintomatología Leve"},
          {"min": 24, "max": 33, "interpretacion": "Sintomatología Moderada"},
          {"min": 34, "max": 63, "interpretacion": "Sintomatología Severa"}
        ]'::jsonb
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.evaluaciones_plantillas WHERE titulo = 'BAI (Inventario de Ansiedad de Beck)') THEN
    INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
    VALUES (
        'BAI (Inventario de Ansiedad de Beck)',
        'Mide la severidad de los síntomas de ansiedad, especialmente los físicos.',
        '[
          {"id": "q1", "texto": "Hormigueo o entumecimiento", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Levemente", "puntaje": 1}, {"texto": "Moderadamente", "puntaje": 2}, {"texto": "Severamente", "puntaje": 3}]},
          {"id": "q2", "texto": "Sensación de calor", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q3", "texto": "Temblores en las piernas", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q4", "texto": "Incapacidad de relajarse", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q5", "texto": "Miedo a que ocurra lo peor", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q6", "texto": "Mareos o aturdimiento", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q7", "texto": "Latidos del corazón fuertes y acelerados", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q8", "texto": "Inseguridad", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q9", "texto": "Terrores", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q10", "texto": "Nerviosismo", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q11", "texto": "Sensación de ahogo", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q12", "texto": "Temblores en las manos", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q13", "texto": "Miedo a perder el control", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q14", "texto": "Dificultad para respirar", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q15", "texto": "Miedo a morir", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q16", "texto": "Miedo o susto", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q17", "texto": "Indigestión o malestar estomacal", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q18", "texto": "Desmayos", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q19", "texto": "Rubor facial", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
          {"id": "q20", "texto": "Sudoración (no debida al calor)", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]}
        ]'::jsonb,
        '[
          {"min": 0, "max": 7, "interpretacion": "Ansiedad Mínima"},
          {"min": 8, "max": 15, "interpretacion": "Ansiedad Leve"},
          {"min": 16, "max": 25, "interpretacion": "Ansiedad Moderada"},
          {"min": 26, "max": 63, "interpretacion": "Ansiedad Severa"}
        ]'::jsonb
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.evaluaciones_plantillas WHERE titulo = 'ISI (Índice de Severidad del Insomnio)') THEN
    INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
    VALUES (
        'ISI (Índice de Severidad del Insomnio)',
        'Cuestionario breve para evaluar la severidad del insomnio.',
        '[
          {"id": "q1", "texto": "Dificultad para quedarse dormido/a", "opciones": [{"texto": "Ninguna", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderada", "puntaje": 2}, {"texto": "Severa", "puntaje": 3}, {"texto": "Muy severa", "puntaje": 4}]},
          {"id": "q2", "texto": "Dificultad para mantenerse dormido/a", "opciones": [{"texto": "Ninguna", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderada", "puntaje": 2}, {"texto": "Severa", "puntaje": 3}, {"texto": "Muy severa", "puntaje": 4}]},
          {"id": "q3", "texto": "Problemas de despertar demasiado temprano", "opciones": [{"texto": "Ninguna", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderada", "puntaje": 2}, {"texto": "Severa", "puntaje": 3}, {"texto": "Muy severa", "puntaje": 4}]},
          {"id": "q4", "texto": "¿Qué tan satisfecho/a está con su patrón actual de sueño?", "opciones": [{"texto": "Muy satisfecho", "puntaje": 0}, {"texto": "Satisfecho", "puntaje": 1}, {"texto": "Neutral", "puntaje": 2}, {"texto": "Insatisfecho", "puntaje": 3}, {"texto": "Muy insatisfecho", "puntaje": 4}]},
          {"id": "q5", "texto": "¿Qué tan notable considera que es su problema de sueño para los demás en términos de su calidad de vida?", "opciones": [{"texto": "Nada notable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}, {"texto": "Extremadamente", "puntaje": 4}]},
          {"id": "q6", "texto": "¿Qué tan preocupado/a o afligido/a está por su problema actual de sueño?", "opciones": [{"texto": "Nada preocupado", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Moderadamente", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}, {"texto": "Extremadamente", "puntaje": 4}]},
          {"id": "q7", "texto": "¿Hasta qué punto interfiere su problema de sueño con su funcionamiento diario (fatiga, concentración, memoria)?", "opciones": [{"texto": "No interfiere", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Moderadamente", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}, {"texto": "Extremadamente", "puntaje": 4}]}
        ]'::jsonb,
        '[
          {"min": 0, "max": 7, "interpretacion": "Sin insomnio clínicamente significativo"},
          {"min": 8, "max": 14, "interpretacion": "Insomnio Subclínico"},
          {"min": 15, "max": 21, "interpretacion": "Insomnio Clínico Moderado"},
          {"min": 22, "max": 28, "interpretacion": "Insomnio Clínico Severo"}
        ]'::jsonb
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.evaluaciones_plantillas WHERE titulo = 'AUDIT (Cuestionario de Identificación de Trastornos Debidos al Consumo de Alcohol)') THEN
    INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
    VALUES (
        'AUDIT (Cuestionario de Identificación de Trastornos Debidos al Consumo de Alcohol)',
        'Prueba de la OMS para detectar el consumo perjudicial y de riesgo de alcohol.',
        '[
          {"id": "q1", "texto": "¿Con qué frecuencia consume alguna bebida alcohólica?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "1 o menos veces al mes", "puntaje": 1}, {"texto": "2 a 4 veces al mes", "puntaje": 2}, {"texto": "2 a 3 veces a la semana", "puntaje": 3}, {"texto": "4 o más veces a la semana", "puntaje": 4}]},
          {"id": "q2", "texto": "¿Cuántas bebidas alcohólicas suele consumir en un día de consumo normal?", "opciones": [{"texto": "1 o 2", "puntaje": 0}, {"texto": "3 o 4", "puntaje": 1}, {"texto": "5 o 6", "puntaje": 2}, {"texto": "7 a 9", "puntaje": 3}, {"texto": "10 o más", "puntaje": 4}]},
          {"id": "q3", "texto": "¿Con qué frecuencia toma 6 o más bebidas alcohólicas en un solo día?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
          {"id": "q4", "texto": "¿Con qué frecuencia en el curso del último año ha sido incapaz de parar de beber una vez había empezado?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
          {"id": "q5", "texto": "¿Con qué frecuencia en el curso del último año no pudo hacer lo que se esperaba de usted porque había bebido?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
          {"id": "q6", "texto": "¿Con qué frecuencia en el curso del último año ha necesitado beber en ayunas para recuperarse después de haber bebido mucho el día anterior?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
          {"id": "q7", "texto": "¿Con qué frecuencia en el curso del último año ha tenido remordimientos o sentimientos de culpa después de haber bebido?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
          {"id": "q8", "texto": "¿Con qué frecuencia en el curso del último año no ha podido recordar lo que sucedió la noche anterior porque había estado bebiendo?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
          {"id": "q9", "texto": "¿Usted o alguna otra persona ha resultado herido porque usted había bebido?", "opciones": [{"texto": "No", "puntaje": 0}, {"texto": "Sí, pero no en el curso del último año", "puntaje": 2}, {"texto": "Sí, el último año", "puntaje": 4}]},
          {"id": "q10", "texto": "¿Algún familiar, amigo, médico o profesional sanitario ha mostrado preocupación por su consumo de alcohol o le ha sugerido que deje de beber?", "opciones": [{"texto": "No", "puntaje": 0}, {"texto": "Sí, pero no en el curso del último año", "puntaje": 2}, {"texto": "Sí, el último año", "puntaje": 4}]}
        ]'::jsonb,
        '[
          {"min": 0, "max": 7, "interpretacion": "Consumo de bajo riesgo"},
          {"min": 8, "max": 15, "interpretacion": "Consumo de Riesgo"},
          {"min": 16, "max": 19, "interpretacion": "Consumo Perjudicial"},
          {"min": 20, "max": 40, "interpretacion": "Posible Dependencia del Alcohol"}
        ]'::jsonb
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.evaluaciones_plantillas WHERE titulo = 'ASRS-v1.1 (Cuestionario Corto para TDAH)') THEN
    INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
    VALUES (
        'ASRS-v1.1 (Cuestionario Corto para TDAH)',
        'Herramienta de despistaje (Screener de 6 preguntas) de la OMS para detectar el TDAH en adultos.',
        '[
          {"id": "q1", "texto": "¿Con qué frecuencia tiene dificultad para concentrarse en lo que la gente le dice, incluso cuando están hablándole directamente?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
          {"id": "q2", "texto": "¿Con qué frecuencia abandona su asiento en reuniones o en otras situaciones en las que se espera que permanezca sentado?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
          {"id": "q3", "texto": "¿Con qué frecuencia le cuesta relajarse o descansar cuando tiene tiempo libre?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
          {"id": "q4", "texto": "¿Con qué frecuencia se encuentra a sí mismo terminando las frases de las personas con las que habla, antes de que ellas puedan terminarlas?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
          {"id": "q5", "texto": "¿Con qué frecuencia posterga las cosas hasta el último minuto?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
          {"id": "q6", "texto": "¿Con qué frecuencia depende de otros para mantener su vida en orden o para atender detalles?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]}
        ]'::jsonb,
        '[
          {"min": 0, "max": 3, "interpretacion": "Sintomatología Negativa para TDAH"},
          {"min": 4, "max": 6, "interpretacion": "Sintomatología Altamente Sugestiva de TDAH"}
        ]'::jsonb
    );
  END IF;
END $$;

-- ==========================================
-- 8. VIDECONSULTAS (citas presenciales/virtuales)
-- ==========================================

ALTER TABLE public.citas
  ADD COLUMN IF NOT EXISTS modalidad TEXT DEFAULT 'presencial'
  CHECK (modalidad IN ('presencial', 'virtual'));

ALTER TABLE public.citas
  ADD COLUMN IF NOT EXISTS enlace_video TEXT;

-- ==========================================
-- 9. PERFIL EXTENDIDO DE USUARIOS
-- ==========================================

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS telefono        TEXT,
  ADD COLUMN IF NOT EXISTS dpi             TEXT,
  ADD COLUMN IF NOT EXISTS direccion       TEXT,
  ADD COLUMN IF NOT EXISTS profesion       TEXT,
  ADD COLUMN IF NOT EXISTS no_colegiado    TEXT,
  ADD COLUMN IF NOT EXISTS especialidad    TEXT,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
  ADD COLUMN IF NOT EXISTS genero          TEXT CHECK (genero IN ('masculino', 'femenino', 'otro', 'prefiero_no_decir')),
  ADD COLUMN IF NOT EXISTS foto_url        TEXT;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- ==========================================
-- 10. CONTROL DE CAJA (Turnos + Movimientos)
-- ==========================================

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

ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_select_cajas" ON public.cajas;
DROP POLICY IF EXISTS "user_insert_cajas" ON public.cajas;
DROP POLICY IF EXISTS "user_update_cajas" ON public.cajas;
DROP POLICY IF EXISTS "user_delete_cajas" ON public.cajas;
CREATE POLICY "user_select_cajas" ON public.cajas FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_insert_cajas" ON public.cajas FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_cajas" ON public.cajas FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_cajas" ON public.cajas FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.movimientos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_id UUID NOT NULL REFERENCES public.cajas(id) ON DELETE CASCADE,
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro')),
    concepto TEXT NOT NULL,
    referencia_id UUID, -- Opcional: ID de pago, factura, etc.
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.movimientos_caja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_select_movimientos" ON public.movimientos_caja;
DROP POLICY IF EXISTS "user_insert_movimientos" ON public.movimientos_caja;
DROP POLICY IF EXISTS "user_update_movimientos" ON public.movimientos_caja;
DROP POLICY IF EXISTS "user_delete_movimientos" ON public.movimientos_caja;
CREATE POLICY "user_select_movimientos" ON public.movimientos_caja FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_insert_movimientos" ON public.movimientos_caja FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_update_movimientos" ON public.movimientos_caja FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));
CREATE POLICY "user_delete_movimientos" ON public.movimientos_caja FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- ==========================================
-- 11. PAQUETES DE SESIONES Y TAREAS ENTRE-SESIONES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.paquetes_sesiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    num_sesiones INTEGER NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.paquetes_sesiones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin tiene acceso total a paquetes_sesiones" ON public.paquetes_sesiones;
DROP POLICY IF EXISTS "Usuarios de clínica pueden ver paquetes_sesiones" ON public.paquetes_sesiones;
DROP POLICY IF EXISTS "Admins pueden gestionar paquetes_sesiones" ON public.paquetes_sesiones;
CREATE POLICY "Superadmin tiene acceso total a paquetes_sesiones" ON public.paquetes_sesiones
    FOR ALL TO authenticated USING (auth.jwt() ->> 'rol' = 'superadmin');
CREATE POLICY "Usuarios de clínica pueden ver paquetes_sesiones" ON public.paquetes_sesiones
    FOR SELECT TO authenticated USING (clinica_id = (auth.jwt() ->> 'clinica_id')::uuid);
CREATE POLICY "Admins pueden gestionar paquetes_sesiones" ON public.paquetes_sesiones
    FOR ALL TO authenticated USING (
        clinica_id = (auth.jwt() ->> 'clinica_id')::uuid
        AND auth.jwt() ->> 'rol' = 'admin'
    );

CREATE TABLE IF NOT EXISTS public.paciente_paquetes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    paquete_id UUID NOT NULL REFERENCES public.paquetes_sesiones(id) ON DELETE RESTRICT,
    sesiones_restantes INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activo', -- 'activo', 'agotado'
    fecha_compra TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.paciente_paquetes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin tiene acceso total a paciente_paquetes" ON public.paciente_paquetes;
DROP POLICY IF EXISTS "Usuarios de clínica pueden gestionar paciente_paquetes" ON public.paciente_paquetes;
CREATE POLICY "Superadmin tiene acceso total a paciente_paquetes" ON public.paciente_paquetes
    FOR ALL TO authenticated USING (auth.jwt() ->> 'rol' = 'superadmin');
CREATE POLICY "Usuarios de clínica pueden gestionar paciente_paquetes" ON public.paciente_paquetes
    FOR ALL TO authenticated USING (clinica_id = (auth.jwt() ->> 'clinica_id')::uuid);

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

ALTER TABLE public.tareas_paciente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin tiene acceso total a tareas_paciente" ON public.tareas_paciente;
DROP POLICY IF EXISTS "Usuarios de clínica pueden gestionar tareas_paciente" ON public.tareas_paciente;
CREATE POLICY "Superadmin tiene acceso total a tareas_paciente" ON public.tareas_paciente
    FOR ALL TO authenticated USING (auth.jwt() ->> 'rol' = 'superadmin');
CREATE POLICY "Usuarios de clínica pueden gestionar tareas_paciente" ON public.tareas_paciente
    FOR ALL TO authenticated USING (clinica_id = (auth.jwt() ->> 'clinica_id')::uuid);

-- ==========================================
-- 12. ARCHIVOS DE PACIENTES (Metadatos + Storage)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.archivos_paciente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    nombre_original TEXT NOT NULL,
    ruta_storage TEXT NOT NULL,
    tipo_mime TEXT NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    subido_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL
);

ALTER TABLE public.archivos_paciente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir a usuarios ver archivos de su clínica" ON public.archivos_paciente;
DROP POLICY IF EXISTS "Permitir a usuarios insertar archivos en su clínica" ON public.archivos_paciente;
DROP POLICY IF EXISTS "Permitir a usuarios eliminar archivos de su clínica" ON public.archivos_paciente;
CREATE POLICY "Permitir a usuarios ver archivos de su clínica" ON public.archivos_paciente
    FOR SELECT USING (
        clinica_id IN (
            SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()
        )
    );
CREATE POLICY "Permitir a usuarios insertar archivos en su clínica" ON public.archivos_paciente
    FOR INSERT WITH CHECK (
        clinica_id IN (
            SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()
        )
    );
CREATE POLICY "Permitir a usuarios eliminar archivos de su clínica" ON public.archivos_paciente
    FOR DELETE USING (
        clinica_id IN (
            SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()
        )
    );

-- Bucket privado para archivos médicos
INSERT INTO storage.buckets (id, name, public)
VALUES ('pacientes_archivos', 'pacientes_archivos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Permitir subir archivos a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir ver archivos a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminar archivos a usuarios autenticados" ON storage.objects;
CREATE POLICY "Permitir subir archivos a usuarios autenticados" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'pacientes_archivos'
    );
CREATE POLICY "Permitir ver archivos a usuarios autenticados" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'pacientes_archivos'
    );
CREATE POLICY "Permitir eliminar archivos a usuarios autenticados" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'pacientes_archivos'
    );

-- ==========================================
-- FIN DEL SCRIPT UNIFICADO
-- ==========================================