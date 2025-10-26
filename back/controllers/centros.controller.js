const CentrosModel = require('../models/centros.model');

function obtenerCentroIdDeRequest(req) {
  const header = req.headers['x-centro-id'] || req.headers['X-Centro-Id'];
  if (header && !isNaN(parseInt(header))) return parseInt(header);
  if (req.user && req.user.centro_id) return req.user.centro_id;
  return null;
}

const CentrosController = {
  async obtenerMiPerfil(req, res) {
    try {
      const centroId = obtenerCentroIdDeRequest(req);
      if (!centroId) return res.status(400).json({ error: 'centro_id no especificado' });
      const centro = await CentrosModel.obtenerPorId(centroId);
      if (!centro) return res.status(404).json({ error: 'Centro no encontrado' });
      res.json(centro);
    } catch (error) {
      console.error('Error al obtener perfil del centro:', error);
      res.status(500).json({ error: 'Error al obtener perfil' });
    }
  },

  async actualizarMiPerfil(req, res) {
    try {
      const centroId = obtenerCentroIdDeRequest(req);
      if (!centroId) return res.status(400).json({ error: 'centro_id no especificado' });

      const { nombre, direccion, telefono, email } = req.body || {};
      const actualizado = await CentrosModel.actualizarParcial(centroId, {
        nombre,
        direccion,
        telefono,
        email,
      });
      if (!actualizado) return res.status(404).json({ error: 'Centro no encontrado' });
      res.json(actualizado);
    } catch (error) {
      console.error('Error al actualizar perfil del centro:', error);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  }
};

module.exports = CentrosController;

