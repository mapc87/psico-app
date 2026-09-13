-- Migración para añadir columnas que no se crearon si las tablas ya existían,
-- y para agregar las políticas de UPDATE necesarias para RLS.

-- 1. Columnas faltantes para public.usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS profesion TEXT,
ADD COLUMN IF NOT EXISTS no_colegiado TEXT,
ADD COLUMN IF NOT EXISTS especialidad TEXT,
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
ADD COLUMN IF NOT EXISTS genero TEXT CHECK (genero IN ('masculino', 'femenino', 'otro', 'prefiero_no_decir')),
ADD COLUMN IF NOT EXISTS dpi TEXT,
ADD COLUMN IF NOT EXISTS telefono TEXT;

-- 2. Columnas faltantes para public.clinicas
ALTER TABLE public.clinicas 
ADD COLUMN IF NOT EXISTS nit VARCHAR(20),
ADD COLUMN IF NOT EXISTS razon_social VARCHAR(255),
ADD COLUMN IF NOT EXISTS nombre_comercial VARCHAR(255),
ADD COLUMN IF NOT EXISTS direccion_fiscal TEXT,
ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(50),
ADD COLUMN IF NOT EXISTS no_patente VARCHAR(100),
ADD COLUMN IF NOT EXISTS abreviatura VARCHAR(50),
ADD COLUMN IF NOT EXISTS resend_api_key TEXT,
ADD COLUMN IF NOT EXISTS email_remitente TEXT;

-- 3. Políticas de actualización (UPDATE) faltantes
DROP POLICY IF EXISTS "usuarios_update_policy" ON public.usuarios;
CREATE POLICY "usuarios_update_policy" ON public.usuarios
FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "clinicas_update_policy" ON public.clinicas;
CREATE POLICY "clinicas_update_policy" ON public.clinicas
FOR UPDATE USING (id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

-- Recargar caché de Supabase
NOTIFY pgrst, 'reload schema';
