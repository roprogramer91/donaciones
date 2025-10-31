// ============================================================
// COMPONENTE: NOTIFICACIONES A DONANTES
// Controla el envío de avisos, felicitaciones e historial
// para el panel del Centro de Hemoterapia.
// ============================================================

import { API_BASE_URL } from "../../config.js";
import {
  authHeaders,
  getCentroId,
  toggleSeccion,
  mostrarMensaje,
} from "../dashboard-centro.js";

// ============================================================
// ELEMENTOS BASE
// ============================================================

const btnVerNotifs = document.getElementById("btn-ver-notifs");
const seccionNotifs = document.getElementById("seccion-notifs");

// Envío manual de notificaciones
const btnEnviarNotif = document.getElementById("btn-enviar-notif");
const msgNotif = document.getElementById("notif-centro-mensaje");
const btnPreviewNotif = document.getElementById("btn-preview-notif");

// Envío automático (felicitaciones)
const btnFelicitacionesHoy = document.getElementById("btn-felicitaciones-hoy");
const btnPreviewFel = document.getElementById("btn-preview-felicitaciones");

// Selectores de filtros
const selProvN = document.getElementById("f_notif_provincia");
const selLocN = document.getElementById("f_notif_localidad");
const selCamp = document.getElementById("notif_campania_sel");
const selGrupo = document.getElementById("f_notif_grupo");
const chkApto = document.getElementById("f_notif_apto");

// Badge con alcance estimado
const badgeReach = document.getElementById("notif-centro-badge");

// ============================================================
// INICIALIZACIÓN DEL MÓDULO
// ============================================================

export function inicializarNotificaciones() {
  if (!btnVerNotifs) return;

  btnVerNotifs.addEventListener("click", async () => {
    const visible = toggleSeccion("notifs");
    if (!visible) return;

    await Promise.all([cargarProvinciasNotif(), cargarCampaniasNotif()]);
    await cargarLogNotifs();

    setTimeout(actualizarBadgeReach, 250);
  });

  // Eventos de envío y vista previa
  btnEnviarNotif?.addEventListener("click", enviarNotificacion);
  btnPreviewNotif?.addEventListener("click", previsualizarNotificacion);

  btnFelicitacionesHoy?.addEventListener("click", enviarFelicitaciones);
  btnPreviewFel?.addEventListener("click", previsualizarFelicitaciones);

  // Eventos para actualización de alcance en tiempo real
  ["f_notif_provincia", "f_notif_localidad", "f_notif_grupo", "f_notif_apto"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", debReach);
        el.addEventListener("input", debReach);
      }
    }
  );
}

// ============================================================
// ENVÍO Y PREVISUALIZACIÓN DE NOTIFICACIONES
// ============================================================

async function enviarNotificacion() {
  const mensaje = document.getElementById("notif_mensaje")?.value.trim();
  const tipo = document.getElementById("notif_tipo")?.value || "aviso";
  const campania_id = parseInt(selCamp?.value || "", 10) || null;

  const filtros = obtenerFiltros();

  if (!mensaje) {
    msgNotif.textContent = "El mensaje es obligatorio";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ mensaje, tipo, campania_id, filtros }),
    });

    if (!res.ok) throw new Error("No se pudo enviar la notificación");
    const data = await res.json();

    msgNotif.textContent = `Notificaciones enviadas: ${data.enviados}`;
    mostrarMensaje("Notificaciones enviadas correctamente", "success");
    await cargarLogNotifs();
  } catch (error) {
    console.error(error);
    msgNotif.textContent = "Error al enviar notificaciones";
    mostrarMensaje("Error al enviar notificaciones", "error");
  }
}

async function previsualizarNotificacion() {
  try {
    const filtros = obtenerFiltros();
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones/preview`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ filtros }),
    });

    if (!res.ok) throw new Error("No se pudo previsualizar");
    const data = await res.json();

    msgNotif.textContent = `Alcance estimado: ${data.destinatarios} donantes`;
  } catch (e) {
    console.error(e);
    msgNotif.textContent = "Error al previsualizar";
  }
}

// ============================================================
// FELICITACIONES AUTOMÁTICAS
// ============================================================

async function enviarFelicitaciones() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones/felicitaciones`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ dias: 0 }),
    });

    if (!res.ok) throw new Error("No se pudo generar felicitaciones");
    const data = await res.json();

    msgNotif.textContent = `Felicitaciones generadas: ${data.enviados}`;
    mostrarMensaje("Felicitaciones enviadas correctamente", "success");
  } catch (e) {
    console.error(e);
    msgNotif.textContent = "Error al generar felicitaciones";
    mostrarMensaje("Error al generar felicitaciones", "error");
  }
}

