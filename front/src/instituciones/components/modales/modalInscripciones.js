// ============================================================
// MODAL: CAMPAÑAS EN LAS QUE PARTICIPA UN DONANTE
// ============================================================

import { API_BASE_URL } from "../../../utils/config.js";
import { mostrarPopup } from "../popup.js";
import { appLogger } from "../../../utils/logger.js";
import { abrirModalCampania } from "../campanias.js";

const modalInscripciones = document.getElementById("modal-inscripciones");
const cerrarModalInscripciones = document.getElementById(
  "cerrarModalInscripciones"
);
const tituloModalInscripciones = document.getElementById(
  "titulo-modal-inscripciones"
);
const tablaInscripciones = document.querySelector("#tabla-inscripciones tbody");

export function inicializarModalInscripciones() {
  if (!modalInscripciones) return;

  cerrarModalInscripciones?.addEventListener("click", () => {
    modalInscripciones.style.display = "none";
  });

  modalInscripciones.addEventListener("click", (e) => {
    if (e.target === modalInscripciones) {
      modalInscripciones.style.display = "none";
    }
  });
}

export async function abrirModalInscripciones(
  usuarioId,
  nombreDonante = ""
) {
  try {
    modalInscripciones.style.display = "flex";
    tituloModalInscripciones.textContent = `Campañas de ${nombreDonante}`;
    tablaInscripciones.innerHTML =
      `<tr><td colspan="5">Cargando inscripciones...</td></tr>`;

    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/api/campanias/usuario/${usuarioId}/inscripciones`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("No se pudieron obtener las inscripciones");
    }

    const inscripciones = await res.json();
    renderInscripciones(inscripciones);
  } catch (error) {
    appLogger.error("Error al cargar inscripciones:", error);
    mostrarPopup("Error al cargar inscripciones", "error");
  }
}

function renderInscripciones(lista) {
  tablaInscripciones.innerHTML = "";

  if (!Array.isArray(lista) || !lista.length) {
    tablaInscripciones.innerHTML =
      `<tr><td colspan="5">No hay inscripciones registradas</td></tr>`;
    return;
  }

  lista.forEach((item) => {
    const tr = document.createElement("tr");
    const fechaInicio = item.fecha_inicio
      ? new Date(item.fecha_inicio).toLocaleDateString()
      : "--";
    const fechaFin = item.fecha_fin
      ? new Date(item.fecha_fin).toLocaleDateString()
      : "--";
    const estado = formatearEstado(item.estado);

    tr.innerHTML = `
      <td>
        <a href="#" class="link-campania" data-id="${item.id}">
          ${item.nombre || "Campaña"}
        </a>
      </td>
      <td>${fechaInicio}</td>
      <td>${fechaFin}</td>
      <td><span class="estado ${estado.clase}">${estado.texto}</span></td>
      <td>${item.localidad_nombre || "--"}</td>
    `;

    tr.querySelector(".link-campania")?.addEventListener("click", (e) => {
      e.preventDefault();
      modalInscripciones.style.display = "none";
      const campaniaId = Number(e.currentTarget.dataset.id);
      if (campaniaId) {
        abrirModalCampania(campaniaId);
      }
    });

    tablaInscripciones.appendChild(tr);
  });
}

function formatearEstado(estado) {
  switch ((estado || "").toLowerCase()) {
    case "activa":
      return { texto: "Activa", clase: "estado-confirmado" };
    case "futura":
    case "pendiente":
      return { texto: "Pendiente", clase: "estado-pendiente" };
    case "finalizada":
    case "cancelada":
      return { texto: "Finalizada", clase: "estado-cancelado" };
    default:
      return { texto: "Desconocido", clase: "estado-desconocido" };
  }
}

appLogger.log("✅ modalInscripciones.js listo");
