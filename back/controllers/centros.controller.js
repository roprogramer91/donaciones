const CentrosModel = require('../models/centros.model');
const Donante = require('../models/donantes.model');
const CampaniasModel = require('../models/campanias.model');
const { calcularAptoYRestante } = require('../utils/donanteUtils');

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
  ,

  async obtenerResumen(req, res) {
    try {
      const centroId = obtenerCentroIdDeRequest(req);
      if (!centroId) return res.status(400).json({ error: 'centro_id no especificado' });

      // Donantes: totales y aptos hoy, y aptos por grupo
      const donantes = await Donante.obtenerTodos();
      const hoy = new Date();
      let donantesAptos = 0;
      const grupos = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
      const aptosPorGrupo = Object.fromEntries(grupos.map(g => [g, 0]));
      donantes.forEach(d => {
        const sexo = d.sexo || 'M';
        const { apto } = calcularAptoYRestante(d.fecha_ultima_donacion, sexo, hoy);
        if (apto) {
          donantesAptos++;
          if (d.grupo_sanguineo && aptosPorGrupo.hasOwnProperty(d.grupo_sanguineo)) {
            aptosPorGrupo[d.grupo_sanguineo] += 1;
          }
        }
      });

      // Campañas del centro
      const campanias = await CampaniasModel.obtenerPorCentro(centroId);

      const isActiva = (c) => {
        const fi = c.fecha_inicio ? new Date(c.fecha_inicio) : null;
        const ff = c.fecha_fin ? new Date(c.fecha_fin) : null;
        if (fi || ff) {
          if (fi && ff) return fi <= hoy && hoy <= ff;
          if (fi && !ff) return fi <= hoy;
          if (!fi && ff) return hoy <= ff;
        }
        const est = (c.estado || '').toLowerCase();
        if (est.includes('cancel')) return false;
        if (est.includes('final')) return false;
        return est.includes('act');
      };

      const activas = campanias.filter(isActiva).length;

      const en14 = new Date(hoy); en14.setDate(hoy.getDate() + 14);
      const proximas14 = campanias.filter(c => {
        if (!c.fecha_inicio) return false;
        const fi = new Date(c.fecha_inicio);
        const est = (c.estado || '').toLowerCase();
        if (est.includes('cancel')) return false;
        return fi > hoy && fi <= en14;
      }).length;

      const finalizadas = campanias.filter(c => c.fecha_fin && new Date(c.fecha_fin) < hoy);
      const finalizadasCount = finalizadas.length;

      const futuras = campanias.filter(c => c.fecha_inicio && new Date(c.fecha_inicio) > hoy);
      futuras.sort((a,b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
      const siguiente = futuras[0] ? {
        id: futuras[0].id,
        nombre: futuras[0].nombre,
        fecha_inicio: futuras[0].fecha_inicio
      } : null;

      return res.json({
        centro_id: centroId,
        donantes_aptos_hoy: donantesAptos,
        donantes_totales: donantes.length,
        campanias_activas: activas,
        campanias_finalizadas: finalizadasCount,
        proximas_14_dias: proximas14,
        aptos_por_grupo: aptosPorGrupo,
        siguiente_campania: siguiente
      });
    } catch (error) {
      console.error('Error al obtener resumen del centro:', error);
      res.status(500).json({ error: 'Error al obtener resumen' });
    }
  }
};

module.exports = CentrosController;
