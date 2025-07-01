const localidadesModel = require('../models/localidadesModel');

async function getLocalidades(req, res) {
  const { provincia_id } = req.query;
  try {
    if (provincia_id) {
      // Si hay query string, filtrar por provincia
      const localidades = await localidadesModel.getLocalidadesByProvinciaId(provincia_id);
      res.json(localidades);
    } else {
      // Si no, traer todas
      const localidades = await localidadesModel.getAllLocalidades();
      res.json(localidades);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener localidades' });
  }
}


async function getLocalidadById(req, res) {
  const { id } = req.params;
  try {
    const localidad = await localidadesModel.getLocalidadById(id);
    if (localidad) {
      res.json(localidad);
    } else {
      res.status(404).json({ error: 'Localidad no encontrada' });
    }
  } catch (error) {
    console.error('Error al obtener localidad por ID:', error);
    res.status(500).json({ error: 'Error al obtener localidad por ID' });
  }
}

async function getLocalidadesByProvincia(req, res) {
  const { id } = req.params;
  try {
    const localidades = await localidadesModel.getLocalidadesByProvinciaId(id);
    res.json(localidades);
  } catch (error) {
    console.error('Error al obtener localidades por provincia:', error);
    res.status(500).json({ error: 'Error al obtener localidades por provincia' });
  }
}

module.exports = {
  getLocalidades,
  getLocalidadById,
  getLocalidadesByProvincia
};