-- ==========================================
-- SCRIPT DE CONFIGURACIÃ“N DE BASE DE DATOS MAESTRO
-- SUPABASE - CLÃNICA PSICOLÃ“GICA (MULTI-TENANT)
-- ==========================================
-- NOTA: Este archivo unifica todas las migraciones anteriores en un solo script.
-- EstÃ¡ diseÃ±ado para ser ejecutado en ambientes nuevos (QA, UAT, PROD).
-- ==========================================

-- ==========================================
-- MÃ“DULO 1: CORE Y SEGURIDAD (ClÃ­nicas, Usuarios, Invitaciones)
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

-- TRIGGER DE REGISTRO AUTOMÃTICO DE USUARIOS
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
-- MÃ“DULO 2: PACIENTES Y CITAS (Expedientes y Agendamiento)
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
    recordatorio_enviado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- MÃ“DULO 3: HISTORIAL CLÃNICO (DiagnÃ³sticos, Medicamentos, ExÃ¡menes, Signos, Notas, Archivos)
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
-- MÃ“DULO 4: CONSENTIMIENTOS Y PLANTILLAS
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

-- Insertar plantilla por defecto automÃ¡ticamente al crear una nueva clÃ­nica
CREATE OR REPLACE FUNCTION public.crear_plantilla_defecto()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.plantillas_documentos (clinica_id, titulo, contenido)
  VALUES (
    NEW.id,
    'Consentimiento Informado General (Adultos)',
    'CONSENTIMIENTO INFORMADO PARA EVALUACIÃ“N Y TRATAMIENTO PSICOLÃ“GICO...'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_clinica_created_plantilla ON public.clinicas;
CREATE TRIGGER on_clinica_created_plantilla
  AFTER INSERT ON public.clinicas
  FOR EACH ROW EXECUTE FUNCTION public.crear_plantilla_defecto();


-- ==========================================
-- MÃ“DULO 5: EVALUACIONES PSICOMÃ‰TRICAS Y TAREAS
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
-- MÃ“DULO 6: FACTURACIÃ“N, PAQUETES Y CAJA
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
-- MÃ“DULO 7: POLÃTICAS RLS (Row Level Security) GENÃ‰RICAS
-- ==========================================
-- PolÃ­ticas globales (Las tablas individuales ya tienen RLS Habilitado)
-- Para uso en producciÃ³n, se deben habilitar de forma infalible aquÃ­.

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

-- Ejecutar la asignaciÃ³n de polÃ­ticas genÃ©ricas
SELECT public.aplicar_politicas_clinica();



-- ==========================================
-- MÓDULO 8: DATOS INICIALES (Plantillas Psicométricas)
-- ==========================================

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




-- ==========================================
-- MÓDULO 9: STORAGE Y ARCHIVOS
-- ==========================================

-- 4. CREAR EL BUCKET EN SUPABASE STORAGE
-- Inserta el bucket 'pacientes_archivos' si no existe. 
-- Lo configuramos como NO público, ya que los archivos médicos son confidenciales.
INSERT INTO storage.buckets (id, name, public)
VALUES ('pacientes_archivos', 'pacientes_archivos', false)
ON CONFLICT (id) DO NOTHING;

-- 5. POLÍTICAS DE RLS PARA STORAGE
-- Permitimos interacción si el usuario está autenticado. El aislamiento se refuerza mediante la tabla 'archivos_paciente'
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


