// En este archivo expongo la logica de provincias
const provinciasModel = require('../models/provinciasModel');

async function getProvincias(req, res) {
  try {
    const provincias = await provinciasModel.getAllProvincias();
    res.json(provincias);
  } catch (error) {
    console.error('Error al obtener provincias:', error);
    res.status(500).json({ error: 'Error al obtener provincias' });
  }
}

module.exports = {
  getProvincias
};

