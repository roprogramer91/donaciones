// En este archivo manejo la logica de campanias
const CampaniasModel = require("../models/campanias.model");
const Notificaciones = require("../models/notificaciones.model"); // Ahora importa el modelo correcto
const NOTIFICATION_TYPES = require("../constants/notificationTypes");

const { DONANTE, CENTRO } = NOTIFICATION_TYPES;

const CampaniasController = {
  async obtenerCampanias(req, res) {
    try {
      const campanias = await CampaniasModel.obtenerTodas();
      const hoy = new Date();
      const mapEstado = (c) => {
        const fi = c.fecha_inicio ? new Date(c.fecha_inicio) : null;
        const ff = c.fecha_fin ? new Date(c.fecha_fin) : null;
        if (fi && ff) {
          if (fi <= hoy && hoy <= ff) return "activa";
          if (ff < hoy) return "finalizada";
          if (fi > hoy) return "futura";
        } else if (fi && !ff) {
          return fi <= hoy ? "activa" : "futura";
        } else if (!fi && ff) {
          return hoy <= ff ? "activa" : "finalizada";
        }
        const est = (c.estado || "").toLowerCase();
        if (est.includes("cancel")) return "cancelada";
        if (est.includes("final")) return "finalizada";
        if (est.includes("act")) return "activa";
        if (est.includes("fut")) return "futura";
        return "desconocido";
      };
      const resp = campanias.map((c) => ({
        ...c,
        estado_calculado: mapEstado(c),
      }));
      res.json(resp);
    } catch (error) {
      console.error("Error al obtener campañas:", error);
      res.status(500).json({ error: "Error al obtener campañas" });
    }
  },

  async obtenerCampaniaPorId(req, res) {
    try {
      const { id } = req.params;
      const campania = await CampaniasModel.obtenerPorId(id);
      if (!campania)
        return res.status(404).json({ error: "Campaña no encontrada" });
      const hoy = new Date();
      const fi = campania.fecha_inicio ? new Date(campania.fecha_inicio) : null;
      const ff = campania.fecha_fin ? new Date(campania.fecha_fin) : null;
      let estado_calculado = "desconocido";
      if (fi && ff) {
        if (fi <= hoy && hoy <= ff) estado_calculado = "activa";
        else if (ff < hoy) estado_calculado = "finalizada";
        else if (fi > hoy) estado_calculado = "futura";
      } else if (fi && !ff) {
        estado_calculado = fi <= hoy ? "activa" : "futura";
      } else if (!fi && ff) {
        estado_calculado = hoy <= ff ? "activa" : "finalizada";
      } else {
        const est = (campania.estado || "").toLowerCase();
        if (est.includes("cancel")) estado_calculado = "cancelada";
        else if (est.includes("final")) estado_calculado = "finalizada";
        else if (est.includes("act")) estado_calculado = "activa";
        else if (est.includes("fut")) estado_calculado = "futura";
      }
      res.json({ ...campania, estado_calculado });
    } catch (error) {
      console.error("Error al obtener campaña por ID:", error);
      res.status(500).json({ error: "Error al obtener campaña" });
    }
  },

  async crearCampania(req, res) {
    try {
      const {
        descripcion,
        imagen_url,
        localidad_id,
        barrio_id,
        fecha_inicio,
        fecha_fin,
      } = req.body || {};

      const nombre = req.body?.nombre;
      const centroTokenId = req.user?.id;
      const tipoUsuario = req.user?.tipo_usuario;
      const centroId =
        tipoUsuario === "centro" ? centroTokenId : req.body?.centro_id;

      if (
        !centroId ||
        !nombre ||
        !descripcion ||
        !localidad_id ||
        !barrio_id ||
        !fecha_inicio ||
        !fecha_fin
      ) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const nueva = await CampaniasModel.crear({
        centro_id: centroId,
        nombre,
        descripcion,
        imagen_url,
        localidad_id,
        barrio_id,
        fecha_inicio,
        fecha_fin,
      });
      // Aqui disparo las notificaciones a los donantes de la localidad
      try {
        await Notificaciones.createForDonantesByLocalidad(nueva.localidad_id, {
          tipo: "campania_nueva",
          mensaje: `Nueva campaña: ${nueva.nombre}`,
          campania_id: nueva.id,
        });
      } catch (e) {
        console.error(
          "No se pudieron generar notificaciones para donantes:",
          e.message
        );
      }
      res.status(201).json(nueva);
    } catch (error) {
      console.error("Error al crear campaña:", error);
      res.status(500).json({ error: "Error al crear campaña" });
    }
  },

  async actualizarCampania(req, res) {
    try {
      const { id } = req.params;
      const payload = { ...req.body };
      if (req.user?.tipo_usuario === "centro") {
        payload.centro_id = req.user.id;
      }
      const actualizada = await CampaniasModel.actualizar(id, payload);
      res.json(actualizada);
    } catch (error) {
      console.error("Error al actualizar campaña:", error);
      res.status(500).json({ error: "Error al actualizar campaña" });
    }
  },

  async eliminarCampania(req, res) {
    try {
      const { id } = req.params;
      const eliminada = await CampaniasModel.eliminar(id);
      res.json(eliminada);
    } catch (error) {
      console.error("Error al eliminar campaña:", error);
      res.status(500).json({ error: "Error al eliminar campaña" });
    }
  },

  async obtenerInscriptos(req, res) {
    try {
      const { id } = req.params;
      const inscriptos = await CampaniasModel.listarInscriptosDeCampania(id);
      res.json(inscriptos);
    } catch (error) {
      console.error("Error al listar inscriptos de campaña:", error);
      res.status(500).json({ error: "Error al listar inscriptos" });
    }
  },

  async obtenerInscripcionesPorUsuario(req, res) {
    try {
      const { usuarioId } = req.params;
      const id = parseInt(usuarioId, 10);
      if (!id) {
        return res.status(400).json({ error: "usuario_id invalido" });
      }

      const lista = await CampaniasModel.listarInscripcionesPorUsuario(id);
      res.json(lista);
    } catch (error) {
      console.error("Error al listar inscripciones por usuario:", error);
      res.status(500).json({ error: "Error al listar inscripciones" });
    }
  },
};

