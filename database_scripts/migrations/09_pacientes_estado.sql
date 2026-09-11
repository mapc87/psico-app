-- Add estado column to pacientes table
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'activo';
