import { API_BASE_URL } from "../../utils/config.js";
import { appLogger } from "../../utils/logger.js";

const btnNotifCentro = document.getElementById("btn-notif-centro");
const badgeNotifCentro = document.getElementById("badge-notif-centro");
const dropdownNotifCentro = document.getElementById("dropdown-notif-centro");
const listaNotifCentro = document.getElementById("lista-notif-centro");

let notificacionesCentro = [];

export function inicializarNotificacionesCentro() {
  if (!btnNotifCentro || !dropdownNotifCentro) return;

  btnNotifCentro.addEventListener("click", (e) => {
    e.stopPropagation();
    const abierto = dropdownNotifCentro.style.display === "block";
    dropdownNotifCentro.style.display = abierto ? "none" : "block";
    if (!abierto) {
      cargarNotificacionesCentro();
    }
  });

  document.addEventListener("click", (e) => {
    if (
      dropdownNotifCentro.style.display === "block" &&
      !dropdownNotifCentro.contains(e.target) &&
      !btnNotifCentro.contains(e.target)
    ) {
      dropdownNotifCentro.style.display = "none";
    }
  });

  cargarNotificacionesCentro();
}

async function cargarNotificacionesCentro() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("No se pudieron obtener las notificaciones");
    notificacionesCentro = await res.json();
    renderNotificacionesCentro();
  } catch (error) {
    appLogger.error("Error al cargar notificaciones del centro:", error);
  }
}

function renderNotificacionesCentro() {
  const pendientes = (notificacionesCentro || []).filter(
    (n) => !n.leida
  ).length;
  if (badgeNotifCentro) {
    if (pendientes > 0) {
      badgeNotifCentro.textContent = pendientes;
      badgeNotifCentro.style.display = "inline-block";
    } else {
      badgeNotifCentro.style.display = "none";
    }
  }

  if (!listaNotifCentro) return;
  listaNotifCentro.innerHTML = "";

  if (!notificacionesCentro.length) {
    listaNotifCentro.innerHTML =
      '<p class="notif-empty">Sin notificaciones recientes</p>';
    return;
  }

  notificacionesCentro.forEach((notif) => {
    const item = document.createElement("div");
    item.className = `notif-entry ${notif.leida ? "" : "unread"}`;
    item.innerHTML = `
      <div class="notif-entry-text">${notif.mensaje}</div>
      <div class="notif-entry-meta">${formatearFecha(notif.created_at)}</div>
      <button class="notif-entry-action" data-id="${notif.id}">
        ${notif.leida ? "Ver" : "Marcar leída"}
      </button>
    `;

    item
      .querySelector(".notif-entry-action")
      ?.addEventListener("click", () => marcarNotifCentro(notif.id));

    listaNotifCentro.appendChild(item);
  });
}

async function marcarNotifCentro(id) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/api/centro/notificaciones/${id}/leida`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) throw new Error("No se pudo marcar como leída");
    await cargarNotificacionesCentro();
  } catch (error) {
    appLogger.error("Error al marcar notificación del centro:", error);
  }
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return "";
  try {
    return new Date(fechaIso).toLocaleString();
  } catch {
    return fechaIso;
  }
}
