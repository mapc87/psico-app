-- 1. CREAR LA TABLA PARA METADATOS DE ARCHIVOS
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

-- 2. HABILITAR RLS PARA LA TABLA
ALTER TABLE public.archivos_paciente ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE RLS PARA LA TABLA (Aislamiento por clínica)
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
