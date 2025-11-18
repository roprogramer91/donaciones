import { API_BASE_URL } from "../utils/config.js";

const estadoApto = document.getElementById("estado-apto");

/**
 * ---------------------------------------------------------------------------
 * Configuración inicial y referencias del DOM
 * ---------------------------------------------------------------------------
 * - Se valida la existencia del token para asegurar sesión.
 * - Se obtienen referencias a elementos del dashboard que se actualizarán
 *   dinámicamente según la información de la API.
 */

const token = localStorage.getItem("token");
if (!token) window.location.href = "../../index.html";

const loader = document.getElementById("loader");
const contenidoPrivado = document.getElementById("contenido-privado");
const bienvenida = document.getElementById("bienvenida");
const logoutBtn = document.getElementById("logoutBtn");
const proximasBox = document.querySelector(".proximas-campanias");
const btnProxima = document.getElementById("btn-campanias");
const btnNotif = document.getElementById("btn-notif");
const notifDropdown = document.getElementById("notifDropdown");
const notifList = document.getElementById("notifList");
const notifEmpty = document.getElementById("notifEmpty");
const notifBadge = document.getElementById("notifBadge");

// Elementos de los datos personales
const grupoSangre = document.getElementById("grupo-sangre");
const ultimaDonacion = document.getElementById("ultima-donacion");
const diasApto = document.getElementById("dias-apto");

/**
 * ---------------------------------------------------------------------------
 * Panel principal
 * ---------------------------------------------------------------------------
 * Obtiene el perfil del donante y actualiza:
 *  - Estado de aptitud (apto/no apto).
 *  - Saludo y datos personales.
 *  - Listado de campañas (disponibles, mis inscripciones, próxima).
 * Manejo de errores con mensaje visible y detalle en consola.
 */

