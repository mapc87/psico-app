-- ==========================================
-- SCRIPT DE CONFIGURACIÃƒâ€œN DE BASE DE DATOS MAESTRO
-- SUPABASE - CLÃƒÂNICA PSICOLÃƒâ€œGICA (MULTI-TENANT)
-- ==========================================
-- NOTA: Este archivo unifica todas las migraciones anteriores en un solo script.
-- EstÃƒÂ¡ diseÃƒÂ±ado para ser ejecutado en ambientes nuevos (QA, UAT, PROD).
-- ==========================================

-- ==========================================
-- MÃƒâ€œDULO 1: CORE Y SEGURIDAD (ClÃƒÂ­nicas, Usuarios, Invitaciones)
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
    resend_api_key TEXT,
    email_remitente TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    permisos JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY, -- Viene de auth.users
    clinica_id UUID REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    rol TEXT NOT NULL CHECK (rol IN ('superadmin', 'admin', 'personal', 'doctor')),
    rol_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
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
  _rol_asignado TEXT := 'admin';
  _invitacion_id UUID;
  _final_rol TEXT := 'admin';
  _final_rol_id UUID := NULL;
BEGIN
  IF new.raw_user_meta_data->>'codigo_invitacion' IS NOT NULL AND TRIM(new.raw_user_meta_data->>'codigo_invitacion') <> '' THEN
     SELECT id, clinica_id, rol_asignado INTO _invitacion_id, _clinica_id, _rol_asignado 
     FROM public.invitaciones 
     WHERE UPPER(codigo) = UPPER(TRIM(new.raw_user_meta_data->>'codigo_invitacion')) AND usado = false
     LIMIT 1;
     
     IF _invitacion_id IS NULL THEN
       RAISE EXCEPTION 'El código de invitación es inválido o ya ha sido utilizado.';
     END IF;

     UPDATE public.invitaciones SET usado = true WHERE id = _invitacion_id;

     IF _rol_asignado IN ('superadmin', 'admin', 'personal', 'doctor') THEN
       _final_rol := _rol_asignado;
     ELSE
       _final_rol := 'personal';
       BEGIN
         _final_rol_id := _rol_asignado::UUID;
       EXCEPTION WHEN OTHERS THEN
         _final_rol_id := NULL;
       END;
     END IF;
  ELSE
    IF (SELECT count(*) FROM public.usuarios) = 0 THEN
      _final_rol := 'superadmin';
    END IF;
  END IF;

  INSERT INTO public.usuarios (id, email, nombre, rol, clinica_id, rol_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nombre', 'Usuario'), 
    _final_rol, 
    _clinica_id,
    _final_rol_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol,
    clinica_id = EXCLUDED.clinica_id,
    rol_id = EXCLUDED.rol_id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- MÃƒâ€œDULO 2: PACIENTES Y CITAS (Expedientes y Agendamiento)
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
    estado TEXT NOT NULL DEFAULT 'activo',
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
    recordatorio_enviado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- MÃƒâ€œDULO 3: HISTORIAL CLÃƒÂNICO (DiagnÃƒÂ³sticos, Medicamentos, ExÃƒÂ¡menes, Signos, Notas, Archivos)
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
-- MÃƒâ€œDULO 4: CONSENTIMIENTOS Y PLANTILLAS
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

-- Insertar plantilla por defecto automÃƒÂ¡ticamente al crear una nueva clÃƒÂ­nica
CREATE OR REPLACE FUNCTION public.crear_plantilla_defecto()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.plantillas_documentos (clinica_id, titulo, contenido)
  VALUES (
    NEW.id,
    'Consentimiento Informado General (Adultos)',
    'CONSENTIMIENTO INFORMADO PARA EVALUACIÃƒâ€œN Y TRATAMIENTO PSICOLÃƒâ€œGICO...'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_clinica_created_plantilla ON public.clinicas;
CREATE TRIGGER on_clinica_created_plantilla
  AFTER INSERT ON public.clinicas
  FOR EACH ROW EXECUTE FUNCTION public.crear_plantilla_defecto();


-- ==========================================
-- MÃƒâ€œDULO 5: EVALUACIONES PSICOMÃƒâ€°TRICAS Y TAREAS
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
-- MÃƒâ€œDULO 6: FACTURACIÃƒâ€œN, PAQUETES Y CAJA
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
-- MÃƒâ€œDULO 7: POLÃƒÂTICAS RLS (Row Level Security) GENÃƒâ€°RICAS
-- ==========================================
-- PolÃƒÂ­ticas globales (Las tablas individuales ya tienen RLS Habilitado)
-- Para uso en producciÃƒÂ³n, se deben habilitar de forma infalible aquÃƒÂ­.

-- Función RPC segura para verificar si existen usuarios en el sistema (usada por AuthContext)
CREATE OR REPLACE FUNCTION public.check_has_users()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.usuarios);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_has_users() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.aplicar_politicas_clinica()
RETURNS void AS $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'clinica_id' AND table_schema = 'public' AND table_name != 'usuarios'
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

-- Políticas específicas para evitar bloqueos de inicio de sesión:
DROP POLICY IF EXISTS "usuarios_select_policy" ON public.usuarios;
CREATE POLICY "usuarios_select_policy" ON public.usuarios FOR SELECT USING (id = auth.uid() OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "clinicas_select_policy" ON public.clinicas;
CREATE POLICY "clinicas_select_policy" ON public.clinicas FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "roles_select_policy" ON public.roles;
CREATE POLICY "roles_select_policy" ON public.roles FOR SELECT USING (auth.role() = 'authenticated');



-- ==========================================
-- MÃ“DULO 8: DATOS INICIALES (Plantillas PsicomÃ©tricas)
-- ==========================================

INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'GAD-7 (Trastorno de Ansiedad Generalizada)',
    'Herramienta de detecciÃ³n breve para medir la gravedad de la ansiedad.',
    '[
      {"id": "q1", "texto": "Sentirse nervioso/a, intranquilo/a o con los nervios de punta", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q2", "texto": "No poder dejar de preocuparse o no poder controlar la preocupaciÃ³n", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q3", "texto": "Preocuparse demasiado por diferentes cosas", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q4", "texto": "Dificultad para relajarse", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q5", "texto": "Estar tan inquieto/a que es difÃ­cil quedarse quieto/a", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q6", "texto": "Estar fÃ¡cilmente irritable o molestarse con facilidad", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q7", "texto": "Sentir miedo como si algo terrible fuera a pasar", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 4, "interpretacion": "Ansiedad MÃ­nima"},
      {"min": 5, "max": 9, "interpretacion": "Ansiedad Leve"},
      {"min": 10, "max": 14, "interpretacion": "Ansiedad Moderada"},
      {"min": 15, "max": 21, "interpretacion": "Ansiedad Severa"}
    ]'::jsonb
);


INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'PHQ-9 (Cuestionario de Salud del Paciente)',
    'Herramienta de detecciÃ³n para evaluar la presencia y gravedad de la depresiÃ³n.',
    '[
      {"id": "q1", "texto": "Poco interÃ©s o placer en hacer las cosas", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q2", "texto": "Sentirse desanimado/a, deprimido/a o sin esperanza", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q3", "texto": "Problemas para dormir o mantenerse dormido/a, o dormir demasiado", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q4", "texto": "Sentirse cansado/a o tener poca energÃ­a", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q5", "texto": "Tener poco apetito o comer en exceso", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q6", "texto": "Sentirse mal con usted mismo/a, o que es un fracaso, o que se ha decepcionado a usted mismo/a o a su familia", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q7", "texto": "Dificultad para concentrarse en cosas tales como leer el periÃ³dico o ver la televisiÃ³n", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q8", "texto": "Moverse o hablar tan lentamente que otras personas podrÃ­an haberlo notado. O, por el contrario, estar tan inquieto/a o agitado/a que se ha estado moviendo mucho mÃ¡s de lo normal", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]},
      {"id": "q9", "texto": "Pensamientos de que estarÃ­a mejor muerto/a o de lastimarse de alguna manera", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Varios dÃ­as", "puntaje": 1}, {"texto": "MÃ¡s de la mitad de los dÃ­as", "puntaje": 2}, {"texto": "Casi todos los dÃ­as", "puntaje": 3}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 4, "interpretacion": "DepresiÃ³n MÃ­nima"},
      {"min": 5, "max": 9, "interpretacion": "DepresiÃ³n Leve"},
      {"min": 10, "max": 14, "interpretacion": "DepresiÃ³n Moderada"},
      {"min": 15, "max": 19, "interpretacion": "DepresiÃ³n Moderadamente Severa"},
      {"min": 20, "max": 27, "interpretacion": "DepresiÃ³n Severa"}
    ]'::jsonb
);


INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'PSS-14 (Escala de EstrÃ©s Percibido)',
    'EvalÃºa el grado en que las situaciones de la vida son valoradas como estresantes.',
    '[
      {"id": "q1", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia ha estado afectado por algo que ha ocurrido inesperadamente?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
      {"id": "q2", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia se ha sentido incapaz de controlar las cosas importantes en su vida?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
      {"id": "q3", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia se ha sentido nervioso o estresado?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
      {"id": "q4", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia ha manejado con Ã©xito los pequeÃ±os problemas irritantes de la vida?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q5", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia ha sentido que ha afrontado efectivamente los cambios importantes que han estado ocurriendo en su vida?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q6", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia ha estado seguro sobre su capacidad para manejar sus problemas personales?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q7", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia ha sentido que las cosas le van bien?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q8", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia ha sentido que no podÃ­a afrontar todas las cosas que tenÃ­a que hacer?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
      {"id": "q9", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia ha podido controlar las dificultades de su vida?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q10", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia se ha sentido dueÃ±o de la situaciÃ³n?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q11", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia ha estado enfadado porque las cosas que le han ocurrido estaban fuera de su control?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
      {"id": "q12", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia ha pensado sobre las cosas que le quedan por hacer?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]},
      {"id": "q13", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia ha podido controlar la forma de pasar el tiempo?", "opciones": [{"texto": "Nunca", "puntaje": 4}, {"texto": "Casi nunca", "puntaje": 3}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 0}]},
      {"id": "q14", "texto": "En el Ãºltimo mes, Â¿con quÃ© frecuencia ha sentido que las dificultades se acumulan tanto que no puede superarlas?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Casi nunca", "puntaje": 1}, {"texto": "De vez en cuando", "puntaje": 2}, {"texto": "A menudo", "puntaje": 3}, {"texto": "Muy a menudo", "puntaje": 4}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 14, "interpretacion": "Casi nunca o nunca estÃ¡ estresado"},
      {"min": 15, "max": 28, "interpretacion": "De vez en cuando estÃ¡ estresado"},
      {"min": 29, "max": 42, "interpretacion": "A menudo estÃ¡ estresado"},
      {"min": 43, "max": 56, "interpretacion": "Muy a menudo estÃ¡ estresado"}
    ]'::jsonb
);


INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'Escala de Autoestima de Rosenberg',
    'Uno de los instrumentos mÃ¡s utilizados para evaluar la autoestima global.',
    '[
      {"id": "q1", "texto": "Siento que soy una persona digna de aprecio, al menos en igual medida que los demÃ¡s", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
      {"id": "q2", "texto": "Siento que tengo cualidades positivas", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
      {"id": "q3", "texto": "En general, me inclino a pensar que soy un fracasado/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]},
      {"id": "q4", "texto": "Soy capaz de hacer las cosas tan bien como la mayorÃ­a de los demÃ¡s", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
      {"id": "q5", "texto": "Siento que no tengo mucho de lo que sentirme orgulloso/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]},
      {"id": "q6", "texto": "Tomo una actitud positiva hacia mÃ­ mismo/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
      {"id": "q7", "texto": "En general, estoy satisfecho/a conmigo mismo/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 4}, {"texto": "De acuerdo", "puntaje": 3}, {"texto": "En desacuerdo", "puntaje": 2}, {"texto": "Muy en desacuerdo", "puntaje": 1}]},
      {"id": "q8", "texto": "Me gustarÃ­a poder sentir mÃ¡s respeto por mÃ­ mismo/a", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]},
      {"id": "q9", "texto": "A veces me siento inÃºtil", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]},
      {"id": "q10", "texto": "A veces pienso que no sirvo para nada", "opciones": [{"texto": "Muy de acuerdo", "puntaje": 1}, {"texto": "De acuerdo", "puntaje": 2}, {"texto": "En desacuerdo", "puntaje": 3}, {"texto": "Muy en desacuerdo", "puntaje": 4}]}
    ]'::jsonb,
    '[
      {"min": 10, "max": 25, "interpretacion": "Autoestima Baja"},
      {"min": 26, "max": 29, "interpretacion": "Autoestima Media (Normal)"},
      {"min": 30, "max": 40, "interpretacion": "Autoestima Alta"}
    ]'::jsonb
);


INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'DASS-21 (Escala de DepresiÃ³n, Ansiedad y EstrÃ©s)',
    'EvalÃºa los estados emocionales de depresiÃ³n, ansiedad y estrÃ©s.',
    '[
      {"id": "q1", "texto": "Me costÃ³ mucho relajarme", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco aplicable", "puntaje": 1}, {"texto": "Bastante aplicable", "puntaje": 2}, {"texto": "Muy aplicable", "puntaje": 3}]},
      {"id": "q2", "texto": "Me di cuenta de que tenÃ­a la boca seca", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q3", "texto": "No podÃ­a sentir ningÃºn sentimiento positivo", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q4", "texto": "Tuve dificultad para respirar", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q5", "texto": "Se me hizo difÃ­cil tomar la iniciativa para hacer cosas", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q6", "texto": "ReaccionÃ© exageradamente en ciertas situaciones", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q7", "texto": "SentÃ­ que mis manos temblaban", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q8", "texto": "He sentido que estaba gastando mucha energÃ­a nerviosa", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q9", "texto": "Estaba preocupado por situaciones en las que podÃ­a tener pÃ¡nico", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q10", "texto": "He sentido que no habÃ­a nada que me ilusionara", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q11", "texto": "Me he sentido inquieto", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q12", "texto": "Se me hizo difÃ­cil relajarme", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q13", "texto": "Me sentÃ­ triste y deprimido", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q14", "texto": "No tolerÃ© nada que no me permitiera continuar con lo que estaba haciendo", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q15", "texto": "SentÃ­ que estaba a punto de pÃ¡nico", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q16", "texto": "Fui incapaz de entusiasmarme con nada", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q17", "texto": "SentÃ­ que valÃ­a poco como persona", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q18", "texto": "He tendido a sentirme muy susceptible", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q19", "texto": "NotÃ© latidos de mi corazÃ³n sin haber hecho esfuerzo fÃ­sico", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q20", "texto": "Tuve miedo sin razÃ³n", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]},
      {"id": "q21", "texto": "SentÃ­ que la vida no tenÃ­a sentido", "opciones": [{"texto": "Nada aplicable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Bastante", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 14, "interpretacion": "Normal (Sin sÃ­ntomas clÃ­nicos significativos)"},
      {"min": 15, "max": 23, "interpretacion": "SintomatologÃ­a Leve"},
      {"min": 24, "max": 33, "interpretacion": "SintomatologÃ­a Moderada"},
      {"min": 34, "max": 63, "interpretacion": "SintomatologÃ­a Severa"}
    ]'::jsonb
);


INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'BAI (Inventario de Ansiedad de Beck)',
    'Mide la severidad de los sÃ­ntomas de ansiedad, especialmente los fÃ­sicos.',
    '[
      {"id": "q1", "texto": "Hormigueo o entumecimiento", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Levemente", "puntaje": 1}, {"texto": "Moderadamente", "puntaje": 2}, {"texto": "Severamente", "puntaje": 3}]},
      {"id": "q2", "texto": "SensaciÃ³n de calor", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q3", "texto": "Temblores en las piernas", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q4", "texto": "Incapacidad de relajarse", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q5", "texto": "Miedo a que ocurra lo peor", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q6", "texto": "Mareos o aturdimiento", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q7", "texto": "Latidos del corazÃ³n fuertes y acelerados", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q8", "texto": "Inseguridad", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q9", "texto": "Terrores", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q10", "texto": "Nerviosismo", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q11", "texto": "SensaciÃ³n de ahogo", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q12", "texto": "Temblores en las manos", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q13", "texto": "Miedo a perder el control", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q14", "texto": "Dificultad para respirar", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q15", "texto": "Miedo a morir", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q16", "texto": "Miedo o susto", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q17", "texto": "IndigestiÃ³n o malestar estomacal", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q18", "texto": "Desmayos", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q19", "texto": "Rubor facial", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]},
      {"id": "q20", "texto": "SudoraciÃ³n (no debida al calor)", "opciones": [{"texto": "En absoluto", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Severo", "puntaje": 3}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 7, "interpretacion": "Ansiedad MÃ­nima"},
      {"min": 8, "max": 15, "interpretacion": "Ansiedad Leve"},
      {"min": 16, "max": 25, "interpretacion": "Ansiedad Moderada"},
      {"min": 26, "max": 63, "interpretacion": "Ansiedad Severa"}
    ]'::jsonb
);


INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'ISI (Ãndice de Severidad del Insomnio)',
    'Cuestionario breve para evaluar la severidad del insomnio.',
    '[
      {"id": "q1", "texto": "Dificultad para quedarse dormido/a", "opciones": [{"texto": "Ninguna", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderada", "puntaje": 2}, {"texto": "Severa", "puntaje": 3}, {"texto": "Muy severa", "puntaje": 4}]},
      {"id": "q2", "texto": "Dificultad para mantenerse dormido/a", "opciones": [{"texto": "Ninguna", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderada", "puntaje": 2}, {"texto": "Severa", "puntaje": 3}, {"texto": "Muy severa", "puntaje": 4}]},
      {"id": "q3", "texto": "Problemas de despertar demasiado temprano", "opciones": [{"texto": "Ninguna", "puntaje": 0}, {"texto": "Leve", "puntaje": 1}, {"texto": "Moderada", "puntaje": 2}, {"texto": "Severa", "puntaje": 3}, {"texto": "Muy severa", "puntaje": 4}]},
      {"id": "q4", "texto": "Â¿QuÃ© tan satisfecho/a estÃ¡ con su patrÃ³n actual de sueÃ±o?", "opciones": [{"texto": "Muy satisfecho", "puntaje": 0}, {"texto": "Satisfecho", "puntaje": 1}, {"texto": "Neutral", "puntaje": 2}, {"texto": "Insatisfecho", "puntaje": 3}, {"texto": "Muy insatisfecho", "puntaje": 4}]},
      {"id": "q5", "texto": "Â¿QuÃ© tan notable considera que es su problema de sueÃ±o para los demÃ¡s en tÃ©rminos de su calidad de vida?", "opciones": [{"texto": "Nada notable", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Moderado", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}, {"texto": "Extremadamente", "puntaje": 4}]},
      {"id": "q6", "texto": "Â¿QuÃ© tan preocupado/a o afligido/a estÃ¡ por su problema actual de sueÃ±o?", "opciones": [{"texto": "Nada preocupado", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Moderadamente", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}, {"texto": "Extremadamente", "puntaje": 4}]},
      {"id": "q7", "texto": "Â¿Hasta quÃ© punto interfiere su problema de sueÃ±o con su funcionamiento diario (fatiga, concentraciÃ³n, memoria)?", "opciones": [{"texto": "No interfiere", "puntaje": 0}, {"texto": "Un poco", "puntaje": 1}, {"texto": "Moderadamente", "puntaje": 2}, {"texto": "Mucho", "puntaje": 3}, {"texto": "Extremadamente", "puntaje": 4}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 7, "interpretacion": "Sin insomnio clÃ­nicamente significativo"},
      {"min": 8, "max": 14, "interpretacion": "Insomnio SubclÃ­nico"},
      {"min": 15, "max": 21, "interpretacion": "Insomnio ClÃ­nico Moderado"},
      {"min": 22, "max": 28, "interpretacion": "Insomnio ClÃ­nico Severo"}
    ]'::jsonb
);


INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'AUDIT (Cuestionario de IdentificaciÃ³n de Trastornos Debidos al Consumo de Alcohol)',
    'Prueba de la OMS para detectar el consumo perjudicial y de riesgo de alcohol.',
    '[
      {"id": "q1", "texto": "Â¿Con quÃ© frecuencia consume alguna bebida alcohÃ³lica?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "1 o menos veces al mes", "puntaje": 1}, {"texto": "2 a 4 veces al mes", "puntaje": 2}, {"texto": "2 a 3 veces a la semana", "puntaje": 3}, {"texto": "4 o mÃ¡s veces a la semana", "puntaje": 4}]},
      {"id": "q2", "texto": "Â¿CuÃ¡ntas bebidas alcohÃ³licas suele consumir en un dÃ­a de consumo normal?", "opciones": [{"texto": "1 o 2", "puntaje": 0}, {"texto": "3 o 4", "puntaje": 1}, {"texto": "5 o 6", "puntaje": 2}, {"texto": "7 a 9", "puntaje": 3}, {"texto": "10 o mÃ¡s", "puntaje": 4}]},
      {"id": "q3", "texto": "Â¿Con quÃ© frecuencia toma 6 o mÃ¡s bebidas alcohÃ³licas en un solo dÃ­a?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
      {"id": "q4", "texto": "Â¿Con quÃ© frecuencia en el curso del Ãºltimo aÃ±o ha sido incapaz de parar de beber una vez habÃ­a empezado?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
      {"id": "q5", "texto": "Â¿Con quÃ© frecuencia en el curso del Ãºltimo aÃ±o no pudo hacer lo que se esperaba de usted porque habÃ­a bebido?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
      {"id": "q6", "texto": "Â¿Con quÃ© frecuencia en el curso del Ãºltimo aÃ±o ha necesitado beber en ayunas para recuperarse despuÃ©s de haber bebido mucho el dÃ­a anterior?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
      {"id": "q7", "texto": "Â¿Con quÃ© frecuencia en el curso del Ãºltimo aÃ±o ha tenido remordimientos o sentimientos de culpa despuÃ©s de haber bebido?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
      {"id": "q8", "texto": "Â¿Con quÃ© frecuencia en el curso del Ãºltimo aÃ±o no ha podido recordar lo que sucediÃ³ la noche anterior porque habÃ­a estado bebiendo?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Menos de una vez al mes", "puntaje": 1}, {"texto": "Mensualmente", "puntaje": 2}, {"texto": "Semanalmente", "puntaje": 3}, {"texto": "A diario o casi a diario", "puntaje": 4}]},
      {"id": "q9", "texto": "Â¿Usted o alguna otra persona ha resultado herido porque usted habÃ­a bebido?", "opciones": [{"texto": "No", "puntaje": 0}, {"texto": "SÃ­, pero no en el curso del Ãºltimo aÃ±o", "puntaje": 2}, {"texto": "SÃ­, el Ãºltimo aÃ±o", "puntaje": 4}]},
      {"id": "q10", "texto": "Â¿AlgÃºn familiar, amigo, mÃ©dico o profesional sanitario ha mostrado preocupaciÃ³n por su consumo de alcohol o le ha sugerido que deje de beber?", "opciones": [{"texto": "No", "puntaje": 0}, {"texto": "SÃ­, pero no en el curso del Ãºltimo aÃ±o", "puntaje": 2}, {"texto": "SÃ­, el Ãºltimo aÃ±o", "puntaje": 4}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 7, "interpretacion": "Consumo de bajo riesgo"},
      {"min": 8, "max": 15, "interpretacion": "Consumo de Riesgo"},
      {"min": 16, "max": 19, "interpretacion": "Consumo Perjudicial"},
      {"min": 20, "max": 40, "interpretacion": "Posible Dependencia del Alcohol"}
    ]'::jsonb
);


INSERT INTO public.evaluaciones_plantillas (titulo, descripcion, preguntas, escalas)
VALUES (
    'ASRS-v1.1 (Cuestionario Corto para TDAH)',
    'Herramienta de despistaje (Screener de 6 preguntas) de la OMS para detectar el TDAH en adultos.',
    '[
      {"id": "q1", "texto": "Â¿Con quÃ© frecuencia tiene dificultad para concentrarse en lo que la gente le dice, incluso cuando estÃ¡n hablÃ¡ndole directamente?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
      {"id": "q2", "texto": "Â¿Con quÃ© frecuencia abandona su asiento en reuniones o en otras situaciones en las que se espera que permanezca sentado?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
      {"id": "q3", "texto": "Â¿Con quÃ© frecuencia le cuesta relajarse o descansar cuando tiene tiempo libre?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
      {"id": "q4", "texto": "Â¿Con quÃ© frecuencia se encuentra a sÃ­ mismo terminando las frases de las personas con las que habla, antes de que ellas puedan terminarlas?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
      {"id": "q5", "texto": "Â¿Con quÃ© frecuencia posterga las cosas hasta el Ãºltimo minuto?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]},
      {"id": "q6", "texto": "Â¿Con quÃ© frecuencia depende de otros para mantener su vida en orden o para atender detalles?", "opciones": [{"texto": "Nunca", "puntaje": 0}, {"texto": "Rara vez", "puntaje": 0}, {"texto": "A veces", "puntaje": 1}, {"texto": "A menudo", "puntaje": 1}, {"texto": "Muy a menudo", "puntaje": 1}]}
    ]'::jsonb,
    '[
      {"min": 0, "max": 3, "interpretacion": "SintomatologÃ­a Negativa para TDAH"},
      {"min": 4, "max": 6, "interpretacion": "SintomatologÃ­a Altamente Sugestiva de TDAH"}
    ]'::jsonb
);




-- ==========================================
-- MÃ“DULO 9: STORAGE Y ARCHIVOS
-- ==========================================

-- 4. CREAR EL BUCKET EN SUPABASE STORAGE
-- Inserta el bucket 'pacientes_archivos' si no existe. 
-- Lo configuramos como NO pÃºblico, ya que los archivos mÃ©dicos son confidenciales.
INSERT INTO storage.buckets (id, name, public)
VALUES ('pacientes_archivos', 'pacientes_archivos', false)
ON CONFLICT (id) DO NOTHING;

-- 5. POLÃTICAS DE RLS PARA STORAGE
-- Permitimos interacciÃ³n si el usuario estÃ¡ autenticado. El aislamiento se refuerza mediante la tabla 'archivos_paciente'
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
-- FIN DEL SCRIPT MAESTRO
-- ==========================================



