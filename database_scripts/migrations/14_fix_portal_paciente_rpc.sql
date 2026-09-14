-- Migración 14: Funciones RPC para el Portal del Paciente (Security Definer)
-- Permite a los pacientes acceder a sus citas, tareas, archivos y documentos firmados sin requerir sesión activa de usuario/doctor en Supabase Auth.

-- 1. Actualizar login_portal_paciente para incluir pin_acceso en el retorno
CREATE OR REPLACE FUNCTION public.login_portal_paciente(p_pin_acceso text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paciente record;
BEGIN
  SELECT id, nombre, clinica_id, estado, pin_acceso 
  INTO v_paciente
  FROM public.pacientes
  WHERE pin_acceso = p_pin_acceso
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN row_to_json(v_paciente)::jsonb;
END;
$$;

GRANT EXECUTE ON FUNCTION public.login_portal_paciente(text) TO anon, authenticated;

-- 2. Función segura para obtener el dashboard del paciente sin requerir auth.uid()
CREATE OR REPLACE FUNCTION public.obtener_datos_portal_paciente(p_paciente_id uuid, p_pin_acceso text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valido boolean;
  v_citas jsonb;
  v_tareas jsonb;
  v_archivos jsonb;
  v_documentos jsonb;
BEGIN
  -- Validar existencia y estado del paciente
  SELECT EXISTS (
    SELECT 1 FROM public.pacientes
    WHERE id = p_paciente_id 
      AND (p_pin_acceso IS NULL OR pin_acceso = p_pin_acceso)
      AND estado = 'activo'
  ) INTO v_valido;

  IF NOT v_valido THEN
    RETURN jsonb_build_object(
      'citas', '[]'::jsonb,
      'tareas', '[]'::jsonb,
      'archivos', '[]'::jsonb,
      'documentos', '[]'::jsonb
    );
  END IF;

  -- 1. Próximas citas programadas
  SELECT COALESCE(jsonb_agg(c), '[]'::jsonb) INTO v_citas
  FROM (
    SELECT *
    FROM public.citas
    WHERE paciente_id = p_paciente_id
      AND estado = 'programada'
      AND fecha_hora >= (NOW() - INTERVAL '1 day')
    ORDER BY fecha_hora ASC
    LIMIT 5
  ) c;

  -- 2. Tareas asignadas al paciente
  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_tareas
  FROM (
    SELECT *
    FROM public.tareas_paciente
    WHERE paciente_id = p_paciente_id
    ORDER BY CASE WHEN estado = 'pendiente' THEN 0 ELSE 1 END
  ) t;

  -- 3. Archivos adjuntos del paciente
  SELECT COALESCE(jsonb_agg(a), '[]'::jsonb) INTO v_archivos
  FROM (
    SELECT *
    FROM public.archivos_paciente
    WHERE paciente_id = p_paciente_id
    ORDER BY fecha_subida DESC
    LIMIT 10
  ) a;

  -- 4. Documentos / Consentimientos firmados del paciente
  SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) INTO v_documentos
  FROM (
    SELECT *
    FROM public.consentimientos_firmados
    WHERE paciente_id = p_paciente_id
    ORDER BY fecha_firma DESC
    LIMIT 10
  ) d;

  RETURN jsonb_build_object(
    'citas', v_citas,
    'tareas', v_tareas,
    'archivos', v_archivos,
    'documentos', v_documentos
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_datos_portal_paciente(uuid, text) TO anon, authenticated;

-- 3. Función segura para completar tareas desde el portal del paciente
CREATE OR REPLACE FUNCTION public.completar_tarea_portal(p_tarea_id uuid, p_paciente_id uuid, p_pin_acceso text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.pacientes
    WHERE id = p_paciente_id 
      AND (p_pin_acceso IS NULL OR pin_acceso = p_pin_acceso)
      AND estado = 'activo'
  ) THEN
    UPDATE public.tareas_paciente
    SET estado = 'completado', fecha_completada = NOW()
    WHERE id = p_tarea_id AND paciente_id = p_paciente_id;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.completar_tarea_portal(uuid, uuid, text) TO anon, authenticated;
