-- 1. Añadir columnas a consentimientos_firmados
ALTER TABLE public.consentimientos_firmados 
ADD COLUMN IF NOT EXISTS archivo_adjunto_url TEXT,
ADD COLUMN IF NOT EXISTS metodo_firma TEXT DEFAULT 'digital';

-- 2. Crear bucket privado para documentos escaneados (solo clínica)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos_escaneados', 'documentos_escaneados', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de seguridad para el bucket 'documentos_escaneados'

-- Permitir a usuarios autenticados ver/descargar documentos
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver documentos escaneados" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden ver documentos escaneados" 
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documentos_escaneados');

-- Permitir a los usuarios autenticados subir documentos
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir documentos escaneados" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir documentos escaneados" 
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documentos_escaneados');

-- Permitir a los usuarios autenticados actualizar/eliminar documentos
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar documentos escaneados" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden actualizar documentos escaneados" 
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documentos_escaneados');

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar documentos escaneados" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden eliminar documentos escaneados" 
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documentos_escaneados');

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
