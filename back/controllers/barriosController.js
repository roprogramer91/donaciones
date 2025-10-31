const barriosModel = require('../models/barriosModel');

async function getBarrios(req, res) {
  const { localidad_id } = req.query;
  try {
    if (localidad_id) {
      // Si hay query string, filtrar por localidad
      const barrios = await barriosModel.getBarriosByLocalidadId(localidad_id);
      res.json(barrios);
    } else {
      // Si no, traer todos
      const barrios = await barriosModel.getAllBarrios();
      res.json(barrios);
    }
  } catch (error) {
    console.error('Error al obtener barrios:', error);
    res.status(500).json({ error: 'Error al obtener barrios' });
  }
}

async function getBarrioById(req, res) {
  const { id } = req.params;
  try {
    const barrio = await barriosModel.getBarrioById(id);
    if (barrio) {
      res.json(barrio);
    } else {
      res.status(404).json({ error: 'Barrio no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener barrio por ID:', error);
    res.status(500).json({ error: 'Error al obtener barrio por ID' });
  }
}

async function getBarriosByLocalidad(req, res) {
  const { id } = req.params;
  try {
    const barrios = await barriosModel.getBarriosByLocalidadId(id);
    res.json(barrios);
  } catch (error) {
    console.error('Error al obtener barrios por localidad:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}


module.exports = {
  getBarrios,
  getBarrioById,
  getBarriosByLocalidad,
};
