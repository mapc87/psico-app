-- ==========================================
-- SCRIPT: 07_usuarios_activo.sql
-- DESCRIPCIÓN: Añade campo activo a la tabla usuarios para bloquear acceso
-- ==========================================

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
