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
import { abrirModal, cerrarModal } from "./components/modales/modalBase.js";
import { cargarCampanias } from "./components/campanias.js";
import { cargarResumen } from "./components/resumenCentro.js";
import { mostrarPopup } from "./components/popup.js";

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
    const secciones = [seccionResumen, seccionDonantes, seccionCampanias, seccionNotifs];
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
    btnVerDonantes.addEventListener("click", () => mostrarSeccion(seccionDonantes));

  if (btnVerCampanias)
    btnVerCampanias.addEventListener("click", () => {
      mostrarSeccion(seccionCampanias);
      cargarCampanias(); // carga dinámica desde backend
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

      // Vincula el botón de cerrar dentro del modal
      const btnCerrar = document.getElementById("btnCerrarModal");
      if (btnCerrar) btnCerrar.addEventListener("click", cerrarModal);
    });

  /* ==========================================================
     6️⃣ CERRAR SESIÓN
     Borra token y recarga página
  =========================================================== */
  if (btnLogout)
    btnLogout.addEventListener("click", () => {
      if (confirm("¿Deseas cerrar sesión?")) {
        localStorage.removeItem("token");
        window.location.href = "/front/src/login.html";
      }
    });

  /* ==========================================================
     7️⃣ DEBUG Y CONFIRMACIÓN DE CARGA
  =========================================================== */
  console.log("✅ dashboard-centro.js cargado y funcionando correctamente.");
  console.log("ModalBase encontrado:", document.getElementById("modal-base"));
});
