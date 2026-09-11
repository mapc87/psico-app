-- Crear tabla de plantillas de documentos
CREATE TABLE IF NOT EXISTS public.plantillas_documentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  contenido text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para plantillas
ALTER TABLE public.plantillas_documentos ENABLE ROW LEVEL SECURITY;

-- Políticas para plantillas
DROP POLICY IF EXISTS "user_select_plantillas" ON public.plantillas_documentos;
CREATE POLICY "user_select_plantillas" ON public.plantillas_documentos 
FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "user_insert_plantillas" ON public.plantillas_documentos;
CREATE POLICY "user_insert_plantillas" ON public.plantillas_documentos 
FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "user_update_plantillas" ON public.plantillas_documentos;
CREATE POLICY "user_update_plantillas" ON public.plantillas_documentos 
FOR UPDATE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "user_delete_plantillas" ON public.plantillas_documentos;
CREATE POLICY "user_delete_plantillas" ON public.plantillas_documentos 
FOR DELETE USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));


-- Crear tabla de consentimientos firmados
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

-- Habilitar RLS para consentimientos firmados
ALTER TABLE public.consentimientos_firmados ENABLE ROW LEVEL SECURITY;

-- Políticas para consentimientos
DROP POLICY IF EXISTS "user_select_consentimientos" ON public.consentimientos_firmados;
CREATE POLICY "user_select_consentimientos" ON public.consentimientos_firmados 
FOR SELECT USING (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "user_insert_consentimientos" ON public.consentimientos_firmados;
CREATE POLICY "user_insert_consentimientos" ON public.consentimientos_firmados 
FOR INSERT WITH CHECK (clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "public_update_consentimientos_pendientes" ON public.consentimientos_firmados;
CREATE POLICY "public_update_consentimientos_pendientes" ON public.consentimientos_firmados
FOR UPDATE USING (estado = 'pendiente');

DROP POLICY IF EXISTS "public_select_consentimientos_pendientes" ON public.consentimientos_firmados;
CREATE POLICY "public_select_consentimientos_pendientes" ON public.consentimientos_firmados
FOR SELECT USING (estado = 'pendiente');

-- Insertar plantilla por defecto automáticamente al crear una nueva clínica
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

-- Trigger para ejecutar la función cuando se crea una clínica
DROP TRIGGER IF EXISTS on_clinica_created_plantilla ON public.clinicas;
CREATE TRIGGER on_clinica_created_plantilla
  AFTER INSERT ON public.clinicas
  FOR EACH ROW EXECUTE FUNCTION public.crear_plantilla_defecto();

-- Insertar la plantilla por defecto para todas las clínicas que ya existen y no tienen plantillas
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
