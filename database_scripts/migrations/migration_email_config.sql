-- Agregar columnas de configuración de correo a la tabla clinicas
ALTER TABLE public.clinicas
  ADD COLUMN IF NOT EXISTS resend_api_key TEXT,
  ADD COLUMN IF NOT EXISTS email_remitente TEXT;
