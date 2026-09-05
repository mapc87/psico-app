-- Agregar campos de información fiscal y comercial a la tabla clinicas
ALTER TABLE clinicas
ADD COLUMN IF NOT EXISTS nit VARCHAR(20),
ADD COLUMN IF NOT EXISTS razon_social VARCHAR(255),
ADD COLUMN IF NOT EXISTS nombre_comercial VARCHAR(255),
ADD COLUMN IF NOT EXISTS direccion_fiscal TEXT,
ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(50),
ADD COLUMN IF NOT EXISTS no_patente VARCHAR(100),
ADD COLUMN IF NOT EXISTS abreviatura VARCHAR(50);
