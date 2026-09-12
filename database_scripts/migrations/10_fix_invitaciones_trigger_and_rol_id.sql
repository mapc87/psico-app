-- =========================================================================
-- MIGRACIÓN 10: SOLUCIÓN COMPLETA DE REGISTRO, LOGIN Y POLÍTICAS RLS
-- =========================================================================

-- 1. Asegurar la existencia de la tabla roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    permisos JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 2. Añadir la columna rol_id a la tabla usuarios (si no existe)
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS rol_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- 3. Función RPC segura para verificar si existen usuarios en el sistema (usada por AuthContext)
CREATE OR REPLACE FUNCTION public.check_has_users()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.usuarios);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_has_users() TO anon, authenticated;

-- 4. Actualizar la función trigger handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  _clinica_id UUID := NULL;
  _rol_asignado TEXT := 'admin';
  _invitacion_id UUID;
  _final_rol TEXT := 'admin';
  _final_rol_id UUID := NULL;
BEGIN
  -- Si el metadata contiene un código de invitación
  IF new.raw_user_meta_data->>'codigo_invitacion' IS NOT NULL AND TRIM(new.raw_user_meta_data->>'codigo_invitacion') <> '' THEN
     SELECT id, clinica_id, rol_asignado INTO _invitacion_id, _clinica_id, _rol_asignado 
     FROM public.invitaciones 
     WHERE UPPER(codigo) = UPPER(TRIM(new.raw_user_meta_data->>'codigo_invitacion')) AND usado = false
     LIMIT 1;
     
     -- Si el código no existe o ya fue usado, lanzar excepción
     IF _invitacion_id IS NULL THEN
       RAISE EXCEPTION 'El código de invitación es inválido o ya ha sido utilizado.';
     END IF;

     -- Marcar la invitación como usada
     UPDATE public.invitaciones SET usado = true WHERE id = _invitacion_id;

     -- Validar si rol_asignado es un rol nativo o un UUID de la tabla roles
     IF _rol_asignado IN ('superadmin', 'admin', 'personal', 'doctor') THEN
       _final_rol := _rol_asignado;
     ELSE
       -- Es un UUID de rol personalizado
       _final_rol := 'personal';
       BEGIN
         _final_rol_id := _rol_asignado::UUID;
       EXCEPTION WHEN OTHERS THEN
         _final_rol_id := NULL;
       END;
     END IF;
  ELSE
    -- Registro sin invitación (creación del primer SuperAdmin del sistema)
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

-- Recrear el trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Corregir Políticas RLS para evitar recursión infinita o bloqueos al iniciar sesión

-- RLS en la tabla usuarios: permitir que cada usuario lea y actualice según corresponda
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_select_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_select_policy" ON public.usuarios;
CREATE POLICY "usuarios_select_policy" ON public.usuarios
FOR SELECT USING (
  id = auth.uid() OR auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "user_update_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON public.usuarios;
CREATE POLICY "usuarios_update_policy" ON public.usuarios
FOR UPDATE USING (
  id = auth.uid() OR auth.role() = 'authenticated'
);

-- RLS en la tabla clinicas: permitir lectura a usuarios autenticados
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinicas_select_policy" ON public.clinicas;
CREATE POLICY "clinicas_select_policy" ON public.clinicas
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- RLS en la tabla roles: permitir lectura a usuarios autenticados
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_select_policy" ON public.roles;
CREATE POLICY "roles_select_policy" ON public.roles
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- 6. Reparación de Usuarios Huérfanos
-- Si algún usuario logró registrarse en auth.users mientras el trigger fallaba,
-- este bloque le creará automáticamente su perfil en public.usuarios para que pueda iniciar sesión.
INSERT INTO public.usuarios (id, email, nombre, rol, clinica_id)
SELECT 
  au.id, 
  au.email, 
  COALESCE(au.raw_user_meta_data->>'nombre', 'Usuario'), 
  'admin', 
  NULL
FROM auth.users au
LEFT JOIN public.usuarios u ON u.id = au.id
WHERE u.id IS NULL AND au.email IS NOT NULL AND au.email NOT IN (SELECT email FROM public.usuarios)
ON CONFLICT (id) DO NOTHING;
