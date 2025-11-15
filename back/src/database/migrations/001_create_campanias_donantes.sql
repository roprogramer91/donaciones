-- Create join table for donor enrollments in campaigns
CREATE TABLE IF NOT EXISTS campanias_donantes (
  id SERIAL PRIMARY KEY,
  campania_id INTEGER NOT NULL REFERENCES campanias(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (campania_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_campanias_donantes_campania ON campanias_donantes(campania_id);
CREATE INDEX IF NOT EXISTS idx_campanias_donantes_usuario ON campanias_donantes(usuario_id);

