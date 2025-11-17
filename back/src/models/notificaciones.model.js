// =============================
// NOTIFICACIONES DEL CENTRO
// =============================

const Notificaciones = require('../models/notificaciones.model');
const LogCentro = require('../models/centroNotificacionesLog.model');
const Donante = require('../models/donantes.model');

// aca envio notificaciones manuales a una lista de usuarios
module.exports.enviarNotificaciones = async function (req, res) {
  try {
    const centroId = req.user.id;
    const { titulo, mensaje, usuarios } = req.body;

    if (!titulo || !mensaje || !Array.isArray(usuarios)) {
      return res.status(400).json({ error: "faltan datos" });
    }

    // creo notificaciones
    for (const uid of usuarios) {
      await Notificaciones.crear(uid, titulo, mensaje);
    }

    // registro en historial
    await LogCentro.registrar(centroId, titulo, mensaje, usuarios);

    res.json({ ok: true, enviados: usuarios.length });
  } catch (e) {
    console.error("error al enviar notificaciones:", e);
    res.status(500).json({ error: "error interno" });
  }
};

// aca envio felicitaciones de cumple
module.exports.enviarFelicitacionesCumple = async function (req, res) {
  try {
    const centroId = req.user.id;

    const cumpleanieros = await Donante.getCumpleanierosHoy();
    if (cumpleanieros.length === 0) {
      return res.json({ ok: true, mensaje: "no hay cumpleaños hoy" });
    }

    const titulo = "Feliz cumpleaños";
    const mensaje = "Gracias por ser donante y salvar vidas";

    for (const d of cumpleanieros) {
      await Notificaciones.crear(d.usuario_id, titulo, mensaje);
    }

    const ids = cumpleanieros.map(d => d.usuario_id);
    await LogCentro.registrar(centroId, titulo, mensaje, ids);

    res.json({
      ok: true,
      enviados: ids.length
    });
  } catch (e) {
    console.error("error al enviar felicitaciones:", e);
    res.status(500).json({ error: "error interno" });
  }
};

// aca genero el preview
module.exports.previewNotificaciones = async function (req, res) {
  const { titulo, mensaje } = req.body;
  return res.json({
    preview: {
      titulo,
      mensaje
    }
  });
};

module.exports.previewFelicitaciones = async function (req, res) {
  return res.json({
    preview: {
      titulo: "Feliz cumpleaños",
      mensaje: "Gracias por ser donante y salvar vidas"
    }
  });
};

// aca traigo el historial de envios del centro
module.exports.getNotificacionesLog = async function (req, res) {
  try {
    const centroId = req.user.id;
    const lista = await LogCentro.listar(centroId);
    res.json(lista);
  } catch (e) {
    console.error("error al traer historial:", e);
    res.status(500).json({ error: "error interno" });
  }
};

// aca traigo todas las notificaciones que el centro recibio
module.exports.getNotificacionesCentro = async function (req, res) {
  try {
    const centroId = req.user.id;
    const lista = await Notificaciones.getForUsuario(centroId);
    res.json(lista);
  } catch (e) {
    console.error("error al traer notificaciones del centro:", e);
    res.status(500).json({ error: "error interno" });
  }
};

// aca marco notificacion del centro como leida
module.exports.marcarNotificacionCentroLeida = async function (req, res) {
  try {
    const centroId = req.user.id;
    const { id } = req.params;

    const r = await Notificaciones.marcarLeida(id, centroId);
    if (!r) return res.status(404).json({ error: "no encontrada" });

    res.json({ ok: true });
  } catch (e) {
    console.error("error al marcar leida:", e);
    res.status(500).json({ error: "error interno" });
  }
};
