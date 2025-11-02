import { API_BASE_URL } from "../../config.js";
import { obtenerUltimoResultadoDonantes } from "./donantes.js";
import { appLogger } from "../../utils/logger.js";

export function inicializarNotificaciones() {
  const tipo = document.getElementById("tipo-notif");
  const destinatario = document.getElementById("destinatario-notif");
  const mensaje = document.getElementById("mensaje-notif");
  const btnPreview = document.getElementById("btn-preview");
  const btnEnviar = document.getElementById("btn-enviar");
  const previewContenedor = document.getElementById("preview-container");
  const previewContenido = document.getElementById("preview-contenido");
  const tablaLog = document.querySelector("#tabla-log-notif tbody");
  const toggleNotif = document.getElementById("toggle-notif");
  const panelNotif = document.getElementById("notif-panel");

  const token = localStorage.getItem("token");
  const centroId = localStorage.getItem("centroId");

  // Si no hay panel de notificaciones (por ejemplo, en otras secciones)
  if (!toggleNotif || !panelNotif) return;

  /* ==========================================================
     📩 TOGGLE PANEL
  ========================================================== */
  toggleNotif.addEventListener("click", () => {
    panelNotif.classList.toggle("oculto");
    toggleNotif.classList.toggle("activo");
  });

  /* ==========================================================
     📜 CARGAR HISTORIAL
  ========================================================== */
  async function cargarHistorial() {
    if (!tablaLog) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones/log`, {
        headers: {
          "X-Centro-Id": centroId,
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      tablaLog.innerHTML = "";
      if (!data.length) {
        tablaLog.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#888;">Sin registros</td></tr>`;
        return;
      }
      data.forEach((n) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${new Date(n.created_at).toLocaleString()}</td>
          <td>${n.tipo || "-"}</td>
          <td>${n.enviados || 0}</td>
          <td>${
            n.mensaje
              ? n.mensaje.substring(0, 50) +
                (n.mensaje.length > 50 ? "..." : "")
              : ""
          }</td>
        `;
        tablaLog.appendChild(tr);
      });
    } catch (err) {
      appLogger.error("Error al cargar historial:", err);
      tablaLog.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#999;">Error al cargar historial</td></tr>`;
    }
  }

  /* ==========================================================
     👁️ PREVIEW (usa tu endpoint backend)
  ========================================================== */
  btnPreview?.addEventListener("click", async () => {
    try {
      const filtros = construirFiltros();
      const res = await fetch(
        `${API_BASE_URL}/api/centros/notificaciones/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Centro-Id": centroId,
          },
          body: JSON.stringify({ filtros }),
        }
      );
      const data = await res.json();
      previewContenido.textContent = `📬 Destinatarios estimados: ${
        data.destinatarios || 0
      }`;
      previewContenedor.classList.remove("preview-oculto");
    } catch (e) {
      appLogger.error("Error en preview:", e);
      previewContenido.textContent = "Error al generar vista previa.";
      previewContenedor.classList.remove("preview-oculto");
    }
  });

  /* ==========================================================
     📨 ENVIAR NOTIFICACIÓN (simulada)
  ========================================================== */
  btnEnviar?.addEventListener("click", async () => {
    if (!mensaje.value.trim()) {
      alert("Debe escribir un mensaje antes de enviar.");
      return;
    }

    const filtros = construirFiltros();
    const payload = {
      tipo: tipo.value === "felicitacion" ? "cumple" : "aviso",
      mensaje: mensaje.value.trim(),
      filtros,
    };

    try {
      const url =
        tipo.value === "felicitacion"
          ? `${API_BASE_URL}/api/centros/notificaciones/felicitaciones`
          : `${API_BASE_URL}/api/centros/notificaciones`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Centro-Id": centroId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");

      alert(`✅ Notificación registrada. Enviados: ${data.enviados || 0}`);
      mensaje.value = "";
      previewContenedor.classList.add("preview-oculto");
      cargarHistorial();
    } catch (err) {
      appLogger.error("Error al enviar notificación:", err);
      alert("❌ Error al enviar notificación.");
    }
  });

  /* ==========================================================
     🧮 CONSTRUIR FILTROS (usa los de donantes.js si hay)
  ========================================================== */
  function construirFiltros() {
    const lista = obtenerUltimoResultadoDonantes();
    if (destinatario.value === "filtrados" && lista?.length) {
      const grupos = [...new Set(lista.map((d) => d.grupo_sanguineo))].filter(
        Boolean
      );
      return { grupo: grupos.length === 1 ? grupos[0] : undefined };
    }
    if (destinatario.value === "aptos") return { estado: "apto" };
    return {};
  }

  // === Inicialización ===
  cargarHistorial();
  appLogger.log("✅ notificaciones.js inicializado correctamente.");
}
