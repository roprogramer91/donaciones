/* ==========================================================
   DASHBOARD CENTRO DE HEMOTERAPIA
   Controla:
   - Loader inicial
   - Navegación entre secciones
   - Integración con modales y perfil
   - Integración con gestión de campañas
   - Simulación de cierre de sesión
=========================================================== */

/* === IMPORTACIONES DE MÓDULOS === */
import { appLogger } from "../utils/logger.js";
import { abrirModal, cerrarModal } from "./components/modales/modalBase.js";
import { cargarCampanias } from "./components/campanias.js";
import { cargarResumen } from "./components/resumenCentro.js";
import { mostrarPopup } from "./components/popup.js";
import { inicializarDonantes } from "./components/donantes.js";
import { inicializarNotificaciones } from "./components/notificaciones.js";

/* ==========================================================
   🔁 FUNCIÓN GLOBAL: TOGGLE DE SECCIONES
   Exportada para que otros módulos (como donantes.js) puedan usarla
========================================================== */
export function toggleSeccion(nombre) {
  const secciones = document.querySelectorAll(
    ".dashboard-centro-resumen, #seccion-donantes, #seccion-campanias, #seccion-notifs"
  );

  let visible = false;

  secciones.forEach((sec) => {
    const id = sec.id || sec.classList[0];
    const esActiva =
      id.includes(nombre) ||
      (nombre === "resumen" &&
        sec.classList.contains("dashboard-centro-resumen"));

    if (esActiva) {
      sec.classList.remove("oculto");
      visible = true;
    } else {
      sec.classList.add("oculto");
    }
  });

  return visible;
}

/* === EVENTO PRINCIPAL === */
document.addEventListener("DOMContentLoaded", () => {
  /* === REFERENCIAS A ELEMENTOS CLAVE === */
  const loader = document.getElementById("loader-centro");
  const contenido = document.getElementById("contenido-centro");

  const btnVerDonantes = document.getElementById("btn-ver-donantes");
  const btnVerCampanias = document.getElementById("btn-ver-campanias");
  const btnVerNotifs = document.getElementById("btn-ver-notifs");
  const btnPerfil = document.getElementById("btn-perfil");
  const btnLogout = document.getElementById("logoutBtn");

  const seccionResumen = document.querySelector(".dashboard-centro-resumen");
  const seccionDonantes = document.getElementById("seccion-donantes");
  const seccionCampanias = document.getElementById("seccion-campanias");
  const seccionNotifs = document.getElementById("seccion-notifs");

  /* ==========================================================
     2️⃣ MOSTRAR PANEL Y OCULTAR LOADER
     (Simulación ligera de carga inicial)
  =========================================================== */
  setTimeout(() => {
    if (loader) loader.style.display = "none";
    if (contenido) contenido.classList.remove("oculto");

    // ✅ Cargar el resumen inicial del centro
    cargarResumen();
  }, 800);

  /* ==========================================================
     3️⃣ CAMBIO DE SECCIONES
     Muestra la sección seleccionada y oculta las demás
  =========================================================== */
  const mostrarSeccion = (seccionActiva) => {
    const secciones = [
      seccionResumen,
      seccionDonantes,
      seccionCampanias,
      seccionNotifs,
    ];
    secciones.forEach((sec) => {
      if (sec) sec.classList.toggle("oculto", sec !== seccionActiva);
    });
  };

  /* ==========================================================
     4️⃣ EVENTOS DE NAVEGACIÓN (SIDEBAR)
     Asocia los botones del panel con sus secciones
  =========================================================== */
  const btnVerResumen = document.getElementById("btn-ver-resumen");
  if (btnVerResumen)
    btnVerResumen.addEventListener("click", () => {
      mostrarSeccion(seccionResumen);
      cargarResumen();
    });

  if (btnVerDonantes)
    btnVerDonantes.addEventListener("click", () => {
      mostrarSeccion(seccionDonantes);
    });

  if (btnVerCampanias)
    btnVerCampanias.addEventListener("click", () => {
      mostrarSeccion(seccionCampanias);
      cargarCampanias();
    });

  if (btnVerNotifs)
    btnVerNotifs.addEventListener("click", () => mostrarSeccion(seccionNotifs));

  /* ==========================================================
     5️⃣ PERFIL DEL CENTRO
     Muestra un modal simple con información del centro
  =========================================================== */
  if (btnPerfil)
    btnPerfil.addEventListener("click", () => {
      abrirModal(`
        <h3>Perfil del Centro</h3>
        <p>Próximamente se cargará la información del centro aquí.</p>
        <div class="modal-buttons">
          <button class="btn-secundario" id="btnCerrarModal">Cerrar</button>
        </div>
      `);

      const btnCerrar = document.getElementById("btnCerrarModal");
      if (btnCerrar) btnCerrar.addEventListener("click", cerrarModal);
    });

  /* ==========================================================
     6️⃣ CERRAR SESIÓN
     Borra token y recarga página
  =========================================================== */
  if (btnLogout)
    btnLogout.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "../../index.html"; // vuelve al login principal
    });

  /* ==========================================================
     7️⃣ INICIALIZAR MÓDULOS SECUNDARIOS
     (Debe ir al final para asegurar que el DOM esté listo)
  =========================================================== */
  inicializarDonantes();
  inicializarNotificaciones();

  /* ==========================================================
     8️⃣ DEBUG Y CONFIRMACIÓN DE CARGA
  =========================================================== */
  appLogger.log("✅ dashboard-centro.js cargado y funcionando correctamente.");
  appLogger.log("ModalBase encontrado:", document.getElementById("modal-base"));
});
