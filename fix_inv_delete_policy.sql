-- Permitir a los administradores y doctores eliminar invitaciones de su propia clínica
CREATE POLICY "admin_delete_inv" 
ON public.invitaciones 
FOR DELETE 
USING (
  (SELECT rol FROM public.usuarios WHERE id = auth.uid()) IN ('admin', 'doctor') AND
  clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid())
);
