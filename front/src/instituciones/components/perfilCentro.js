// ============================================================
// COMPONENTE: PERFIL DEL CENTRO DE HEMOTERAPIA
// Permite visualizar y editar los datos del centro:
// nombre, dirección, teléfono y correo electrónico.
// ============================================================

import { API_BASE_URL } from "../../utils/config.js";
import {
  authHeaders,
  getCentroId,
  mostrarMensaje,
} from "../dashboard-centro.js";

// ============================================================
// ELEMENTOS BASE
// ============================================================

const btnPerfil = document.getElementById("btn-perfil");
const modalPerfil = document.getElementById("modal-perfil");
const cerrarModalPerfil = document.getElementById("cerrarModalPerfil");
const formPerfil = document.getElementById("form-perfil");
const bienvenida = document.getElementById("bienvenida-centro");

// ============================================================
// INICIALIZACIÓN DEL MÓDULO
// ============================================================

export function inicializarPerfilCentro() {
  if (!btnPerfil) return;

  // Abrir modal de perfil
  btnPerfil.addEventListener("click", async () => {
    modalPerfil.style.display = "flex";
    await cargarPerfilCentro();
  });

  // Cerrar modal
  cerrarModalPerfil?.addEventListener("click", () => {
    modalPerfil.style.display = "none";
  });

  // Envío del formulario
  formPerfil?.addEventListener("submit", guardarPerfilCentro);
}

// ============================================================
// CARGAR DATOS DEL PERFIL
// ============================================================

async function cargarPerfilCentro() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/me`, {
      headers: authHeaders({ "X-Centro-Id": getCentroId() }),
    });

    if (!res.ok) throw new Error("No se pudo cargar el perfil");

    const data = await res.json();
    document.getElementById("perfil_nombre").value = data.nombre || "";
    document.getElementById("perfil_direccion").value = data.direccion || "";
    document.getElementById("perfil_telefono").value = data.telefono || "";
    document.getElementById("perfil_email").value = data.email || "";
  } catch (e) {
    appLogger.error("Error al cargar perfil:", e);
    mostrarMensaje("Error al cargar el perfil del centro", "error");
  }
}

// ============================================================
// GUARDAR DATOS DEL PERFIL
// ============================================================

async function guardarPerfilCentro(e) {
  e.preventDefault();

  const payload = {
    nombre: document.getElementById("perfil_nombre").value.trim(),
    direccion: document.getElementById("perfil_direccion").value.trim(),
    telefono: document.getElementById("perfil_telefono").value.trim(),
    email: document.getElementById("perfil_email").value.trim(),
  };

  // Validación básica
  if (!payload.nombre) {
    mostrarMensaje("El nombre es obligatorio", "error");
    return;
  }

  if (payload.email && !validarEmail(payload.email)) {
    mostrarMensaje("El correo electrónico no es válido", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/me`, {
      method: "PUT",
      headers: authHeaders({
        "Content-Type": "application/json",
        "X-Centro-Id": getCentroId(),
      }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Error al guardar los datos");

    const actualizado = await res.json();
    const nombreCentro = actualizado.nombre || "Centro de Hemoterapia";
    if (bienvenida) bienvenida.textContent = `Bienvenido, ${nombreCentro}!`;

    mostrarMensaje("Perfil actualizado correctamente", "success");
    modalPerfil.style.display = "none";
  } catch (e) {
    appLogger.error(e);
    mostrarMensaje("Error al guardar el perfil", "error");
  }
}

// ============================================================
// UTILIDADES
// ============================================================

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
import { appLogger } from "../../utils/logger.js";
