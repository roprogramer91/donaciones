const CentrosModel = require('../models/centros.model');
const Donante = require('../models/donantes.model');
const CampaniasModel = require('../models/campanias.model');
const Notificaciones = require('../models/notificaciones.model');
const db = require('../data/config');
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

// ---------- Notificaciones del Centro ----------
module.exports.enviarNotificaciones = async function(req, res) {
  try {
    const { mensaje, tipo = 'aviso', campania_id = null, filtros = {} } = req.body || {};
    if (!mensaje || String(mensaje).trim() === '') return res.status(400).json({ error: 'Mensaje requerido' });
    const lista = await Donante.filtrar({
      provincia: filtros.provincia || undefined,
      localidad: filtros.localidad || undefined,
      barrio: filtros.barrio || undefined,
      grupo: filtros.grupo || undefined,
      estado: filtros.estado || undefined,
    });
    if (!Array.isArray(lista) || lista.length === 0) return res.json({ enviados: 0 });
    let enviados = 0;
    for (const d of lista) {
      const uid = d.usuario_id || d.usuario || d.user_id;
      if (!uid) continue;
      try {
        await Notificaciones.createForUsuario(uid, { tipo, mensaje, campania_id });
        enviados++;
      } catch {}
    }
    // Log
    try {
      const centroId = obtenerCentroIdDeRequest(req);
      await db.query(`CREATE TABLE IF NOT EXISTS notificaciones_log (
        id SERIAL PRIMARY KEY,
        centro_id INTEGER,
        tipo TEXT,
        mensaje TEXT NOT NULL,
        enviados INTEGER NOT NULL DEFAULT 0,
        filtros JSONB,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
      );`);
      await db.query(
        `INSERT INTO notificaciones_log(centro_id, tipo, mensaje, enviados, filtros) VALUES($1,$2,$3,$4,$5)`,
        [centroId, tipo, mensaje, enviados, JSON.stringify(filtros || {})]
      );
    } catch (e) { console.error('No se pudo registrar notificaciones_log:', e.message); }

    res.json({ enviados });
  } catch (e) {
    console.error('Error al enviar notificaciones:', e);
    res.status(500).json({ error: 'Error al enviar notificaciones' });
  }
};

module.exports.enviarFelicitacionesCumple = async function(req, res) {
  try {
    const dias = parseInt((req.body && req.body.dias) || '0', 10) || 0;
    // seleccionar donantes cuyo cumpleaños es hoy (+dias)
    const sql = `
      SELECT d.usuario_id, d.fecha_nacimiento, u.nombre
      FROM donantes d JOIN usuarios u ON d.usuario_id = u.id
      WHERE d.fecha_nacimiento IS NOT NULL
    `;
    const { rows } = await db.query(sql);
    const hoy = new Date();
    const objetivo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const candidatos = rows.filter(r => {
      const fn = new Date(r.fecha_nacimiento);
      const esteAnio = new Date(objetivo.getFullYear(), fn.getMonth(), fn.getDate());
      const diff = Math.floor((esteAnio - objetivo) / (1000*60*60*24));
      return diff >= 0 && diff <= dias;
    });
    let enviados = 0;
    for (const c of candidatos) {
      const nombre = c.nombre || 'donante';
      const msg = dias > 0 && new Date(c.fecha_nacimiento).getDate() !== objetivo.getDate()
        ? `Se acerca tu cumpleaños, ${nombre}! Gracias por ser parte.`
        : `¡Feliz cumpleaños, ${nombre}! Gracias por ser parte.`;
      try { await Notificaciones.createForUsuario(c.usuario_id, { tipo: 'cumple', mensaje: msg }); enviados++; } catch {}
    }
    // Log
    try {
      const centroId = obtenerCentroIdDeRequest(req);
      await db.query(`CREATE TABLE IF NOT EXISTS notificaciones_log (
        id SERIAL PRIMARY KEY,
        centro_id INTEGER,
        tipo TEXT,
        mensaje TEXT NOT NULL,
        enviados INTEGER NOT NULL DEFAULT 0,
        filtros JSONB,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
      );`);
      await db.query(
        `INSERT INTO notificaciones_log(centro_id, tipo, mensaje, enviados, filtros) VALUES($1,$2,$3,$4,$5)`,
        [centroId, 'cumple', 'Felicitaciones de cumpleaños', enviados, JSON.stringify({ dias })]
      );
    } catch (e) { console.error('No se pudo registrar notificaciones_log:', e.message); }

    res.json({ candidatos: candidatos.length, enviados });
  } catch (e) {
    console.error('Error en felicitaciones:', e);
    res.status(500).json({ error: 'Error al generar felicitaciones' });
  }
};