async function cargarPanel() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/perfil`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "../../index.html";
      return;
    }
    if (!res.ok) throw new Error("Error al obtener perfil");
    
    // --- INICIO DE MEJORA: Recibo todos los datos en una sola respuesta ---
    const { perfil: donante, campanias, notificaciones } = await res.json();
    appLogger.log({ donante, campanias, notificaciones }); // SOLO PARA DEBUGGING

    // Estado de aptitud del donante (basado en días restantes)
    let dias = donante.dias_restantes;
    if (
      dias !== undefined &&
      dias !== null &&
      donante.apto_para_donar !== undefined
    ) {
      if (dias === 0) {
        estadoApto.textContent = "APTO";
        estadoApto.className = "estado-apto apto";
      } else {
        estadoApto.textContent = "NO APTO";
        estadoApto.className = "estado-apto no-apto";
      }
    } else {
      estadoApto.textContent = "";
      estadoApto.className = "estado-apto";
    }

    // Saludo y datos personales
    bienvenida.textContent = `Hola, ${donante.nombre || "Donante"}!`;
    grupoSangre.textContent = donante.grupo_sanguineo || "--";
    ultimaDonacion.textContent = donante.fecha_ultima_donacion
      ? new Date(donante.fecha_ultima_donacion).toLocaleDateString()
      : "--/--/----";
    diasApto.textContent =
      donante.dias_restantes !== undefined
        ? `${donante.dias_restantes} días`
        : "-- días";

    // Carga inicial de datos del panel
    renderCampanias(campanias);
    renderNotificaciones(notificaciones);
    cargarProximaInscripcion(campanias);

    // Mostrar contenido del dashboard cuando todo está listo
    loader.style.display = "none";
    contenidoPrivado.style.display = "block";
  } catch (e) {
    appLogger.error("⚠️ Error detallado en cargarPanel():", e);

    loader.innerHTML = `
    <p style="color:red;">
      Error al cargar datos.<br>
      <strong>Detalles:</strong> ${e.message || "Error desconocido"}<br>
      Revisa la consola para más información.
    </p>`;
  }
}

/**
 * ---------------------------------------------------------------------------
 * Navegación interna básica
 * ---------------------------------------------------------------------------
 * Botones de acceso directo a secciones del sitio del donante.
 */

// Botón de perfil
document.getElementById("btn-perfil").addEventListener("click", () => {
  window.location.href = "perfil-donante.html";
});

// Botón de logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../../index.html";
});

// Inicio del panel
cargarPanel();

/**
 * ---------------------------------------------------------------------------
 * Campañas disponibles
 * ---------------------------------------------------------------------------
 * Obtiene la lista de campañas según la localización del donante y renderiza
 * tarjetas con su estado (activa/futura) y si el usuario ya se inscribió.
 */

const campaniasList = document.getElementById("campaniasList");
const modal = document.getElementById("modalCampania");
const btnCerrarModal = document.getElementById("btnCerrarModal");
const btnAsistir = document.getElementById("btnAsistir");
const btnCancelar = document.getElementById("btnCancelar");
const confirmDlg = document.getElementById("confirmCancel");
const confirmMsg = document.getElementById("confirmCancelMsg");
const confirmYes = document.getElementById("btnCancelYes");
const confirmNo = document.getElementById("btnCancelNo");

// FIX: Cerrar los modales al iniciar
if (modal && modal.open) modal.close();
if (confirmDlg && confirmDlg.open) confirmDlg.close();

let campaniaSeleccionada = null;
let proximaSeleccionada = null;

// Cierre del modal de campaña
btnCerrarModal?.addEventListener("click", () => {
  modal.style.display = "none";
  campaniaSeleccionada = null;
});

/**
 * Renderiza la lista de campañas disponibles ordenadas por prioridad:
 * 1) Inscripto primero.
 * 2) Luego activas.
 * 3) Luego futuras (por fecha de inicio).
 */
function renderCampanias(campanias) {
  if (!campaniasList) return;
  const items = (campanias || []).slice();

  const rankEstado = (s) => (s === "activa" ? 0 : s === "futura" ? 1 : 2);

  items.sort((a, b) => {
    const ra = a.ya_inscripto ? 0 : 1;
    const rb = b.ya_inscripto ? 0 : 1;
    if (ra !== rb) return ra - rb;

    const ea = rankEstado(a.estado_calculado);
    const eb = rankEstado(b.estado_calculado);
    if (ea !== eb) return ea - eb;

    const da = a.fecha_inicio ? new Date(a.fecha_inicio) : null;
    const db = b.fecha_inicio ? new Date(b.fecha_inicio) : null;
    if (da && db) return da - db;
    if (da && !db) return -1;
    if (!da && db) return 1;
    return 0;
  });

  if (items.length === 0) {
    campaniasList.innerHTML =
      "<em>No hay campañas activas o futuras cerca.</em>";
    return;
  }

  campaniasList.innerHTML = "";
  items.forEach((c) => {
    // --- INICIO DE MEJORA: Uso de template literals para un código más limpio ---
    let estadoTag = '';
    if (c.estado_calculado === "activa") {
      estadoTag = `<span class="tag tag-activa">Activa</span>`;
    } else if (c.estado_calculado === "futura") {
      const dias =
        typeof c.dias_para_inicio === "number" && c.dias_para_inicio > 0
          ? ` (en ${c.dias_para_inicio} días)`
          : "";
      estadoTag = `<span class="tag tag-futura">Próxima${dias}</span>`;
    }

    let inscripcionTag = '';
    if (c.ya_inscripto) {
      inscripcionTag = `<span class="tag tag-inscripto">Inscripto</span>`;
    } else {
      inscripcionTag = `<span class="tag tag-no-inscripto">No inscripto</span>`;
    }

    const card = document.createElement("article");
    card.className = "campania-card";
    card.innerHTML = `
      <img src="${c.imagen_url || "https://placehold.co/64x64/EEE/AAA?text=Img"}" alt="${c.nombre || "Campaña"}">
      <div class="campania-info">
        <strong>${c.nombre || "Campaña"}</strong>
        <p>${c.descripcion || ""}</p>
        <div class="tags-container">
          ${estadoTag}
          ${inscripcionTag}
        </div>
      </div>
      <button class="btn-secundario btn-ver-campania">Ver</button>
    `;

    card.querySelector('.btn-ver-campania').addEventListener('click', () => abrirModalCampania(c));
    campaniasList.appendChild(card);
    // --- FIN DE MEJORA ---
  });
}

/**
 * Abre el modal con el detalle de la campaña seleccionada y permite:
 * - Inscribirse (si es inscribible).
 * - Cancelar la inscripción (si ya está inscripto).
 */
function abrirModalCampania(c) {
  campaniaSeleccionada = c;

  document.getElementById("modalTitulo").textContent = c.nombre || "Campaña";
  document.getElementById("modalDescripcion").textContent = c.descripcion || "";

  const lugar = `${c.localidad_nombre || ""}${
    c.barrio_nombre ? " - " + c.barrio_nombre : ""
  }`;
  document.getElementById("modalLugar").textContent = lugar.trim();

  if (c.ya_inscripto === true) {
    btnAsistir.disabled = true;
    btnAsistir.textContent = "Inscripto";

    if (btnCancelar) {
      btnCancelar.style.display = "inline-block";
      btnCancelar.disabled = false;
      btnCancelar.onclick = () => {
        if (confirmMsg)
          confirmMsg.textContent = `¿Cancelar tu inscripción a "${c.nombre}"?`;
        confirmDlg.style.display = "flex";

        confirmYes.onclick = async () => {
          try {
            const res = await fetch(
              `${API_BASE_URL}/api/donantes/campanias/${c.id}/asistir`,
              {
                method: "DELETE",
                headers: { Authorization: "Bearer " + token },
              }
            );
            if (!res.ok) throw new Error(await res.text());
            showToast("Inscripción cancelada", "success");
            confirmDlg.style.display = "none";
            modal.style.display = "none";
            // Vuelvo a cargar todo el panel para refrescar los datos
            await cargarPanel();
          } catch (er) {
            appLogger.error("Error al cancelar inscripción:", er);
            showToast("No se pudo cancelar la inscripción", "error");
          }
        };

        confirmNo.onclick = () => {
          confirmDlg.style.display = "none";
        };
      };
    }
  } else {
    btnAsistir.disabled = !c.inscribible;
    btnAsistir.textContent = "ASISTIR";
    if (btnCancelar) {
      btnCancelar.style.display = "none";
      btnCancelar.onclick = null;
    }
  }

  modal.style.display = "flex";
}

// Acción de inscripción a una campaña desde el modal
btnAsistir?.addEventListener("click", async () => {
  if (!campaniaSeleccionada) return;
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/donantes/campanias/${campaniaSeleccionada.id}/asistir`,
      {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      }
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || "Error al inscribirse");
    }
    alert("Inscripción registrada. ¡Gracias por participar!");
    modal.style.display = "none";

    // Vuelvo a cargar todo el panel para refrescar los datos
    await cargarPanel();
  } catch (err) {
    appLogger.error("Error al inscribirse:", err);
    showToast("No se pudo registrar tu asistencia", "error");
  }
});

