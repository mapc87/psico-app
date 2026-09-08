-- ==========================================
-- SCRIPT: 05_videoconsultas.sql
-- DESCRIPCIÓN: Añade soporte para videoconsultas en la tabla citas
-- ==========================================

-- Añadir campo de modalidad a las citas (presencial o virtual)
ALTER TABLE public.citas 
ADD COLUMN IF NOT EXISTS modalidad TEXT DEFAULT 'presencial' 
CHECK (modalidad IN ('presencial', 'virtual'));

-- Añadir campo para el enlace/ID de la sala virtual
ALTER TABLE public.citas 
ADD COLUMN IF NOT EXISTS enlace_video TEXT;
