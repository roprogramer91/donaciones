/* ==========================================================
   COMPONENTE: CAMPAÑAS
   Controla la carga, render y gestión de campañas del centro
=========================================================== */

import { API_BASE_URL } from "../../config.js";

/* === FUNCIÓN PRINCIPAL === */
export async function cargarCampanias() {
  const contenedor = document.getElementById("seccion-campanias");
  if (!contenedor) {
    console.error("⚠️ No se encontró #seccion-campanias en el DOM.");
    return;
  }

  contenedor.innerHTML = "<p>Cargando campañas...</p>";

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/campanias`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Error al obtener campañas");

    const data = await res.json();

    /* === GENERAR HTML DE TABLA === */
    const html = `
      <div class="campanias-header">
        <h2>Campañas registradas</h2>
        <button id="btnNuevaCampania">+ Nueva campaña</button>
      </div>

      <div class="tabla-container">
        <table class="tabla-datos">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Localidad</th>
              <th>Barrio</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (c) => `
              <tr>
                <td>${c.id}</td>
                <td>${c.nombre}</td>
                <td>${c.localidad_nombre || "-"}</td>
                <td>${c.barrio_nombre || "-"}</td>
                <td>${formatearFecha(c.fecha_inicio)}</td>
                <td>${formatearFecha(c.fecha_fin)}</td>
                <td>${c.estado || "-"}</td>
                <td>
                  <button class="btn-secundario">Editar</button>
                  <button class="btn-peligro">Eliminar</button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    contenedor.innerHTML = html;

  } catch (error) {
    console.error("❌ Error al cargar campañas:", error);
    contenedor.innerHTML = `<p>Error al cargar campañas. Intente más tarde.</p>`;
  }
}

/* === UTILIDAD: FORMATEAR FECHA === */
function formatearFecha(fecha) {
  if (!fecha) return "-";
  const f = new Date(fecha);
  return f.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
