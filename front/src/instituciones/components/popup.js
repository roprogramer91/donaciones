/* ==========================================================
   POPUP (TOAST) DE MENSAJE GLOBAL REUTILIZABLE
=========================================================== */

export function mostrarPopup(mensaje, tipo = "info", duracion = 3000) {
  // Verificar si ya existe el contenedor
  let contenedor = document.getElementById("popup-container");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "popup-container";
    document.body.appendChild(contenedor);
  }

  // Crear popup individual
  const popup = document.createElement("div");
  popup.classList.add("popup", tipo);
  popup.innerHTML = `
    <span class="popup-icon">${
      tipo === "exito"
        ? "✅"
        : tipo === "error"
        ? "❌"
        : tipo === "advertencia"
        ? "⚠️"
        : "ℹ️"
    }</span>
    <span class="popup-text">${mensaje}</span>
  `;

  // Asegurar que el contenedor esté visible
  contenedor.style.display = "flex";
  contenedor.appendChild(popup);

  // Forzar animación de entrada
  setTimeout(() => popup.classList.add("mostrar"), 10);

  // Auto cierre
  setTimeout(() => {
    popup.classList.remove("mostrar");
    popup.classList.add("ocultar");
    setTimeout(() => popup.remove(), 300);
  }, duracion);
}
