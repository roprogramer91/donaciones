const CampaniasModel = require('../models/campanias.model');

const CampaniasController = {
  async obtenerCampanias(req, res) {
    try {
      const campanias = await CampaniasModel.obtenerTodas();
      res.json(campanias);
    } catch (error) {
      console.error('Error al obtener campañas:', error);
      res.status(500).json({ error: 'Error al obtener campañas' });
    }
  },

  async crearCampania(req, res) {
    try {
      const nueva = await CampaniasModel.crear(req.body);
      res.status(201).json(nueva);
    } catch (error) {
      console.error('Error al crear campaña:', error);
      res.status(500).json({ error: 'Error al crear campaña' });
    }
  },

  async actualizarCampania(req, res) {
    try {
      const { id } = req.params;
      const actualizada = await CampaniasModel.actualizar(id, req.body);
      res.json(actualizada);
    } catch (error) {
      console.error('Error al actualizar campaña:', error);
      res.status(500).json({ error: 'Error al actualizar campaña' });
    }
  },

  async eliminarCampania(req, res) {
    try {
      const { id } = req.params;
      const eliminada = await CampaniasModel.eliminar(id);
      res.json(eliminada);
    } catch (error) {
      console.error('Error al eliminar campaña:', error);
      res.status(500).json({ error: 'Error al eliminar campaña' });
    }
  }
};

module.exports = CampaniasController;
