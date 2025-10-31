// ============================================================
// PANEL DE CENTRO DE HEMOTERAPIA
// Archivo principal de inicialización y coordinación de módulos
// ============================================================

// --- Importación de módulos (componentes) ---
import { cargarResumen } from "./components/resumenCentro.js";
import { inicializarDonantes } from "./components/donantes.js";
import { inicializarCampanias } from "./components/campanias.js";
import { inicializarNotificaciones } from "./components/notificaciones.js";
import { inicializarPerfilCentro } from "./components/perfilCentro.js";
import { inicializarModalInscripciones } from "./components/modalInscripciones.js";
import { API_BASE_URL } from "../config.js";

// ============================================================
// INICIALIZACIÓN GLOBAL DEL DASHBOARD
// ============================================================

const loader = document.getElementById("loader-centro");
const contenido = document.getElementById("contenido-centro");
const bienvenida = document.getElementById("bienvenida-centro");
const logoutBtn = document.getElementById("logoutBtn");

// --- Mostrar loader inicial y cargar módulos ---
setTimeout(async () => {
  const centroNombre =
    localStorage.getItem("centroNombre") || "Centro de Hemoterapia";
  bienvenida.textContent = `Bienvenido, ${centroNombre}!`;

  loader.style.display = "none";
  contenido.style.display = "block";

  // Inicializar componentes principales del panel
  await cargarResumen();
  inicializarPerfilCentro();
  inicializarDonantes();
  inicializarCampanias();
  inicializarNotificaciones();
  inicializarModalInscripciones();
}, 800);

// ============================================================
// LOGOUT GLOBAL
// ============================================================
logoutBtn?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "../../index.html";
});

// ============================================================
// FUNCIONES COMUNES Y UTILIDADES GLOBALES
// ============================================================

// --- Token y encabezados para autenticación ---
export const token = localStorage.getItem("token");

export function authHeaders(extra = {}) {
  const headers = { ...extra };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// --- Obtener ID del centro de hemoterapia actual ---
export function getCentroId() {
  const keys = ["centro_id", "centroId", "userCentroId"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && !isNaN(parseInt(v))) return parseInt(v);
  }
  return 1; // Fallback temporal hasta tener login con persistencia
}

// --- Control de secciones visibles (donantes / campañas / notifs) ---
let currentSection = null;

/**
 * Cambia la visibilidad de las secciones principales del panel.
 * @param {string} seccion - Nombre de la sección a mostrar ('donantes', 'campanias', 'notifs')
 * @returns {boolean} true si la sección queda visible, false si se oculta
 */
export function toggleSeccion(seccion) {
  const secciones = ["donantes", "campanias", "notifs"];
  secciones.forEach((id) => {
    const el = document.getElementById(`seccion-${id}`);
    if (el) el.style.display = "none";
  });

  if (currentSection === seccion) {
    currentSection = null;
    return false;
  }

  const target = document.getElementById(`seccion-${seccion}`);
  if (target) target.style.display = "block";
  currentSection = seccion;
  return true;
}

// ============================================================
// UTILIDADES EXTRA (opcional, si las usan los módulos)
// ============================================================

/**
 * Formatea fechas a formato legible (DD/MM/YYYY).
 * @param {string|Date} fecha
 */
export function formatearFecha(fecha) {
  if (!fecha) return "--/--/----";
  try {
    const d = new Date(fecha);
    return `${d.getDate().toString().padStart(2, "0")}/${(
      d.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return "--/--/----";
  }
}

/**
 * Muestra un mensaje temporal en pantalla.
 * @param {string} texto
 * @param {"success"|"error"|"info"} tipo
 */
export function mostrarMensaje(texto, tipo = "info") {
  const colores = {
    success: "#16a34a",
    error: "#dc2626",
    info: "#2563eb",
  };
  const box = document.createElement("div");
  box.textContent = texto;
  box.style.position = "fixed";
  box.style.bottom = "20px";
  box.style.right = "20px";
  box.style.background = colores[tipo] || "#2563eb";
  box.style.color = "#fff";
  box.style.padding = "10px 16px";
  box.style.borderRadius = "8px";
  box.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  box.style.zIndex = 9999;
  box.style.fontSize = "0.9rem";
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4000);
}