module.exports = CampaniasController;
async function notificarCampaniaCreada(campania) {
  if (!campania?.localidad_id) return;
  try {
    await Notificaciones.createForDonantesByLocalidad(campania.localidad_id, {
      tipo: DONANTE.CAMPANIA_NUEVA,
      mensaje: `Nueva campa�a en tu zona: ${campania.nombre}`,
      campania_id: campania.id,
      meta: { campania: buildCampaniaMeta(campania) },
      prioridad: false,
    });
  } catch (error) {
    console.error("No se pudieron generar notificaciones para campa�a nueva:", error);
  }
}

async function notificarCampaniaActualizada(anterior, actual) {
  const cambios = detectarCambiosCampania(anterior, actual);
  const estadoAnterior = (anterior?.estado || "").toLowerCase();
  const estadoActual = (actual?.estado || "").toLowerCase();
  const estadoCambio = estadoAnterior !== estadoActual;
  const cancelada = estadoActual === "cancelada";

  if (!cambios.length && !estadoCambio) return;

  const destinatarios = await CampaniasModel.listarUsuariosInscriptosIds(actual.id);
  if (destinatarios.length) {
    const tipo = cancelada ? DONANTE.CAMPANIA_CANCELADA : DONANTE.CAMPANIA_ACTUALIZADA;
    const mensaje = cancelada
      ? `La campa�a "${actual.nombre}" fue cancelada.`
      : `Actualizamos ${cambios.join(", ")} de la campa�a "${actual.nombre}".`;

    await Notificaciones.crearBatch(destinatarios, tipo, mensaje, {
      campania_id: actual.id,
      meta: { campania: buildCampaniaMeta(actual), cambios, estado: actual.estado },
      prioridad: cancelada,
    });
  }

  if (cancelada) {
    await notificarCentroCampania(actual, CENTRO.CAMPANIA_ACTUALIZADA, `La campa�a "${actual.nombre}" fue cancelada.`, {
      cambios,
      estado: actual.estado,
    });
  } else if (cambios.length || estadoCambio) {
    await notificarCentroCampania(actual, CENTRO.CAMPANIA_ACTUALIZADA, `Se actualizaron ${cambios.join(", ")} en "${actual.nombre}".`, {
      cambios,
      estado: actual.estado,
    });
  }
}

async function notificarCampaniaEliminada(campania, destinatarios = []) {
  if (destinatarios.length) {
    await Notificaciones.crearBatch(destinatarios, DONANTE.CAMPANIA_CANCELADA, `La campa�a "${campania.nombre}" fue cancelada.`, {
      campania_id: campania.id,
      meta: { campania: buildCampaniaMeta(campania) },
      prioridad: true,
    });
  }
  await notificarCentroCampania(campania, CENTRO.CAMPANIA_ACTUALIZADA, `La campa�a "${campania.nombre}" fue eliminada.`, {
    estado: campania.estado,
  });
}

async function notificarCentroCampania(campania, tipo, mensaje, extraMeta = {}) {
  const centroUsuarioId = campania?.centro_usuario_id;
  if (!centroUsuarioId) return;
  try {
    await Notificaciones.crear(centroUsuarioId, {
      tipo,
      mensaje,
      campania_id: campania.id,
      meta: { campania: buildCampaniaMeta(campania), ...extraMeta },
      prioridad: true,
    });
  } catch (error) {
    console.error("Error notificando al centro:", error);
  }
}

function detectarCambiosCampania(anterior, actual) {
  const campos = [];
  if (!mismoValor(anterior?.fecha_inicio, actual?.fecha_inicio)) campos.push("fecha de inicio");
  if (!mismoValor(anterior?.fecha_fin, actual?.fecha_fin)) campos.push("fecha de fin");
  if (!mismoValor(anterior?.localidad_id, actual?.localidad_id)) campos.push("localidad");
  if (!mismoValor(anterior?.barrio_id, actual?.barrio_id)) campos.push("barrio");
  return campos;
}

function mismoValor(a, b) {
  const va = a === null || a === undefined ? null : String(a);
  const vb = b === null || b === undefined ? null : String(b);
  return va === vb;
}

function buildCampaniaMeta(campania) {
  return {
    id: campania?.id,
    nombre: campania?.nombre,
    fecha_inicio: campania?.fecha_inicio,
    fecha_fin: campania?.fecha_fin,
    localidad: campania?.localidad_nombre,
  };
}




