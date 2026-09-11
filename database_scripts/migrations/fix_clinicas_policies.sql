-- Arreglar políticas de la tabla clinicas
-- Eliminar políticas antiguas (si existen)
DROP POLICY IF EXISTS "superadmin_select_clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "superadmin_insert_clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "superadmin_update_clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "superadmin_delete_clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "user_select_clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "admin_update_clinicas" ON public.clinicas;

-- Superadmin puede hacer todo
CREATE POLICY "superadmin_select_clinicas" ON public.clinicas 
FOR SELECT USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );

CREATE POLICY "superadmin_insert_clinicas" ON public.clinicas 
FOR INSERT WITH CHECK ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );

CREATE POLICY "superadmin_update_clinicas" ON public.clinicas 
FOR UPDATE USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );

CREATE POLICY "superadmin_delete_clinicas" ON public.clinicas 
FOR DELETE USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'superadmin' );

-- Usuarios normales pueden ver su propia clínica
CREATE POLICY "user_select_clinicas" ON public.clinicas 
FOR SELECT USING ( id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()) );

-- Admins pueden editar los datos de su propia clínica (ConfiguracionClinica)
CREATE POLICY "admin_update_clinicas" ON public.clinicas 
FOR UPDATE USING ( 
  id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid()) 
  AND (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin'
);
