-- Crea/normaliza la tabla de centros de hemoterapia para el panel admin
-- Si la tabla ya existía, solo agrega columnas faltantes relevantes al CRUD.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'centros_hemoterapia'
  ) THEN
    CREATE TABLE centros_hemoterapia (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      direccion TEXT,
      telefono TEXT,
      email TEXT,
      provincia_id INTEGER,
      localidad_id INTEGER,
      barrio_id INTEGER,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- Refuerza/crea columnas clave si la tabla ya existía
ALTER TABLE IF EXISTS centros_hemoterapia
  ADD COLUMN IF NOT EXISTS usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Índice útil para lookups por usuario_id
CREATE UNIQUE INDEX IF NOT EXISTS centros_usuario_id_uidx
  ON centros_hemoterapia (usuario_id);
