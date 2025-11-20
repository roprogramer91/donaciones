import { API_BASE_URL } from "../../utils/config.js";
import { obtenerUltimoResultadoDonantes } from "./donantes.js";
import { appLogger } from "../../utils/logger.js";

const MAPA_TIPOS = {
  centro_manual_directo: "Manual directo",
  centro_manual_filtro: "Manual filtrado",
  centro_felicitacion: "Cumpleanos",
  cumpleanios: "Cumpleanos",
  donante_inscripto: "Inscripcion",
  donante_cancelado: "Baja de inscripcion",
  campania_creada: "Campana creada",
  campania_actualizada: "Campana actualizada",
  campania_cancelada: "Campana cancelada",
};

let historialNotificaciones = [];
let historialFiltrado = [];

export function inicializarNotificaciones() {
  const tipo = document.getElementById("tipo-notif");
  const destinatario = document.getElementById("destinatario-notif");
  const mensaje = document.getElementById("mensaje-notif");
  const btnPreview = document.getElementById("btn-preview");
  const btnEnviar = document.getElementById("btn-enviar");
  const previewContenedor = document.getElementById("preview-container");
  const previewContenido = document.getElementById("preview-contenido");
  const tablaLog = document.querySelector("#tabla-log-notif tbody");
  const tablaHistorialPrincipal = document.querySelector(
    "#tabla-notifs-historial tbody"
  );
  const toggleNotif = document.getElementById("toggle-notif");
  const panelNotif = document.getElementById("notif-panel");
  const btnIrPanelNotifs = document.getElementById("btn-ir-panel-notifs");
  const btnRefrescarNotifs = document.getElementById("btn-refrescar-notifs");
  const metricSemana = document.getElementById("metric-notif-semana");
  const metricAuto = document.getElementById("metric-notif-auto");
  const metricReciente = document.getElementById("metric-notif-reciente");
  const filtroHistDesde = document.getElementById("filtro-notif-desde");
  const filtroHistHasta = document.getElementById("filtro-notif-hasta");
  const filtroHistTipo = document.getElementById("filtro-notif-tipo");
  const filtroHistBuscar = document.getElementById("filtro-notif-buscar");
  const btnLimpiarNotifs = document.getElementById("btn-limpiar-notifs");
  const btnExportarNotifs = document.getElementById("btn-exportar-notifs");

  const token = localStorage.getItem("token");

  const tienePanel = toggleNotif && panelNotif;

  if (tienePanel) {
    toggleNotif.addEventListener("click", () => {
      panelNotif.classList.toggle("oculto");
      toggleNotif.classList.toggle("activo");
    });
  }

  btnIrPanelNotifs?.addEventListener("click", () => {
    document.getElementById("btn-ver-donantes")?.click();
    setTimeout(() => {
      const toggle = document.getElementById("toggle-notif");
      const panel = document.getElementById("notif-panel");
      if (panel?.classList.contains("oculto")) {
        toggle?.dispatchEvent(new Event("click"));
      }
      panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  });

  btnRefrescarNotifs?.addEventListener("click", async () => {
    const textoOriginal = btnRefrescarNotifs.textContent;
    btnRefrescarNotifs.disabled = true;
    btnRefrescarNotifs.textContent = "Actualizando...";
    try {
      await cargarHistorial();
    } finally {
      btnRefrescarNotifs.disabled = false;
      btnRefrescarNotifs.textContent = textoOriginal;
    }
  });

  [filtroHistDesde, filtroHistHasta, filtroHistTipo].forEach((ctrl) =>
    ctrl?.addEventListener("change", () => aplicarFiltrosHistorial())
  );
  filtroHistBuscar?.addEventListener("input", () =>
    aplicarFiltrosHistorial()
  );
  btnLimpiarNotifs?.addEventListener("click", (e) => {
    e.preventDefault();
    limpiarFiltrosHistorial();
  });
  btnExportarNotifs?.addEventListener("click", (e) => {
    e.preventDefault();
    exportarHistorialCsv();
  });

  async function cargarHistorial() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones/log`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      historialNotificaciones = Array.isArray(data) ? data : [];
      aplicarFiltrosHistorial();
      actualizarMetricas(historialNotificaciones);
    } catch (err) {
      appLogger.error("Error al cargar historial:", err);
      historialFiltrado = [];
      if (tablaLog) {
        tablaLog.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#999;">Error al cargar historial</td></tr>`;
      }
      if (tablaHistorialPrincipal) {
        tablaHistorialPrincipal.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;">Error al cargar historial</td></tr>`;
      }
    }
  }

  function renderTablaCompacta(data, tabla) {
    if (!tabla) return;
    tabla.innerHTML = "";
    if (!data.length) {
      tabla.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#888;">Sin registros</td></tr>`;
      return;
    }
    data.slice(0, 5).forEach((n) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatearFecha(n.created_at)}</td>
        <td>${formatearTipo(n.tipo)}</td>
        <td>${n.enviados || 0}</td>
        <td>${formatearMensaje(n.mensaje)}</td>
      `;
      tabla.appendChild(tr);
    });
  }

  function renderTablaPrincipal(data, tabla) {
    if (!tabla) return;
    tabla.innerHTML = "";
    if (!data.length) {
      tabla.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#7e8695;">Aun no hay registros para mostrar.</td></tr>`;
      return;
    }
    data.forEach((n) => {
      const meta = normalizarMeta(n.meta);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatearFecha(n.created_at)}</td>
        <td>${formatearTipo(n.tipo)}</td>
        <td>${n.enviados || 0}</td>
        <td>${formatearOrigen(meta?.origen, n.tipo)}</td>
        <td>${formatearCampania(n, meta)}</td>
        <td>${formatearMensaje(n.mensaje)}</td>
      `;
      tabla.appendChild(tr);
    });
  }

  function aplicarFiltrosHistorial() {
    historialFiltrado = filtrarHistorial(historialNotificaciones);
    renderTablaCompacta(historialFiltrado, tablaLog);
    renderTablaPrincipal(historialFiltrado, tablaHistorialPrincipal);
  }

  function filtrarHistorial(data = []) {
    const desdeValor = filtroHistDesde?.value
      ? new Date(`${filtroHistDesde.value}T00:00:00`)
      : null;
    const hastaValor = filtroHistHasta?.value
      ? new Date(`${filtroHistHasta.value}T23:59:59`)
      : null;
    const categoria = filtroHistTipo?.value || "";
    const texto = (filtroHistBuscar?.value || "").toLowerCase().trim();

    return data.filter((item) => {
      const fecha = item.created_at ? new Date(item.created_at) : null;
      if (desdeValor && (!fecha || fecha < desdeValor)) return false;
      if (hastaValor && (!fecha || fecha > hastaValor)) return false;
      if (categoria && !coincideCategoria(item.tipo, categoria)) return false;

      if (texto) {
        const meta = normalizarMeta(item.meta);
        const campos = [
          item.mensaje,
          formatearTipo(item.tipo),
          formatearOrigen(meta?.origen, item.tipo),
          formatearCampania(item, meta),
        ]
          .filter(Boolean)
          .map((c) => c.toLowerCase());
        if (!campos.some((campo) => campo.includes(texto))) return false;
      }

      return true;
    });
  }

  function limpiarFiltrosHistorial() {
    if (filtroHistDesde) filtroHistDesde.value = "";
    if (filtroHistHasta) filtroHistHasta.value = "";
    if (filtroHistTipo) filtroHistTipo.value = "";
    if (filtroHistBuscar) filtroHistBuscar.value = "";
    aplicarFiltrosHistorial();
  }

  function exportarHistorialCsv() {
    const dataset = (historialFiltrado.length
      ? historialFiltrado
      : historialNotificaciones) || [];

    if (!dataset.length) {
      mostrarAviso("No hay registros para exportar.", "advertencia");
      return;
    }

    const headers = [
      "Fecha",
      "Tipo",
      "Origen",
      "Destinatarios",
      "Campaña",
      "Mensaje",
    ];

    const rows = dataset.map((n) => {
      const meta = normalizarMeta(n.meta);
      return [
        formatearFecha(n.created_at),
        formatearTipo(n.tipo),
        formatearOrigen(meta?.origen, n.tipo),
        n.enviados || 0,
        formatearCampania(n, meta),
        n.mensaje || "",
      ];
    });

    const escape = (val) => {
      const str = String(val ?? "");
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fecha = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `notificaciones_${fecha}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function coincideCategoria(tipo = "", filtro = "") {
    if (!filtro) return true;
    const limpio = tipo || "";
    if (!limpio) return false;

    if (filtro === "manual") {
      return (
        limpio === "centro_manual_directo" || limpio === "centro_manual_filtro"
      );
    }
    if (filtro === "automatica") {
      return (
        limpio.startsWith("donante_") ||
        limpio.startsWith("campania_")
      );
    }
    if (filtro === "felicitacion") {
      return (
        limpio === "centro_felicitacion" ||
        limpio === "cumpleanios"
      );
    }
    return true;
  }

  function actualizarMetricas(data) {
    if (!data || !data.length) {
      if (metricSemana) metricSemana.textContent = "0";
      if (metricAuto) metricAuto.textContent = "0";
      if (metricReciente) metricReciente.textContent = "-";
      return;
    }
    const ahora = Date.now();
    const semanaMs = 7 * 24 * 60 * 60 * 1000;
    const ultimos7 = data.filter((n) => {
      const fecha = new Date(n.created_at).getTime();
      return !isNaN(fecha) && ahora - fecha <= semanaMs;
    }).length;
    const automaticas = data.filter((n) => {
      const meta = normalizarMeta(n.meta);
      const origen = meta?.origen || "";
      return origen && !origen.startsWith("manual");
    }).length;
    const manualRec = data.find((n) => {
      const meta = normalizarMeta(n.meta);
      const origen = meta?.origen || "";
      return origen.startsWith("manual");
    });

    if (metricSemana) metricSemana.textContent = String(ultimos7);
    if (metricAuto) metricAuto.textContent = String(automaticas);
    if (metricReciente) {
      metricReciente.textContent = manualRec
        ? formatearFecha(manualRec.created_at)
        : "-";
    }
  }

  btnPreview?.addEventListener("click", async () => {
    try {
      const filtros = construirFiltros();
      const res = await fetch(
        `${API_BASE_URL}/api/centro/notificaciones/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ filtros }),
        }
      );
      const data = await res.json();
      previewContenido.textContent = `Destinatarios estimados: ${
        data.destinatarios || data.cantidad || 0
      }`;
      previewContenedor?.classList.remove("preview-oculto");
    } catch (e) {
      appLogger.error("Error en preview:", e);
      if (previewContenido) {
        previewContenido.textContent = "Error al generar vista previa.";
      }
      previewContenedor?.classList.remove("preview-oculto");
    }
  });

  btnEnviar?.addEventListener("click", async () => {
    if (!mensaje?.value?.trim()) {
      mostrarAviso("Debes escribir un mensaje antes de enviar.", "error");
      return;
    }

    const filtros = construirFiltros();
    const payload = {
      tipo: tipo?.value === "felicitacion" ? "cumple" : "aviso",
      mensaje: mensaje.value.trim(),
      filtros,
    };

    try {
      const url =
        tipo?.value === "felicitacion"
          ? `${API_BASE_URL}/api/centro/notificaciones/felicitaciones`
          : `${API_BASE_URL}/api/centro/notificaciones`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");

      mostrarAviso(
        `Notificaci\u00f3n registrada. Enviados: ${data.enviados || 0}`,
        "success"
      );
      if (mensaje) mensaje.value = "";
      previewContenedor?.classList.add("preview-oculto");
      cargarHistorial();
    } catch (err) {
      appLogger.error("Error al enviar notificacion:", err);
      mostrarAviso("Error al enviar notificaci\u00f3n.", "error");
    }
  });

  function construirFiltros() {
    const lista = obtenerUltimoResultadoDonantes();
    if (destinatario?.value === "filtrados" && lista?.length) {
      const grupos = [...new Set(lista.map((d) => d.grupo_sanguineo))].filter(
        Boolean
      );
      return { grupo: grupos.length === 1 ? grupos[0] : undefined };
    }
    if (destinatario?.value === "aptos") return { estado: "apto" };
    return {};
  }

  cargarHistorial();
  appLogger.log("notificaciones.js inicializado correctamente");
}

function formatearFecha(valor) {
  if (!valor) return "-";
  try {
    let iso = valor.trim();
    if (iso.includes(" ") && !iso.includes("T")) {
      iso = iso.replace(" ", "T");
    }
    if (!/[zZ]$/.test(iso) && !/[+\-]\d\d:\d\d$/.test(iso)) {
      iso += "Z";
    }
    return new Date(iso).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour12: false,
    });
  } catch {
    return valor;
  }
}

function normalizarMeta(meta) {
  if (!meta) return {};
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta);
    } catch {
      return {};
    }
  }
  return meta;
}

function formatearTipo(tipo) {
  if (!tipo) return "-";
  return MAPA_TIPOS[tipo] || tipo.replace(/_/g, " " );
}

function formatearOrigen(origen = "", tipo = "") {
  if (!origen) {
    if (tipo?.includes("campania")) return "Campanas";
    if (tipo?.includes("donante")) return "Donantes";
    return "Sistema";
  }
  const mapa = {
    manual_directo: "Manual directo",
    manual_filtro: "Manual filtrado",
    felicitacion: "Cumpleanos",
    inscripcion: "Inscripciones",
  };
  return mapa[origen] || origen.replace(/_/g, " " );
}

function formatearCampania(item, meta) {
  if (item?.campania_id) return `ID ${item.campania_id}`;
  if (meta?.campania_id) return `ID ${meta.campania_id}`;
  if (meta?.campania_nombre) return meta.campania_nombre;
  return "-";
}

function formatearMensaje(msg = "") {
  if (!msg) return "";
  const limpio = msg.trim();
  return limpio.length > 60 ? `${limpio.slice(0, 60)}...` : limpio;
}

function mostrarAviso(texto, tipo = "info") {
  const popupWrapper = document.createElement("div");
  popupWrapper.className = `alerta-toaster alerta-${tipo}`;
  popupWrapper.textContent = texto;
  document.body.appendChild(popupWrapper);

  requestAnimationFrame(() => {
    popupWrapper.classList.add("visible");
  });

  setTimeout(() => {
    popupWrapper.classList.remove("visible");
    setTimeout(() => popupWrapper.remove(), 300);
  }, 3000);
}