/**
 * ---------------------------------------------------------------------------
 * Mis campañas (inscripciones del donante)
 * ---------------------------------------------------------------------------
 * Renderiza una sección adicional con las campañas a las que el donante
 * ya está inscripto, permitiendo abrir el modal con su detalle.
 */

function ensureMisCampaniasContainer() {
  if (document.getElementById("misCampaniasList"))
    return document.getElementById("misCampaniasList");

  const section = document.querySelector(".dashboard-campanias");
  if (!section) return null;

  const hr = document.createElement("hr");
  const h2 = document.createElement("h2");
  h2.textContent = "Mis campañas";

  const div = document.createElement("div");
  div.className = "campanias-list";
  div.id = "misCampaniasList";

  section.appendChild(hr);
  section.appendChild(h2);
  section.appendChild(div);
  return div;
}

async function cargarMisCampanias(tok) {
  try {
    const listEl = ensureMisCampaniasContainer();
    if (!listEl) return;

    const res = await fetch(`${API_BASE_URL}/api/donantes/inscripciones`, {
      headers: { Authorization: "Bearer " + tok },
    });
    if (!res.ok) throw new Error("Error al obtener mis inscripciones");
    const data = await res.json();
    renderMisCampanias(data || [], listEl);
  } catch (e) {
    appLogger.error("Error al cargar mis campañas:", e);
  }
}

/**
 * Renderiza la lista de campañas donde el donante ya está inscripto.
 */
