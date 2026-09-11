-- ==========================================
-- SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS MAESTRO
-- SUPABASE - CLÍNICA PSICOLÓGICA (MULTI-TENANT)
-- ==========================================
-- NOTA: Este archivo unifica todas las migraciones anteriores en un solo script.
-- Está diseñado para ser ejecutado en ambientes nuevos (QA, UAT, PROD).
-- ==========================================

-- ==========================================
-- MÓDULO 1: CORE Y SEGURIDAD (Clínicas, Usuarios, Invitaciones)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.clinicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    estado TEXT DEFAULT 'activo',
    nit VARCHAR(20),
    razon_social VARCHAR(255),
    nombre_comercial VARCHAR(255),
    direccion_fiscal TEXT,
    telefono_contacto VARCHAR(50),
    no_patente VARCHAR(100),
    abreviatura VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY, -- Viene de auth.users
    clinica_id UUID REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    rol TEXT NOT NULL CHECK (rol IN ('superadmin', 'admin', 'personal', 'doctor')),
    activo BOOLEAN DEFAULT true,
    telefono TEXT,
    dpi TEXT,
    direccion TEXT,
    profesion TEXT,
    no_colegiado TEXT,
    especialidad TEXT,
    fecha_nacimiento DATE,
    genero TEXT CHECK (genero IN ('masculino', 'femenino', 'otro', 'prefiero_no_decir')),
    foto_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

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

-- TRIGGER DE REGISTRO AUTOMÁTICO DE USUARIOS
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
-- MÓDULO 2: PACIENTES Y CITAS (Expedientes y Agendamiento)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    dpi TEXT,
    fecha_nacimiento DATE,
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    telefono TEXT,
    correo TEXT,
    direccion TEXT,
    nit TEXT,
    nombre_responsable TEXT,
    parentesco TEXT,
    telefono_responsable TEXT,
    ocupacion_responsable TEXT,
    estado_civil_padres TEXT,
    notas_dinamica TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.citas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    motivo TEXT,
    estado TEXT NOT NULL CHECK (estado IN ('programada', 'completada', 'cancelada')),
    modalidad TEXT DEFAULT 'presencial' CHECK (modalidad IN ('presencial', 'virtual')),
    enlace_video TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- MÓDULO 3: HISTORIAL CLÍNICO (Diagnósticos, Medicamentos, Exámenes, Signos, Notas, Archivos)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.diagnosticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    enfermedad TEXT NOT NULL,
    plan_tratamiento TEXT,
    estado TEXT NOT NULL CHECK (estado IN ('activo', 'resuelto')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.medicamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha_prescripcion DATE NOT NULL,
    nombre TEXT NOT NULL,
    dosis TEXT,
    frecuencia TEXT,
    duracion TEXT,
    indicaciones TEXT,
    estado TEXT NOT NULL CHECK (estado IN ('activo', 'suspendido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.examenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo_examen TEXT NOT NULL,
    fecha_solicitud DATE NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'completado')),
    resultados TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.examenes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.signos_vitales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    presion_arterial TEXT,
    frecuencia_cardiaca INTEGER,
    saturacion_oxigeno INTEGER,
    temperatura DECIMAL(4,1),
    peso DECIMAL(5,2),
    talla DECIMAL(5,2),
    imc DECIMAL(4,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.signos_vitales ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notas_clinicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    titulo TEXT,
    contenido TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.notas_clinicas ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.archivos_paciente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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


-- ==========================================
-- MÓDULO 4: CONSENTIMIENTOS Y PLANTILLAS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.plantillas_documentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  contenido text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.plantillas_documentos ENABLE ROW LEVEL SECURITY;

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

-- Insertar plantilla por defecto automáticamente al crear una nueva clínica
CREATE OR REPLACE FUNCTION public.crear_plantilla_defecto()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.plantillas_documentos (clinica_id, titulo, contenido)
  VALUES (
    NEW.id,
    'Consentimiento Informado General (Adultos)',
    'CONSENTIMIENTO INFORMADO PARA EVALUACIÓN Y TRATAMIENTO PSICOLÓGICO...'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_clinica_created_plantilla ON public.clinicas;
CREATE TRIGGER on_clinica_created_plantilla
  AFTER INSERT ON public.clinicas
  FOR EACH ROW EXECUTE FUNCTION public.crear_plantilla_defecto();


-- ==========================================
-- MÓDULO 5: EVALUACIONES PSICOMÉTRICAS Y TAREAS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.evaluaciones_plantillas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID REFERENCES public.clinicas(id) ON DELETE CASCADE, -- NULL significa que es global
    titulo TEXT NOT NULL,
    descripcion TEXT,
    preguntas JSONB NOT NULL DEFAULT '[]'::jsonb,
    escalas JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.evaluaciones_plantillas ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE IF NOT EXISTS public.tareas_paciente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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


-- ==========================================
-- MÓDULO 6: FACTURACIÓN, PAQUETES Y CAJA
-- ==========================================

CREATE TABLE IF NOT EXISTS public.paquetes_sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    num_sesiones INTEGER NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.paquetes_sesiones ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.paciente_paquetes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    paquete_id UUID NOT NULL REFERENCES public.paquetes_sesiones(id) ON DELETE RESTRICT,
    sesiones_restantes INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activo', -- 'activo', 'agotado'
    fecha_compra TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.paciente_paquetes ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE IF NOT EXISTS public.movimientos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_id UUID NOT NULL REFERENCES public.cajas(id) ON DELETE CASCADE,
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro')),
    concepto TEXT NOT NULL,
    referencia_id UUID, 
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.movimientos_caja ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- MÓDULO 7: POLÍTICAS RLS (Row Level Security) GENÉRICAS
-- ==========================================
-- Políticas globales (Las tablas individuales ya tienen RLS Habilitado)
-- Para uso en producción, se deben habilitar de forma infalible aquí.

CREATE OR REPLACE FUNCTION public.aplicar_politicas_clinica()
RETURNS void AS $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'clinica_id' AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "user_select_%I" ON public.%I', t_name, t_name);
        EXECUTE format('CREATE POLICY "user_select_%I" ON public.%I FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()))', t_name, t_name);
        
        EXECUTE format('DROP POLICY IF EXISTS "user_insert_%I" ON public.%I', t_name, t_name);
        EXECUTE format('CREATE POLICY "user_insert_%I" ON public.%I FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()))', t_name, t_name);
        
        EXECUTE format('DROP POLICY IF EXISTS "user_update_%I" ON public.%I', t_name, t_name);
        EXECUTE format('CREATE POLICY "user_update_%I" ON public.%I FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()))', t_name, t_name);
        
        EXECUTE format('DROP POLICY IF EXISTS "user_delete_%I" ON public.%I', t_name, t_name);
        EXECUTE format('CREATE POLICY "user_delete_%I" ON public.%I FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()))', t_name, t_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la asignación de políticas genéricas
SELECT public.aplicar_politicas_clinica();

-- ==========================================
-- FIN DEL SCRIPT MAESTRO
-- ==========================================
