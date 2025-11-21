// back/src/controllers/admin.controller.js

const bcrypt = require("bcrypt");
const AdminModel = require("../models/admin.model");

// =====================================================
// USUARIOS
// =====================================================

// GET /admin/usuarios
async function obtenerUsuarios(req, res) {
  try {
    const usuarios = await AdminModel.obtenerUsuarios();
    return res.json(usuarios);
  } catch (e) {
    console.error("Error en obtenerUsuarios:", e);
    return res.status(500).json({ error: "Error al obtener usuarios" });
  }
}

// GET /admin/usuarios/:id
async function obtenerUsuarioPorId(req, res) {
  try {
    const { id } = req.params;
    const usuario = await AdminModel.obtenerUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json(usuario);
  } catch (e) {
    console.error("Error en obtenerUsuarioPorId:", e);
    return res.status(500).json({ error: "Error al obtener usuario" });
  }
}

// PATCH /admin/usuarios/:id/estado
async function cambiarEstadoUsuario(req, res) {
  try {
    const { id } = req.params;
    const { activo } = req.body; // true | false

    const result = await AdminModel.cambiarEstadoUsuario(id, activo);

    return res.json({
      mensaje: "Estado actualizado correctamente",
      usuario: result,
    });
  } catch (e) {
    console.error("Error en cambiarEstadoUsuario:", e);
    return res.status(500).json({ error: "Error al cambiar estado del usuario" });
  }
}

// POST /admin/centros
async function crearCentro(req, res) {
  try {
    const {
      nombre,
      direccion,
      telefono,
      email,
      password,
      provincia_id,
      localidad_id,
      barrio_id,
    } = req.body;

    if (!nombre || !email || !password) {
      return res
        .status(400)
        .json({ error: "Nombre, email y password son obligatorios" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const nuevoCentro = await AdminModel.crearCentro({
      nombre,
      direccion,
      telefono,
      email,
      password_hash,
      provincia_id,
      localidad_id,
      barrio_id,
    });

    return res.status(201).json({
      mensaje: "Centro creado correctamente",
      centro: nuevoCentro,
    });
  } catch (e) {
    console.error("Error en crearCentro:", e);
    return res.status(500).json({ error: "Error al crear centro" });
  }
}

// POST /admin/admins
async function crearAdminTecnico(req, res) {
  try {
    const { nombre, email, password_hash } = req.body;

    const nuevoAdmin = await AdminModel.crearAdminTecnico({
      nombre,
      email,
      password_hash,
    });

    return res.status(201).json({
      mensaje: "Administrador técnico creado correctamente",
      admin: nuevoAdmin,
    });

  } catch (e) {
    console.error("Error en crearAdminTecnico:", e);
    return res.status(500).json({ error: "Error al crear admin técnico" });
  }
}



// =====================================================
// CENTROS
// =====================================================

// GET /admin/centros
async function obtenerCentros(req, res) {
  try {
    const centros = await AdminModel.obtenerCentros();
    return res.json(centros);
  } catch (e) {
    console.error("Error en obtenerCentros:", e);
    return res.status(500).json({ error: "Error al obtener centros" });
  }
}

// GET /admin/centros/:id
async function obtenerCentroPorId(req, res) {
  try {
    const { id } = req.params;
    const centro = await AdminModel.obtenerCentroPorId(id);

    if (!centro) {
      return res.status(404).json({ error: "Centro no encontrado" });
    }

    return res.json(centro);
  } catch (e) {
    console.error("Error en obtenerCentroPorId:", e);
    return res.status(500).json({ error: "Error al obtener centro" });
  }
}

// PUT /admin/centros/:id
async function actualizarCentro(req, res) {
  try {
    const { id } = req.params;

    const centroActualizado = await AdminModel.actualizarCentro(id, req.body);

    return res.json({
      mensaje: "Centro actualizado correctamente",
      centro: centroActualizado,
    });
  } catch (e) {
    console.error("Error en actualizarCentro:", e);
    return res.status(500).json({ error: "Error al actualizar centro" });
  }
}

// DELETE /admin/centros/:id
async function eliminarCentro(req, res) {
  try {
    const { id } = req.params;

    const resultado = await AdminModel.eliminarCentro(id);

    return res.json({
      mensaje: resultado.mensaje,
    });
  } catch (e) {
    console.error("Error en eliminarCentro:", e);
    return res.status(500).json({ error: "Error al eliminar centro" });
  }
}



// =====================================================
// ESTADÍSTICAS
// =====================================================

// GET /admin/stats
async function estadisticasGenerales(req, res) {
  try {
    const stats = await AdminModel.estadisticasGenerales();
    return res.json(stats);
  } catch (e) {
    console.error("Error en estadisticasGenerales:", e);
    return res.status(500).json({ error: "Error al obtener estadísticas" });
  }
}



// =====================================================
// AUDITORÍA
// =====================================================

// GET /admin/logs
async function obtenerLogs(req, res) {
  try {
    const logs = await AdminModel.obtenerLogs();
    return res.json(logs);
  } catch (e) {
    console.error("Error en obtenerLogs:", e);
    return res.status(500).json({ error: "Error al obtener logs" });
  }
}



// =====================================================
// EXPORTAR
// =====================================================

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  cambiarEstadoUsuario,
  crearCentro,
  crearAdminTecnico,
  obtenerCentros,
  obtenerCentroPorId,
  actualizarCentro,
  eliminarCentro,
  estadisticasGenerales,
  obtenerLogs,
};
