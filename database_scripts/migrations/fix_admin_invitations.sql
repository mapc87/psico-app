-- Permitir a los administradores crear invitaciones para su propia clínica
CREATE POLICY "admin_insert_inv" 
ON public.invitaciones 
FOR INSERT 
WITH CHECK (
  (SELECT rol FROM public.usuarios WHERE id = auth.uid()) IN ('admin', 'doctor') AND
  clinica_id = (SELECT clinica_id FROM public.usuarios WHERE id = auth.uid())
);
