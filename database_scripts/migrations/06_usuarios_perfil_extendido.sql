-- ==========================================
-- SCRIPT: 06_usuarios_perfil_extendido.sql
-- DESCRIPCIÓN: Añade campos de perfil profesional a la tabla usuarios
-- ==========================================

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS telefono        TEXT,
  ADD COLUMN IF NOT EXISTS dpi             TEXT,
  ADD COLUMN IF NOT EXISTS direccion       TEXT,
  ADD COLUMN IF NOT EXISTS profesion       TEXT,
  ADD COLUMN IF NOT EXISTS no_colegiado    TEXT,
  ADD COLUMN IF NOT EXISTS especialidad    TEXT,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
  ADD COLUMN IF NOT EXISTS genero          TEXT CHECK (genero IN ('masculino', 'femenino', 'otro', 'prefiero_no_decir')),
  ADD COLUMN IF NOT EXISTS foto_url        TEXT;