function renderMisCampanias(campanias, container) {
  if (!container) return;

  if (!campanias || campanias.length === 0) {
    container.innerHTML = "<em>Todavía no te inscribiste a campañas.</em>";
    return;
  }

  container.innerHTML = "";
  campanias.forEach((c) => {
    const card = document.createElement("div");
    card.className = "campania-card";

    const img = document.createElement("img");
    img.src = c.imagen_url || "https://placehold.co/64x64/EEE/AAA?text=Img";
    img.alt = c.nombre || "Campaña";

    const info = document.createElement("div");
    info.className = "campania-info";

    const strong = document.createElement("strong");
    strong.textContent = c.nombre || "Campaña";

    const p = document.createElement("p");
    const fecha = c.fecha_inicio
      ? new Date(c.fecha_inicio).toLocaleDateString()
      : "";
    p.textContent = fecha
      ? `Te inscribiste. Fecha de inicio: ${fecha}`
      : "Te inscribiste.";

    const btn = document.createElement("button");
    btn.textContent = "Ver";
    btn.className = "btn-secundario";
    btn.addEventListener("click", () =>
      abrirModalCampania({ ...c, ya_inscripto: true })
    );

    info.appendChild(strong);
    info.appendChild(p);
    info.appendChild(btn);

    card.appendChild(img);
    card.appendChild(info);
    container.appendChild(card);
  });
}

/**
 * ---------------------------------------------------------------------------
 * Próxima campaña inscripta (aside)
 * ---------------------------------------------------------------------------
 * Calcula, a partir de “mis inscripciones”, cuál es la campaña activa más
 * cercana o la próxima futura, y actualiza el panel lateral con acceso directo.
 */

