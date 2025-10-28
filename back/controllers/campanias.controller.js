const CampaniasModel = require('../models/campanias.model');

const CampaniasController = {
  async obtenerCampanias(req, res) {
    try {
      const campanias = await CampaniasModel.obtenerTodas();
            const hoy = new Date();
      const mapEstado = (c) => {
        const fi = c.fecha_inicio ? new Date(c.fecha_inicio) : null;
        const ff = c.fecha_fin ? new Date(c.fecha_fin) : null;
        if (fi && ff) {
          if (fi <= hoy && hoy <= ff) return 'activa';
          if (ff < hoy) return 'finalizada';
          if (fi > hoy) return 'futura';
        } else if (fi && !ff) {
          return fi <= hoy ? 'activa' : 'futura';
        } else if (!fi && ff) {
          return hoy <= ff ? 'activa' : 'finalizada';
        }
        const est = (c.estado || '').toLowerCase();
        if (est.includes('cancel')) return 'cancelada';
        if (est.includes('final')) return 'finalizada';
        if (est.includes('act')) return 'activa';
        if (est.includes('fut')) return 'futura';
        return 'desconocido';
      };
      const resp = campanias.map(c => ({ ...c, estado_calculado: mapEstado(c) }));
      res.json(resp);
    } catch (error) {
      console.error('Error al obtener campañas:', error);
      res.status(500).json({ error: 'Error al obtener campañas' });
    }
  },

  async obtenerCampaniaPorId(req, res) {
    try {
      const { id } = req.params;
      const campania = await CampaniasModel.obtenerPorId(id);
      if (!campania) return res.status(404).json({ error: 'Campaña no encontrada' });
            const hoy = new Date();
      const fi = campania.fecha_inicio ? new Date(campania.fecha_inicio) : null;
      const ff = campania.fecha_fin ? new Date(campania.fecha_fin) : null;
      let estado_calculado = 'desconocido';
      if (fi && ff) {
        if (fi <= hoy && hoy <= ff) estado_calculado = 'activa';
        else if (ff < hoy) estado_calculado = 'finalizada';
        else if (fi > hoy) estado_calculado = 'futura';
      } else if (fi && !ff) {
        estado_calculado = fi <= hoy ? 'activa' : 'futura';
      } else if (!fi && ff) {
        estado_calculado = hoy <= ff ? 'activa' : 'finalizada';
      } else {
        const est = (campania.estado || '').toLowerCase();
        if (est.includes('cancel')) estado_calculado = 'cancelada';
        else if (est.includes('final')) estado_calculado = 'finalizada';
        else if (est.includes('act')) estado_calculado = 'activa';
        else if (est.includes('fut')) estado_calculado = 'futura';
      }
      res.json({ ...campania, estado_calculado });
    } catch (error) {
      console.error('Error al obtener campaña por ID:', error);
      res.status(500).json({ error: 'Error al obtener campaña' });
    }
  },

  async crearCampania(req, res) {
    try {
      const {
        centro_id,
        nombre,
        descripcion,
        imagen_url,
        localidad_id,
        barrio_id,
        fecha_inicio,
        fecha_fin,
      } = req.body || {};

      if (!centro_id || !nombre || !descripcion || !localidad_id || !barrio_id || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      const nueva = await CampaniasModel.crear({
        centro_id,
        nombre,
        descripcion,
        imagen_url,
        localidad_id,
        barrio_id,
        fecha_inicio,
        fecha_fin,
      });
      res.status(201).json(nueva);
    } catch (error) {
      console.error('Error al crear campaña:', error);
      res.status(500).json({ error: 'Error al crear campaña' });
    }
  },

  async actualizarCampania(req, res) {
    try {
      const { id } = req.params;
      const actualizada = await CampaniasModel.actualizar(id, req.body || {});
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
  },

  async obtenerInscriptos(req, res) {
    try {
      const { id } = req.params;
      const inscriptos = await CampaniasModel.listarInscriptosDeCampania(id);
      res.json(inscriptos);
    } catch (error) {
      console.error('Error al listar inscriptos de campaña:', error);
      res.status(500).json({ error: 'Error al listar inscriptos' });
    }
  }
};

module.exports = CampaniasController;



