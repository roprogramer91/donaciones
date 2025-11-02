/* ==========================================================
   MODAL BASE REUTILIZABLE
   Controla la apertura y cierre del <dialog id="modal-base">.
   Cualquier componente puede importar estas funciones.
=========================================================== */

/* === REFERENCIAS A ELEMENTOS DEL MODAL BASE === */
const modalBase = document.getElementById("modal-base");
const modalContent = document.getElementById("modal-content");

/* ==========================================================
   FUNCIÓN: ABRIR MODAL
   Inserta HTML dinámico y usa el método nativo showModal()
=========================================================== */
export function abrirModal(htmlContenido) {
  if (!modalBase || !modalContent) {
    console.error("⚠️ No se encontró el modal base en el DOM.");
    return;
  }

  // Limpia contenido previo
  modalContent.innerHTML = htmlContenido;

  // Asegura que el dialog no esté oculto
  modalBase.removeAttribute("hidden");

  try {
    // Abre el modal con el método nativo
    modalBase.showModal();
  } catch (error) {
    // Fallback por si showModal falla
    console.warn("⚠️ No se pudo usar showModal(), usando fallback:", error);
    modalBase.style.display = "block";
  }

  // Bloquea scroll del body mientras el modal está activo
  document.body.style.overflow = "hidden";
}

/* ==========================================================
   FUNCIÓN: CERRAR MODAL
   Cierra el modal y limpia el contenido interno
=========================================================== */
export function cerrarModal() {
  if (!modalBase || !modalContent) return;

  try {
    modalBase.close();
  } catch {
    modalBase.style.display = "none";
  }

  modalContent.innerHTML = "";
  document.body.style.overflow = "auto";
}

/* ==========================================================
   EVENTOS DEL MODAL
   - Cierre con tecla ESC
   - Cierre al hacer clic fuera del contenido
=========================================================== */
if (modalBase) {
  // ESC o cierre por teclado
  modalBase.addEventListener("cancel", (e) => {
    e.preventDefault(); // evita comportamiento por defecto
    cerrarModal();
  });

  // Detectar clic fuera del contenido visible
  modalBase.addEventListener("click", (e) => {
    const dentroDelContenido = modalContent.contains(e.target);
    if (!dentroDelContenido) cerrarModal();
  });
}


/* ==========================================================
   MODAL DE MENSAJE REUTILIZABLE (éxito / error / advertencia)
=========================================================== */
export function mostrarModalMensaje(mensaje, tipo = "info", duracion = 2000) {
  const icono =
    tipo === "exito"
      ? "✅"
      : tipo === "error"
      ? "❌"
      : tipo === "advertencia"
      ? "⚠️"
      : "ℹ️";

  abrirModal(`
    <div class="modal-mensaje ${tipo}">
      <p class="modal-mensaje-texto">${icono} ${mensaje}</p>
    </div>
  `);

  // Se cierra automáticamente después de la duración indicada
  setTimeout(() => cerrarModal(), duracion);
}




/* === LOG DE INICIALIZACIÓN === */
console.log("✅ modalBase.js inicializado correctamente.");
