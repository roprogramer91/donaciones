// back/src/routes/admin.routes.js

const express = require("express");
const router = express.Router();

const authMiddleware = require("../services/auth/middleware/authMiddleware");
const roleMiddleware = require("../services/auth/middleware/roleMiddleware");

const AdminController = require("../controllers/admin.controller");

// Valido mínimos para creación de centro
function validarCentroRequeridos(req, res, next) {
  const { nombre, email, password } = req.body || {};
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Nombre, email y password son obligatorios" });
  }
  next();
}

// Middleware: solo admin técnico
const soloAdmin = [authMiddleware, roleMiddleware(["admin"])];

// =====================================================
// USUARIOS
// =====================================================
router.get("/usuarios", soloAdmin, AdminController.obtenerUsuarios);
router.get("/usuarios/:id", soloAdmin, AdminController.obtenerUsuarioPorId);
router.patch("/usuarios/:id/estado", soloAdmin, AdminController.cambiarEstadoUsuario);

// =====================================================
// CENTROS
// =====================================================
router.get("/centros", soloAdmin, AdminController.obtenerCentros);
router.get("/centros/:id", soloAdmin, AdminController.obtenerCentroPorId);
router.post("/centros", soloAdmin, validarCentroRequeridos, AdminController.crearCentro);
router.put("/centros/:id", soloAdmin, AdminController.actualizarCentro);
router.delete("/centros/:id", soloAdmin, AdminController.eliminarCentro);

// =====================================================
// ADMIN TÉCNICOS
// =====================================================
router.post("/admins", soloAdmin, AdminController.crearAdminTecnico);

// =====================================================
// ESTADÍSTICAS
// =====================================================
router.get("/stats", soloAdmin, AdminController.estadisticasGenerales);

// =====================================================
// AUDITORÍA
// =====================================================
router.get("/logs", soloAdmin, AdminController.obtenerLogs);

module.exports = router;
