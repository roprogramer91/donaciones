// En este archivo manejo las acciones de barrios
const barriosModel = require('../models/barriosModel');

async function getBarrios(req, res) {
  const { localidad_id } = req.query;
  try {
    if (localidad_id) {
      // Aqui filtro por localidad si llega en la query
      const barrios = await barriosModel.getBarriosByLocalidadId(localidad_id);
      res.json(barrios);
    } else {
      // Aqui traigo todos cuando no hay filtros
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


