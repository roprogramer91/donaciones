import { API_BASE_URL } from "../config.js";

const token = localStorage.getItem("token");
if (!token) window.location.href = "../../index.html";

// Referencias
const form = document.getElementById("perfil-form");
const mensaje = document.getElementById("perfil-mensaje");
const logoutBtn = document.getElementById("logoutBtn");
const btnDashboard = document.getElementById("btn-dashboard");
const btnMostrarBaja = document.getElementById("btnMostrarBaja");
const bajaForm = document.getElementById("bajaForm");
const btnConfirmBaja = document.getElementById("btnConfirmBaja");
const btnCancelarBaja = document.getElementById("btnCancelarBaja");
const bajaMensaje = document.getElementById("bajaMensaje");

// 1. Cargar datos
async function cargarPerfil() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/perfil`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error("No se pudo traer el perfil");
    const perfil = await res.json();
    // Llenar campos
    form.nombre.value = perfil.nombre || "";
    form.apellido.value = perfil.apellido || "";
    form.dni.value = perfil.dni || "";
    form.email.value = perfil.email || "";
    form.grupo_sanguineo.value = perfil.grupo_sanguineo || "";
    form.fecha_nacimiento.value = perfil.fecha_nacimiento
      ? perfil.fecha_nacimiento.substr(0, 10)
      : "";
    form.telefono.value = perfil.telefono || "";
    // ...agregá más si sumás provincia/localidad/barrio
  } catch (err) {
    mensaje.textContent = "Error al cargar perfil";
  }
}

// 2. Guardar cambios
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensaje.textContent = "Guardando...";
  const datos = {
    grupo_sanguineo: form.grupo_sanguineo.value,
    fecha_nacimiento: form.fecha_nacimiento.value,
    telefono: form.telefono.value,
    // ...agregá los que sean editables
  };
  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/perfil`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(datos),
    });
    if (!res.ok) throw new Error("Error al guardar cambios");
    mensaje.textContent = "¡Datos actualizados!";
  } catch (err) {
    mensaje.textContent = "Error al guardar cambios";
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../../index.html";
});
btnDashboard.addEventListener("click", () => {
  window.location.href = "dashboard-donante.html";
});

cargarPerfil();

// Zona de baja
btnMostrarBaja?.addEventListener("click", () => {
  bajaForm.style.display = "block";
});

btnCancelarBaja?.addEventListener("click", (e) => {
  e.preventDefault();
  bajaForm.style.display = "none";
  bajaMensaje.textContent = "";
});

btnConfirmBaja?.addEventListener("click", async (e) => {
  e.preventDefault();
  const dni = document.getElementById("dniConfirm")?.value?.trim();
  if (!dni) {
    bajaMensaje.textContent = "Ingresá tu DNI para confirmar.";
    return;
  }

  const seguro = window.confirm(
    "¿Estás seguro de darte de baja? Esta acción es irreversible."
  );
  if (!seguro) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/baja`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ dni }),
    });
    const txt = await res.text();
    if (!res.ok) throw new Error(txt || "No se pudo realizar la baja");
    // Baja exitosa: cerrar sesión y volver al inicio
    localStorage.removeItem("token");
    alert("Baja realizada. Gracias por participar.");
    window.location.href = "../../index.html";
  } catch (err) {
    appLogger.error("Error en baja:", err);
    bajaMensaje.textContent =
      "Error: " + (err.message || "No se pudo realizar la baja");
  }
});
import { appLogger } from "../utils/logger.js";
