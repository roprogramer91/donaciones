// ============================================================
// COMPONENTE: RESUMEN DEL CENTRO DE HEMOTERAPIA
// Encargado de mostrar los indicadores principales del panel:
// - Donantes activos
// - Campañas activas / próximas
// - Totales y próximos eventos
// ============================================================

import { API_BASE_URL } from "../../utils/config.js";

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

/**
 * Carga el resumen principal del centro desde el backend
 * y actualiza los indicadores en pantalla.
 */
export async function cargarResumen() {
  try {
    const token = localStorage.getItem("token");
    const centroId = localStorage.getItem("centroId") || 1; // 👈 según cómo lo guardes

    const res = await fetch(`${API_BASE_URL}/api/centro/summary`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Centro-Id": centroId,
      },
    });

    if (!res.ok) throw new Error("Error al obtener el resumen del centro");
    const resumen = await res.json();

    actualizarResumenUI(resumen);
  } catch (error) {
    appLogger.error("Error al cargar resumen del centro:", error);
    mostrarErrorResumen();
  }
}

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Actualiza los valores del dashboard según los datos del resumen.
 * @param {object} s - Objeto con los datos del backend.
 */
function actualizarResumenUI(s) {
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val ?? "--");
  };

  // --- Indicadores principales ---
  setText("donantes-activos", s.donantes_aptos_hoy);
  setText("donantes-totales", s.donantes_totales);
  setText("campanias-activas", s.campanias_activas);
  setText("campanias-proximas", s.proximas_14_dias);
  setText("campanias-finalizadas", s.campanias_finalizadas);

  // --- Desglose por grupo sanguíneo ---
  const contGrupos = document.getElementById("resumen-grupos");
  if (contGrupos && s.aptos_por_grupo) {
    const orden = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    contGrupos.innerHTML = orden
      .map(
        (g) => `
        <span style="
          background:#e7f0fe;
          color:#1f3c80;
          padding:0.25rem 0.5rem;
          border-radius:999px;
          font-size:0.85rem;">
          ${g}: <b>${s.aptos_por_grupo[g] || 0}</b>
        </span>`
      )
      .join("");
  }

  // --- Próxima campaña programada ---
  const elSig = document.getElementById("campania-siguiente");
  if (elSig) {
    if (s.siguiente_campania) {
      const fecha = new Date(
        s.siguiente_campania.fecha_inicio
      ).toLocaleDateString("es-AR");
      elSig.textContent = `${
        s.siguiente_campania.nombre || "Campaña"
      } — ${fecha}`;
    } else {
      elSig.textContent = "--";
    }
  }
}

/**
 * Muestra un mensaje de error si el resumen no pudo cargarse.
 */
function mostrarErrorResumen() {
  const cont = document.querySelector(".dashboard-centro-resumen");
  if (!cont) return;
  cont.innerHTML = `
    <div style="color:#dc2626; background:#fee2e2; padding:1rem; border-radius:8px;">
      ⚠️ Error al cargar los datos del resumen.
    </div>`;
}
import { appLogger } from "../../utils/logger.js";
