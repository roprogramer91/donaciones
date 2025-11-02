// ============================================================
// COMPONENTE: MODAL DE INSCRIPCIONES A CAMPAÑAS
// Permite visualizar la lista de donantes inscritos a una
// campaña específica desde el panel del centro de hemoterapia.
// ============================================================

import { API_BASE_URL } from "../../../config.js";
import { authHeaders, mostrarMensaje } from "../../dashboard-centro.js";

// ============================================================
// ELEMENTOS BASE
// ============================================================

const modalInscripciones = document.getElementById("modal-inscripciones");
const cerrarModalInscripciones = document.getElementById(
  "cerrarModalInscripciones"
);
const tituloModalInscripciones = document.getElementById(
  "titulo-modal-inscripciones"
);
const tablaInscripciones = document.querySelector("#tabla-inscripciones tbody");

// ============================================================
// INICIALIZACIÓN
// ============================================================

export function inicializarModalInscripciones() {
  if (!modalInscripciones) return;

  cerrarModalInscripciones?.addEventListener("click", () => {
    modalInscripciones.style.display = "none";
  });

  modalInscripciones.addEventListener("click", (e) => {
    if (e.target === modalInscripciones)
      modalInscripciones.style.display = "none";
  });
}

// ============================================================
// MOSTRAR MODAL CON INSCRIPCIONES DE UNA CAMPAÑA
// ============================================================

export async function abrirModalInscripciones(campaniaId, campaniaNombre = "") {
  try {
    modalInscripciones.style.display = "flex";
    tituloModalInscripciones.textContent = `Inscripciones - ${campaniaNombre}`;
    tablaInscripciones.innerHTML = `<tr><td colspan="4">Cargando inscripciones...</td></tr>`;

    const res = await fetch(
      `${API_BASE_URL}/api/campanias/${campaniaId}/inscripciones`,
      {
        headers: authHeaders(),
      }
    );

    if (!res.ok) throw new Error("No se pudieron obtener las inscripciones");

    const inscripciones = await res.json();
    renderInscripciones(inscripciones);
  } catch (error) {
    appLogger.error("Error al cargar inscripciones:", error);
    mostrarMensaje("Error al cargar inscripciones", "error");
  }
}

// ============================================================
// RENDERIZADO DE INSCRIPCIONES
// ============================================================

function renderInscripciones(lista) {
  tablaInscripciones.innerHTML = "";

  if (!Array.isArray(lista) || lista.length === 0) {
    tablaInscripciones.innerHTML = `<tr><td colspan="4">No hay inscripciones registradas</td></tr>`;
    return;
  }

  lista.forEach((i) => {
    const tr = document.createElement("tr");

    const fecha = i.fecha_inscripcion
      ? new Date(i.fecha_inscripcion).toLocaleDateString()
      : "--";
    const estado = formatearEstado(i.estado);

    tr.innerHTML = `
      <td>${i.nombre_donante || "Sin nombre"}</td>
      <td>${i.email_donante || "—"}</td>
      <td>${fecha}</td>
      <td>
        <span class="estado ${estado.clase}">${estado.texto}</span>
      </td>
    `;

    tablaInscripciones.appendChild(tr);
  });
}

// ============================================================
// UTILIDADES
// ============================================================

function formatearEstado(estado) {
  switch (estado) {
    case "confirmado":
      return { texto: "Confirmado", clase: "estado-confirmado" };
    case "pendiente":
      return { texto: "Pendiente", clase: "estado-pendiente" };
    case "cancelado":
      return { texto: "Cancelado", clase: "estado-cancelado" };
    default:
      return { texto: "Desconocido", clase: "estado-desconocido" };
  }
}
import { appLogger } from "../../../utils/logger.js";