// Preview: cantidad de destinatarios por filtros
module.exports.previewNotificaciones = async function(req, res) {
  try {
    const filtros = req.body && req.body.filtros ? req.body.filtros : {};
    const lista = await Donante.filtrar({
      provincia: filtros.provincia || undefined,
      localidad: filtros.localidad || undefined,
      barrio: filtros.barrio || undefined,
      grupo: filtros.grupo || undefined,
      estado: filtros.estado || undefined,
    });
    res.json({ destinatarios: Array.isArray(lista) ? lista.length : 0 });
  } catch (e) {
    console.error('Error en preview notificaciones:', e);
    res.status(500).json({ error: 'Error al previsualizar' });
  }
};

// Preview felicitaciones: cantidad de candidatos
module.exports.previewFelicitaciones = async function(req, res) {
  try {
    const dias = parseInt((req.body && req.body.dias) || '0', 10) || 0;
    const sql = `
      SELECT d.usuario_id, d.fecha_nacimiento
      FROM donantes d
      WHERE d.fecha_nacimiento IS NOT NULL
    `;
    const { rows } = await db.query(sql);
    const hoy = new Date();
    const objetivo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const candidatos = rows.filter(r => {
      const fn = new Date(r.fecha_nacimiento);
      const esteAnio = new Date(objetivo.getFullYear(), fn.getMonth(), fn.getDate());
      const diff = Math.floor((esteAnio - objetivo) / (1000*60*60*24));
      return diff >= 0 && diff <= dias;
    });
    res.json({ candidatos: candidatos.length });
  } catch (e) {
    console.error('Error en preview felicitaciones:', e);
    res.status(500).json({ error: 'Error al previsualizar felicitaciones' });
  }
};

// Listado simple del historial
module.exports.getNotificacionesLog = async function(req, res) {
  try {
    const centroId = obtenerCentroIdDeRequest(req);
    await db.query(`CREATE TABLE IF NOT EXISTS notificaciones_log (
      id SERIAL PRIMARY KEY,
      centro_id INTEGER,
      tipo TEXT,
      mensaje TEXT NOT NULL,
      enviados INTEGER NOT NULL DEFAULT 0,
      filtros JSONB,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );`);
    const { rows } = await db.query(
      `SELECT id, tipo, mensaje, enviados, filtros, created_at
       FROM notificaciones_log
       WHERE ($1::int IS NULL AND centro_id IS NULL) OR centro_id = $1
       ORDER BY id DESC
       LIMIT 30`,
      [centroId || null]
    );
    res.json(rows);
  } catch (e) {
    console.error('Error al obtener notificaciones_log:', e);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

// Notificaciones para el centro (UI campana/bell)
module.exports.getNotificacionesCentro = async function(req, res){
  try{
    const centroId = obtenerCentroIdDeRequest(req);
    if(!centroId) return res.status(400).json({ error: 'centro_id no especificado' });
    const { rows } = await db.query(
      `SELECT id, tipo, mensaje, COALESCE(leida, FALSE) AS leida, created_at
       FROM notificaciones
       WHERE centro_id = $1
       ORDER BY id DESC
       LIMIT 30`,
      [centroId]
    );
    res.json(rows);
  }catch(e){
    console.error('Error al obtener notificaciones del centro:', e);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

module.exports.marcarNotificacionCentroLeida = async function(req, res){
  try{
    const centroId = obtenerCentroIdDeRequest(req);
    if(!centroId) return res.status(400).json({ error: 'centro_id no especificado' });
    const id = parseInt(req.params.id, 10);
    if(!id) return res.status(400).json({ error: 'id inválido' });
    const { rows } = await db.query(
      `UPDATE notificaciones SET leida = TRUE
       WHERE id = $1 AND centro_id = $2
       RETURNING id, tipo, mensaje, leida, created_at`,
      [id, centroId]
    );
    if(!rows[0]) return res.status(404).json({ error: 'No encontrada' });
    res.json(rows[0]);
  }catch(e){
    console.error('Error al marcar notificación leída (centro):', e);
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
};

// Inscripciones de un usuario (para modal en Ver donantes)
module.exports.getInscripcionesUsuario = async function(req, res){
  try{
    const usuarioId = parseInt(req.params.usuarioId, 10);
    if(!usuarioId) return res.status(400).json({ error: 'usuarioId inválido' });
    const lista = await CampaniasModel.listarInscripcionesPorUsuario(usuarioId);
    res.json(Array.isArray(lista) ? lista : []);
  }catch(e){
    console.error('Error al obtener inscripciones por usuario:', e);
    res.status(500).json({ error: 'Error al obtener inscripciones' });
  }
};