async function cargarProximaInscripcion(campanias) {
  try {
    const today = new Date();
    const hoy = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const lista = (campanias || []).filter(c => c.ya_inscripto);

    const esActiva = (c) => {
      const fi = c.fecha_inicio ? new Date(c.fecha_inicio) : null;
      const ff = c.fecha_fin ? new Date(c.fecha_fin) : null;
      return fi && fi <= hoy && (!ff || ff >= hoy);
    };

    let prox = null;

    // Preferir campañas activas (ordenadas por fecha de inicio)
    const activas = lista.filter(esActiva);
    if (activas.length > 0) {
      prox = activas.sort(
        (a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
      )[0];
    } else {
      // Si no hay activas, usar la futura más próxima
      const futuras = lista.filter(
        (c) => c.fecha_inicio && new Date(c.fecha_inicio) > hoy
      );
      futuras.sort(
        (a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
      );
      prox = futuras[0] || null;
    }

    const span = proximasBox?.querySelector("span");
    if (prox && span && btnProxima) {
      const fecha = prox.fecha_inicio
        ? new Date(prox.fecha_inicio).toLocaleDateString()
        : "";
      span.textContent = `Tu próxima campaña: ${prox.nombre}${
        fecha ? " (" + fecha + ")" : ""
      }`;
      btnProxima.disabled = false;
      btnProxima.textContent = "Ver";
      btnProxima.onclick = () =>
        abrirModalCampania({ ...prox, ya_inscripto: true });
    } else if (span && btnProxima) {
      span.textContent = "Aún no te inscribiste a campañas próximas.";
      btnProxima.disabled = true;
      btnProxima.textContent = "Muy pronto!";
      btnProxima.onclick = null;
    }
  } catch (e) {
    appLogger.error("Error al calcular próxima campaña inscripta:", e);
  }
}

/**
 * ---------------------------------------------------------------------------
 * Notificaciones
 * ---------------------------------------------------------------------------
 * Carga y muestra notificaciones del donante, con soporte para marcar como
 * leídas y badge de cantidad no leída. Si una notificación está asociada a
 * una campaña, permite abrir su modal directamente.
 */

// Toggle del dropdown de notificaciones
btnNotif?.addEventListener("click", async (e) => {
  e.stopPropagation();
  const open = notifDropdown.style.display === "block";
  notifDropdown.style.display = open ? "none" : "block";
  if (!open) {
    await cargarNotificaciones();
  }
});

// Cierre del dropdown al hacer click fuera
document.addEventListener("click", (e) => {
  if (notifDropdown && notifDropdown.style.display === "block") {
    const within =
      notifDropdown.contains(e.target) || btnNotif.contains(e.target);
    if (!within) notifDropdown.style.display = "none";
  }
});

/**
 * Renderiza cada notificación:
 * - Muestra mensaje y fecha relativa (time-ago).
 * - Al click, marca como leída y, si tiene campaña asociada, abre su modal.
 */
function renderNotificaciones(lista) {
  notifList.innerHTML = "";
  actualizarBadgeNotificaciones(lista);

  if (!lista || lista.length === 0) {
    notifEmpty.style.display = "block";
    return;
  }
  notifEmpty.style.display = "none";

  lista.forEach((n) => {
    const li = document.createElement("li");
    li.className = "notif-item" + (!n.leida ? " unread" : "");

    const text = document.createElement("div");
    text.textContent =
      n.mensaje || (n.tipo ? n.tipo.replace("_", " ") : "Notificación");

    const meta = document.createElement("div");
    meta.style.fontSize = "0.78rem";
    meta.style.color = "#666";
    if (n.created_at) meta.textContent = timeAgo(n.created_at);

    li.addEventListener("click", async () => {
      try {
        await fetch(
          `${API_BASE_URL}/api/donantes/notificaciones/${n.id}/leida`,
          {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
          }
        );
        notifDropdown.style.display = "none";

        // Actualizar badge (decrementando en 1 si estaba no leída)
        if (notifBadge && notifBadge.style.display !== "none") {
          const current = parseInt(notifBadge.textContent || "0", 10) || 0;
          const next = Math.max(0, current - (n.leida ? 0 : 1));
          if (next > 0) {
            notifBadge.textContent = String(next);
          } else {
            notifBadge.style.display = "none";
          }
        }

        // Si la notificación refiere a una campaña, abrir su modal
        if (n.campania_id) {
          abrirModalCampania({
            id: n.campania_id,
            nombre: n.mensaje,
            ya_inscripto: true,
          });
        }
      } catch {
        // Silencioso: si falla marcar como leída, no rompe la UI.
      }
    });

    li.appendChild(text);
    if (meta.textContent) li.appendChild(meta);
    notifList.appendChild(li);
  });
}

/**
 * Actualiza el badge de notificaciones no leídas.
 */
function actualizarBadgeNotificaciones(lista) {
  try {
    const unread = (lista || []).filter((n) => !n.leida).length;
    if (unread > 0) {
      notifBadge.textContent = String(unread);
      notifBadge.style.display = "inline-block";
    } else {
      notifBadge.style.display = "none";
    }
  } catch {
    // Silencioso
  }
}

/**
 * ---------------------------------------------------------------------------
 * Utilidades de interfaz
 * ---------------------------------------------------------------------------
 * - showToast: notificaciones breves en pantalla.
 * - timeAgo: representación humana de fechas recientes.
 */

// Toast minimal (éxito/error/info)
function showToast(msg, type = "info") {
  let el = document.getElementById("toast-msg");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast-msg";
    el.style.position = "fixed";
    el.style.bottom = "20px";
    el.style.right = "20px";
    el.style.padding = "10px 14px";
    el.style.borderRadius = "8px";
    el.style.color = "#fff";
    el.style.fontSize = "0.95rem";
    el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.2)";
    el.style.zIndex = "1000";
    document.body.appendChild(el);
  }
  const colors = { success: "#198754", error: "#c1121f", info: "#0d6efd" };
  el.style.background = colors[type] || colors.info;
  el.textContent = msg;
  el.style.opacity = "1";
  el.style.transition = "opacity 0.4s ease";
  setTimeout(() => {
    el.style.opacity = "0";
  }, 2000);
}

// Formato de tiempo relativo (ej.: "hace 5 min", "ayer", o fecha/hora)
function timeAgo(dateInput) {
  try {
    const d = new Date(dateInput);
    const now = new Date();
    const diffMs = now - d;
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return "hace unos segundos";
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const dias = Math.floor(h / 24);
    if (dias === 1) return "ayer";
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return "";
  }
}
import { appLogger } from "../utils/logger.js";
