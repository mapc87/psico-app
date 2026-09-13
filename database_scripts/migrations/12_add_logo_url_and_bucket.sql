-- 1. Añadir columna logo_url a la tabla clinicas
ALTER TABLE public.clinicas 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Crear bucket público para los logos de las clínicas
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinicas_logos', 'clinicas_logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de seguridad para el bucket 'clinicas_logos'

-- Permitir a cualquiera ver/descargar los logos (ya que son públicos para reportes)
DROP POLICY IF EXISTS "Logos visibles publicamente" ON storage.objects;
CREATE POLICY "Logos visibles publicamente" 
ON storage.objects FOR SELECT
USING (bucket_id = 'clinicas_logos');

-- Permitir a los usuarios autenticados subir logos a su clínica
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir logos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir logos" 
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clinicas_logos');

-- Permitir a los usuarios autenticados actualizar/eliminar logos
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar logos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden actualizar logos" 
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'clinicas_logos');

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar logos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden eliminar logos" 
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'clinicas_logos');

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
