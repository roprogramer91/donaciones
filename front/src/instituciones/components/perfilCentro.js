// ============================================================
// COMPONENTE: PERFIL DEL CENTRO DE HEMOTERAPIA
// Permite visualizar y editar los datos del centro.
// ============================================================

import { API_BASE_URL } from "../../utils/config.js";
import { mostrarPopup } from "./popup.js";
import { appLogger } from "../../utils/logger.js";

const btnPerfil = document.getElementById("btn-perfil");
const modalPerfil = document.getElementById("modal-perfil");
const cerrarModalPerfil = document.getElementById("cerrarModalPerfil");
const cancelarModalPerfil = document.getElementById("cancelarModalPerfil");
const formPerfil = document.getElementById("form-perfil");
const bienvenida = document.getElementById("bienvenida-centro");

export function inicializarPerfilCentro() {
  if (!btnPerfil || !modalPerfil || !formPerfil) return;

  btnPerfil.addEventListener("click", async () => {
    modalPerfil.style.display = "flex";
    await cargarPerfilCentro();
  });

  const cerrar = () => {
    modalPerfil.style.display = "none";
  };

  cerrarModalPerfil?.addEventListener("click", cerrar);
  cancelarModalPerfil?.addEventListener("click", cerrar);
  modalPerfil.addEventListener("click", (e) => {
    if (e.target === modalPerfil) cerrar();
  });

  formPerfil.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ok = await guardarPerfilCentro();
    if (ok) cerrar();
  });
}

async function cargarPerfilCentro() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/me`, {
      headers: buildHeaders(),
    });
    if (!res.ok) throw new Error("No se pudo cargar el perfil");
    const data = await res.json();
    formPerfil.querySelector("#perfil_nombre").value = data.nombre || "";
    formPerfil.querySelector("#perfil_direccion").value = data.direccion || "";
    formPerfil.querySelector("#perfil_telefono").value = data.telefono || "";
    formPerfil.querySelector("#perfil_email").value = data.email || "";
  } catch (error) {
    appLogger.error("Error al cargar perfil:", error);
    mostrarPopup("Error al cargar el perfil del centro", "error");
  }
}

async function guardarPerfilCentro() {
  const payload = {
    nombre: formPerfil.querySelector("#perfil_nombre").value.trim(),
    direccion: formPerfil.querySelector("#perfil_direccion").value.trim(),
    telefono: formPerfil.querySelector("#perfil_telefono").value.trim(),
    email: formPerfil.querySelector("#perfil_email").value.trim(),
  };

  if (!payload.nombre) {
    mostrarPopup("El nombre es obligatorio", "error");
    return false;
  }

  if (payload.email && !validarEmail(payload.email)) {
    mostrarPopup("El correo electrónico no es válido", "error");
    return false;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/me`, {
      method: "PUT",
      headers: buildHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Error al guardar los datos");

    const actualizado = await res.json();
    const nombreCentro = actualizado.nombre || "Centro de Hemoterapia";
    if (bienvenida) bienvenida.textContent = `Bienvenido, ${nombreCentro}!`;
    mostrarPopup("Perfil actualizado correctamente", "success");
    return true;
  } catch (error) {
    appLogger.error("Error al guardar perfil:", error);
    mostrarPopup("Error al guardar el perfil", "error");
    return false;
  }
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function buildHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
