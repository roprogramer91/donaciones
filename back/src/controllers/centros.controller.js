// back/src/controllers/centros.controller.js
// Controlador del panel del centro
// Aca manejo el perfil, resumen y todo lo relacionado a notificaciones

const CentrosModel = require('../models/centros.model');
const DonantesModel = require('../models/donantes.model');
const Notificaciones = require('../models/notificaciones.model');

const MANUAL_DIRECTO_TYPE = "centro_manual_directo";
const MANUAL_FILTRO_TYPE = "centro_manual_filtro";
const MANUAL_FELICITACION_TYPE = "centro_felicitacion";

// ==============================================================
// PERFIL DEL CENTRO
// ==============================================================

module.exports.obtenerMiPerfil = async function (req, res) {
  try {
    const centroId = req.user?.id;
    if (!centroId) return res.status(401).json({ mensaje: 'Token no proporcionado' });

    const perfil = await CentrosModel.obtenerPorUsuarioId(centroId);
    res.json(perfil);
  } catch (e) {
    console.error("Error en obtenerMiPerfil:", e);
    res.status(500).json({ error: 'Error al obtener perfil del centro' });
  }
};

module.exports.actualizarMiPerfil = async function (req, res) {
  try {
    const centroId = req.user?.id;
    if (!centroId) return res.status(401).json({ mensaje: 'Token no proporcionado' });

    const actualizado = await CentrosModel.actualizarPorUsuarioId(centroId, req.body);
    res.json({ mensaje: 'Perfil actualizado', perfil: actualizado });
  } catch (e) {
    console.error("Error en actualizarMiPerfil:", e);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// ==============================================================
// RESUMEN DEL DASHBOARD
// ==============================================================

module.exports.obtenerResumen = async function (req, res) {
  try {
    const centroId = req.user?.id;
    if (!centroId) return res.status(401).json({ mensaje: 'Token no proporcionado' });

    const resumen = await CentrosModel.obtenerResumen(centroId);
    res.json(resumen);
  } catch (e) {
    console.error("Error en obtenerResumen:", e);
    res.status(500).json({ error: 'Error al obtener el resumen del centro' });
  }
};

// ==============================================================
// NOTIFICACIONES MANUALES
// ==============================================================
//
// Aca envio notificaciones manuales segun:
// 1) IDs de usuarios (envio directo)
// 2) Filtros enviados desde el panel
//

module.exports.enviarNotificaciones = async function (req, res) {
  try {
    const centroId = req.user?.id;
    if (!centroId) return res.status(401).json({ mensaje: "Token no proporcionado" });

    const { mensaje, usuarios, filtros } = req.body;
    if (!mensaje || !mensaje.trim()) {
      return res.status(400).json({ error: "Debe especificar un mensaje" });
    }

    // Envo directo a usuarios seleccionados
    if (Array.isArray(usuarios) && usuarios.length > 0) {
      const donantes = await DonantesModel.obtenerPorUsuariosIds(usuarios);
      const ids = donantes.map((d) => d.id);
      if (!ids.length) {
        return res.status(400).json({ error: "No se encontraron donantes con esos usuarios_id" });
      }

      const creadas = await Notificaciones.crearBatch(ids, MANUAL_DIRECTO_TYPE, mensaje, {
        meta: { origen: "manual_directo", usuarios },
      });

      await Notificaciones.registrarLog(centroId, MANUAL_DIRECTO_TYPE, mensaje, creadas.length, {
        usuarios,
      });

      return res.json({ ok: true, enviados: creadas.length });
    }

    // Envo por filtros
    const donantes = await DonantesModel.filtrar(filtros);
    const ids = donantes.map((d) => d.id);
    if (!ids.length) {
      return res.status(400).json({ error: "No se encontraron donantes para enviar notificacin" });
    }

    const creadas = await Notificaciones.crearBatch(ids, MANUAL_FILTRO_TYPE, mensaje, {
      meta: { origen: "manual_filtro", filtros },
    });

    await Notificaciones.registrarLog(centroId, MANUAL_FILTRO_TYPE, mensaje, creadas.length, {
      filtros,
    });

    res.json({ ok: true, enviados: creadas.length });
  } catch (error) {
    console.error("Error en enviarNotificaciones:", error);
    res.status(500).json({ error: "Error al enviar notificaciones" });
  }
};

// ==============// ==============================================================
// PREVIEW DE NOTIFICACIONES
// ==============================================================

module.exports.previewNotificaciones = async function (req, res) {
  try {
    const { filtros } = req.body;
    const donantes = await DonantesModel.filtrar(filtros);

    res.json({
      cantidad: donantes.length,
      filtros
    });
  } catch (e) {
    console.error("Error en previewNotificaciones:", e);
    res.status(500).json({ error: "Error en el preview" });
  }
};

// ==============================================================
// FELICITACIONES DE CUMPLEAÑOS
// ==============================================================

module.exports.enviarFelicitacionesCumple = async function (req, res) {
  try {
    const centroId = req.user?.id;
    if (!centroId) return res.status(401).json({ mensaje: 'Token no proporcionado' });

    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const dia = hoy.getDate();

    const cumpleanieros = await DonantesModel.buscarCumpleanios(mes, dia);
    const ids = cumpleanieros.map(d => d.id);

    if (ids.length === 0) {
      return res.json({ mensaje: "No hay donantes que cumplan hoy" });
    }

    const mensaje = "Feliz cumple! Gracias por seguir formando parte de nuestra red de donacion.";

    const creadas = await Notificaciones.crearBatch(ids, MANUAL_FELICITACION_TYPE, mensaje, { meta: { origen: 'felicitacion', fecha: { dia, mes } } });

    await Notificaciones.registrarLog(
      centroId,
      "cumpleanios",
      mensaje,
      creadas.length,
      { dia, mes }
    );

    res.json({ ok: true, enviados: creadas.length });

  } catch (e) {
    console.error("Error en enviarFelicitacionesCumple:", e);
    res.status(500).json({ error: "Error al enviar felicitaciones" });
  }
};

module.exports.previewFelicitaciones = async function (req, res) {
  try {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const dia = hoy.getDate();

    const cumpleanieros = await DonantesModel.buscarCumpleanios(mes, dia);

    res.json({
      cantidad: cumpleanieros.length,
      mes,
      dia
    });

  } catch (e) {
    console.error("Error en previewFelicitaciones:", e);
    res.status(500).json({ error: "Error en el preview de felicitaciones" });
  }
};

// ==============================================================
// LOGS DE NOTIFICACIONES
// ==============================================================

module.exports.getNotificacionesCentro = async function (req, res) {
  try {
    const centroId = req.user?.id;
    if (!centroId) return res.status(401).json({ mensaje: 'Token no proporcionado' });

    const log = await Notificaciones.getLogCentro(centroId);
    res.json(log);
  } catch (e) {
    console.error("Error en getNotificacionesCentro:", e);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
};

module.exports.getNotificacionesLog = async function (req, res) {
  try {
    const centroId = req.user?.id;
    if (!centroId) return res.status(401).json({ mensaje: 'Token no proporcionado' });

    const log = await Notificaciones.getLogCentro(centroId);
    res.json(log);
  } catch (e) {
    console.error("Error en getNotificacionesLog:", e);
    res.status(500).json({ error: "Error al obtener historial" });
  }
};

// ==============================================================
// MARCAR COMO LEIDA (placeholder)
// ==============================================================

module.exports.marcarNotificacionCentroLeida = async function (req, res) {
  try {
    const centroId = req.user?.id;
    if (!centroId) return res.status(401).json({ mensaje: 'Token no proporcionado' });

    const logId = parseInt(req.params.id, 10);
    if (!logId) return res.status(400).json({ error: 'ID invalido' });

    const actualizado = await Notificaciones.marcarLogCentroLeido(logId, centroId);
    if (!actualizado) return res.status(404).json({ error: 'Notificacion no encontrada' });

    res.json({ ok: true, notificacion: actualizado });
  } catch (e) {
    console.error("Error en marcarNotificacionCentroLeida:", e);
    res.status(500).json({ error: "Error al marcar notificacion" });
  }
};




