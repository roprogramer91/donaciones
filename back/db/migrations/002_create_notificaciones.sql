-- Optional notifications table for centers
CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  centro_id INTEGER NOT NULL REFERENCES centros_hemoterapia(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_centro ON notificaciones(centro_id);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notificaciones(created_at DESC);

