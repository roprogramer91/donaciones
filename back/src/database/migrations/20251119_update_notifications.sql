-- Actualizar estructura de notificaciones para soportar metadatos y prioridades

ALTER TABLE notificaciones
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS prioridad BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS leida BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS leida_at TIMESTAMP NULL;

-- Opcional: si existía una columna estado que marcaba "leida", sincronizarla con el booleano
-- UPDATE notificaciones SET leida = (estado = 'leida') WHERE estado IS NOT NULL;

ALTER TABLE notificaciones_log
  ADD COLUMN IF NOT EXISTS campania_id INTEGER,
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;
