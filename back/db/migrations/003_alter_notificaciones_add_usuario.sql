-- Allow per-user notifications and optional linkage to campaigns
ALTER TABLE notificaciones
  ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS campania_id INTEGER REFERENCES campanias(id);

-- centro_id no requerido para notificaciones destinadas al usuario
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='notificaciones' AND column_name='centro_id'
  ) THEN
    BEGIN
      -- Best-effort: make centro_id nullable if it was NOT NULL
      ALTER TABLE notificaciones ALTER COLUMN centro_id DROP NOT NULL;
    EXCEPTION WHEN others THEN
      -- ignore if constraint state unknown
      NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificaciones(usuario_id, leida, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_campania ON notificaciones(campania_id);

