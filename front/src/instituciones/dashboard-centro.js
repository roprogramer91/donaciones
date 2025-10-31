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
import { inicializarModalInscripciones } from "./components/modales/modalInscripciones.js";
import { API_BASE_URL } from "../config.js";

// ============================================================
// INICIALIZACIÓN GLOBAL DEL DASHBOARD
// ============================================================

// Elementos base del DOM
const loader = document.getElementById("loader-centro");
const contenido = document.getElementById("contenido-centro");
const bienvenida = document.getElementById("bienvenida-centro");
const logoutBtn = document.getElementById("logoutBtn");

// ============================================================
// ARRANQUE INICIAL
// ============================================================

/**
 * Muestra el loader, prepara el entorno y carga los módulos del panel.
 */
async function iniciarDashboardCentro() {
  try {
    // 1️⃣ Mostrar loader
    loader.classList.remove("oculto");
    contenido.classList.add("oculto");

    // 2️⃣ Mensaje de bienvenida
    const centroNombre =
      localStorage.getItem("centroNombre") || "Centro de Hemoterapia";
    bienvenida.textContent = `Bienvenido, ${centroNombre}!`;

    // 3️⃣ Espera visual de carga (simulación)
    await new Promise((res) => setTimeout(res, 800));

    // 4️⃣ Ocultar loader y mostrar panel
    loader.classList.add("oculto");
    contenido.classList.remove("oculto");

    // 5️⃣ Inicializar módulos principales
    await cargarResumen();
    inicializarPerfilCentro();
    inicializarDonantes();
    inicializarCampanias();
    inicializarNotificaciones();
    inicializarModalInscripciones();

    console.log("✅ Dashboard del centro cargado correctamente");
  } catch (err) {
    console.error("❌ Error inicializando dashboard:", err);
    mostrarMensaje("Error al cargar el panel.", "error");
  }
}

// Ejecutar al cargar
iniciarDashboardCentro();

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
  return 1; // fallback temporal
}

// ============================================================
// CONTROL DE SECCIONES VISIBLES (donantes / campañas / notifs)
// ============================================================

let currentSection = null;

/**
 * Cambia la visibilidad de las secciones principales del panel.
 * @param {string} seccion - Nombre de la sección a mostrar ('donantes', 'campanias', 'notifs')
 * @returns {boolean} true si la sección queda visible, false si se oculta
 */
export function toggleSeccion(seccion) {
  const secciones = ["donantes", "campanias", "notifs"];

  // Ocultar todas
  secciones.forEach((id) => {
    const el = document.getElementById(`seccion-${id}`);
    if (el) el.classList.add("oculto");
  });

  // Si clickean el mismo botón, cerramos la sección
  if (currentSection === seccion) {
    currentSection = null;
    return false;
  }

  // Mostrar la nueva
  const target = document.getElementById(`seccion-${seccion}`);
  if (target) target.classList.remove("oculto");

  currentSection = seccion;
  return true;
}

// ============================================================
// UTILIDADES EXTRA
// ============================================================

/**
 * Formatea fechas a formato legible (DD/MM/YYYY)
 */
export function formatearFecha(fecha) {
  if (!fecha) return "--/--/----";
  try {
    const d = new Date(fecha);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return "--/--/----";
  }
}

/**
 * Muestra un mensaje temporal en pantalla
 */
export function mostrarMensaje(texto, tipo = "info") {
  const colores = {
    success: "#16a34a",
    error: "#dc2626",
    info: "#2563eb",
  };

  const box = document.createElement("div");
  box.textContent = texto;
  box.classList.add("mensaje-temporal");
  Object.assign(box.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: colores[tipo] || "#2563eb",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    zIndex: 9999,
    fontSize: "0.9rem",
  });

  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4000);
}