async function previsualizarFelicitaciones() {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/centro/notificaciones/felicitaciones/preview`,
      {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ dias: 0 }),
      }
    );

    if (!res.ok) throw new Error("No se pudo previsualizar felicitaciones");
    const data = await res.json();
    msgNotif.textContent = `Cumpleaños hoy: ${data.candidatos} donantes`;
  } catch (e) {
    console.error(e);
    msgNotif.textContent = "Error al previsualizar felicitaciones";
  }
}

// ============================================================
// FILTROS Y ALCANCE
// ============================================================

function obtenerFiltros() {
  const provincia = parseInt(selProvN?.value || "", 10) || undefined;
  const localidad = parseInt(selLocN?.value || "", 10) || undefined;
  const grupo = selGrupo?.value || undefined;
  const apto = chkApto?.checked ? "true" : undefined;

  return { provincia, localidad, grupo, apto };
}

async function actualizarBadgeReach() {
  try {
    const filtros = obtenerFiltros();
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones/preview`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ filtros }),
    });

    if (!res.ok) throw new Error("Error preview alcance");
    const data = await res.json();

    if (badgeReach) badgeReach.textContent = `Alcance: ${data.destinatarios || 0}`;
    const btnSend = document.getElementById("btn-enviar-notif");
    if (btnSend) btnSend.disabled = !data.destinatarios;
  } catch {
    if (badgeReach) badgeReach.textContent = "Alcance: 0";
  }
}

function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}
const debReach = debounce(actualizarBadgeReach, 300);

// ============================================================
// CARGA DE CATÁLOGOS (Provincias, Localidades, Campañas)
// ============================================================

async function cargarProvinciasNotif() {
  if (!selProvN) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/provincias`);
    const data = await res.json();

    selProvN.innerHTML = '<option value="">Todas las provincias</option>';
    data.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nombre;
      selProvN.appendChild(opt);
    });
  } catch (e) {
    console.error("Error al cargar provincias:", e);
  }
}

async function cargarLocalidadesNotif(provId) {
  if (!selLocN) return;
  selLocN.disabled = !provId;
  selLocN.innerHTML = '<option value="">Todas las localidades</option>';
  if (!provId) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/localidades?provincia=${provId}`);
    const data = await res.json();
    data.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = l.nombre;
      selLocN.appendChild(opt);
    });
  } catch (e) {
    console.error("Error al cargar localidades:", e);
  }
}

selProvN?.addEventListener("change", (e) =>
  cargarLocalidadesNotif(e.target.value || "")
);

async function cargarCampaniasNotif() {
  if (!selCamp) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/campanias`);
    const lista = await res.json();

    selCamp.innerHTML = '<option value="">Seleccionar campaña...</option>';
    lista.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nombre;
      selCamp.appendChild(opt);
    });
  } catch (e) {
    console.error("Error al cargar campañas:", e);
  }
}

// ============================================================
// HISTORIAL DE ENVÍOS (LOG DE NOTIFICACIONES)
// ============================================================

async function cargarLogNotifs() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones/log`, {
      headers: authHeaders(),
    });

    if (!res.ok) throw new Error("Error al obtener log");
    const data = await res.json();

    renderLogNotifs(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error("Error al cargar historial de notificaciones:", e);
  }
}

function renderLogNotifs(lista) {
  const cont = document.getElementById("notif-centro-log");
  if (!cont) return;

  const tbody = cont.querySelector("tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="4">Sin envíos recientes</td></tr>`;
    return;
  }

  lista.forEach((item) => {
    const tr = document.createElement("tr");
    const fecha = item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "";

    tr.innerHTML = `
      <td>${fecha}</td>
      <td>${item.tipo || ""}</td>
      <td>${item.enviados || 0}</td>
      <td>${(item.mensaje || "").substring(0, 80)}</td>
    `;

    tr.addEventListener("click", () => abrirModalNotifDetalle(item));
    tbody.appendChild(tr);
  });
}

// ============================================================
// MODAL DETALLE DE NOTIFICACIÓN
// ============================================================

const modalNotif = document.getElementById("modal-notif-detalle");
const cerrarModalNotifDetalle = document.getElementById("cerrarModalNotifDetalle");

cerrarModalNotifDetalle?.addEventListener("click", () => {
  if (modalNotif) modalNotif.style.display = "none";
});

if (modalNotif) {
  modalNotif.addEventListener("click", (e) => {
    if (e.target === modalNotif) modalNotif.style.display = "none";
  });
}

function abrirModalNotifDetalle(item) {
  if (!modalNotif) return;

  document.getElementById("notif_det_fecha").textContent = new Date(
    item.created_at
  ).toLocaleString();
  document.getElementById("notif_det_tipo").textContent = item.tipo || "--";
  document.getElementById("notif_det_enviados").textContent = item.enviados || 0;
  document.getElementById("notif_det_mensaje").textContent = item.mensaje || "";

  const elFiltros = document.getElementById("notif_det_filtros_json");
  elFiltros.textContent = JSON.stringify(item.filtros || {}, null, 2);

  modalNotif.style.display = "flex";
}
