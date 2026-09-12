-- Función segura para iniciar sesión en el portal de pacientes sin exponer toda la tabla
CREATE OR REPLACE FUNCTION public.login_portal_paciente(p_pin_acceso text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paciente record;
BEGIN
  -- Buscar al paciente por su PIN único
  SELECT id, nombre, clinica_id, estado 
  INTO v_paciente
  FROM pacientes
  WHERE pin_acceso = p_pin_acceso
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN row_to_json(v_paciente)::jsonb;
END;
$$;

-- Otorgar permisos al rol anon y authenticated para ejecutarla
GRANT EXECUTE ON FUNCTION public.login_portal_paciente(text) TO anon, authenticated;
