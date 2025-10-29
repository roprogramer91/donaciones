import { API_BASE_URL } from "../config.js";

const estadoApto = document.getElementById("estado-apto");

// Elementos
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

    const donante = await res.json();
    console.log(donante); //SOLO PARA DEBUGGING

    // Mostrar estado de aptitud
    let dias = donante.dias_restantes;
    if (dias !== undefined && dias !== null) {
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

    // Mostrar saludo
    bienvenida.textContent = `Hola, ${donante.nombre || "Donante"}!`;
    // Mostrar datos principales
    grupoSangre.textContent = donante.grupo_sanguineo || "--";
    ultimaDonacion.textContent = donante.fecha_ultima_donacion
      ? new Date(donante.fecha_ultima_donacion).toLocaleDateString()
      : "--/--/----";
    diasApto.textContent = donante.dias_restantes !== undefined;
    diasApto.textContent =
      donante.dias_restantes !== undefined
        ? `${donante.dias_restantes} días`
        : "-- días";

    // Cargar campañas por localidad y mis inscripciones
    await cargarCampanias(token);
    await cargarNotificaciones();
    await cargarProximaInscripcion(token);
    loader.style.display = "none";
    contenidoPrivado.style.display = "block";
  } catch (e) {
    console.error(
      "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Error detallado en cargarPanel():",
      e
    );

    loader.innerHTML = `
    <p style="color:red;">
      Error al cargar datos.<br>
      <strong>Detalles:</strong> ${e.message || "Error desconocido"}<br>
      Revisa la consola para mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s informaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n.
    </p>`;
  }
}

// BotÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de perfil
document.getElementById("btn-perfil").addEventListener("click", () => {
  window.location.href = "perfil-donante.html";
});

// BotÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../../index.html";
});

cargarPanel();

// ---------------- CampaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±as disponibles -----------------
const campaniasList = document.getElementById("campaniasList");
const modal = document.getElementById("modalCampania");
const btnCerrarModal = document.getElementById("btnCerrarModal");
const btnAsistir = document.getElementById("btnAsistir");
const btnCancelar = document.getElementById("btnCancelar");
const confirmDlg = document.getElementById("confirmCancel");
const confirmMsg = document.getElementById("confirmCancelMsg");
const confirmYes = document.getElementById("btnCancelYes");
const confirmNo = document.getElementById("btnCancelNo");
let campaniaSeleccionada = null;
let proximaSeleccionada = null;

btnCerrarModal?.addEventListener("click", () => {
  modal.style.display = "none";
  campaniaSeleccionada = null;
});

async function cargarCampanias(tok) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/campanias`, {
      headers: { Authorization: "Bearer " + tok },
    });
    if (!res.ok)
      throw new Error(
        "Error al obtener campaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±as"
      );
    const data = await res.json();
    const lista = data.campanias || [];
    renderCampanias(lista);
  } catch (err) {
    console.error(
      "Error al cargar campaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±as:",
      err
    );
    if (campaniasList)
      campaniasList.innerHTML =
        "<em>No se pudieron cargar las campaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±as</em>";
  }
}

function renderCampanias(campanias) {
  if (!campaniasList) return;
  const items = (campanias || []).slice();
  // Orden: inscripto primero, luego activas, luego futuras por fecha
  const rankEstado = (s) => (s === "activa" ? 0 : s === "futura" ? 1 : 2);
  items.sort((a, b) => {
    const ra = a.ya_inscripto ? 0 : 1;
    const rb = b.ya_inscripto ? 0 : 1;
    if (ra !== rb) return ra - rb;
    const ea = rankEstado(a.estado_calculado),
      eb = rankEstado(b.estado_calculado);
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
      "<em>No hay campaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±as activas o futuras cerca.</em>";
    return;
  }
  campaniasList.innerHTML = "";
  items.forEach((c) => {
    const card = document.createElement("div");
    card.className = "campania-card";
    const img = document.createElement("img");
    img.src = c.imagen_url || "https://placehold.co/64x64/EEE/AAA?text=Img";
    img.alt = c.nombre || "CampaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±a";
    const info = document.createElement("div");
    info.className = "campania-info";
    const strong = document.createElement("strong");
    strong.textContent =
      c.nombre || "CampaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±a";
    const p = document.createElement("p");
    p.textContent = c.descripcion || "";
    const tag = document.createElement("span");
    tag.style.cssText =
      "display:inline-block;margin-top:4px;margin-right:6px;padding:2px 8px;border-radius:10px;font-size:0.78rem;background:#eee;color:#555;";
    if (c.estado_calculado === "activa") {
      tag.textContent = "Activa";
      tag.style.background = "#d4f5d7";
      tag.style.color = "#1b7e20";
    } else if (c.estado_calculado === "futura") {
      const dias =
        typeof c.dias_para_inicio === "number" && c.dias_para_inicio > 0
          ? ` (en ${c.dias_para_inicio} dias)`
          : "";
      tag.textContent = "Proxima" + dias;
      tag.style.background = "#e7f0ff";
      tag.style.color = "#0a58ca";
    }

    const tagIns = document.createElement("span");
    tagIns.style.cssText =
      "display:inline-block;margin-top:4px;padding:2px 8px;border-radius:10px;font-size:0.78rem;";
    if (c.ya_inscripto) {
      tagIns.textContent = "Inscripto";
      tagIns.style.background = "#d4f5d7";
      tagIns.style.color = "#1b7e20";
    } else {
      tagIns.textContent = "No inscripto";
      tagIns.style.background = "#fff3cd";
      tagIns.style.color = "#946200";
    }
    const btn = document.createElement("button");
    btn.textContent = "Ver";
    btn.className = "btn-secundario";
    btn.addEventListener("click", () => abrirModalCampania(c));
    info.appendChild(strong);
    info.appendChild(p);
    info.appendChild(tag);
    info.appendChild(tagIns);
    info.appendChild(btn);
    card.appendChild(img);
    card.appendChild(info);
    campaniasList.appendChild(card);
  });
}

function abrirModalCampania(c) {
  campaniaSeleccionada = c;
  document.getElementById("modalTitulo").textContent =
    c.nombre || "CampaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±a";
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
          confirmMsg.textContent = `ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿Cancelar tu inscripciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n a "${c.nombre}"?`;
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
            showToast("InscripciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n cancelada", "success");
            confirmDlg.style.display = "none";
            modal.style.display = "none";
            await cargarCampanias(token);
            await cargarNotificaciones();
            await cargarProximaInscripcion(token);
          } catch (er) {
            console.error(
              "Error al cancelar inscripciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:",
              er
            );
            showToast(
              "No se pudo cancelar la inscripciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n",
              "error"
            );
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
    alert(
      "InscripciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n registrada. ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Gracias por participar!"
    );
    modal.style.display = "none";
    // refrescar listados y proxima
    await cargarCampanias(token);
    await cargarNotificaciones();
    await cargarProximaInscripcion(token);
  } catch (err) {
    console.error("Error al inscribirse:", err);
    showToast("No se pudo registrar tu asistencia", "error");
  }
});

// -------- Mis CampaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±as (inscripciones del donante) ---------
function ensureMisCampaniasContainer() {
  if (document.getElementById("misCampaniasList"))
    return document.getElementById("misCampaniasList");
  const section = document.querySelector(".dashboard-campanias");
  if (!section) return null;
  const hr = document.createElement("hr");
  const h2 = document.createElement("h2");
  h2.textContent = "Mis campaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±as";
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
    console.error(
      "Error al cargar mis campaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±as:",
      e
    );
  }
}

function renderMisCampanias(campanias, container) {
  if (!container) return;
  if (!campanias || campanias.length === 0) {
    container.innerHTML =
      "<em>TodavÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a no te inscribiste a campaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±as.</em>";
    return;
  }
  container.innerHTML = "";
  campanias.forEach((c) => {
    const card = document.createElement("div");
    card.className = "campania-card";
    const img = document.createElement("img");
    img.src = c.imagen_url || "https://placehold.co/64x64/EEE/AAA?text=Img";
    img.alt = c.nombre || "CampaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±a";
    const info = document.createElement("div");
    info.className = "campania-info";
    const strong = document.createElement("strong");
    strong.textContent =
      c.nombre || "CampaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±a";
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

// -------- PrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³xima campaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±a inscripta (aside) ---------
async function cargarProximaInscripcion(tok) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/inscripciones`, {
      headers: { Authorization: "Bearer " + tok },
    });
    if (!res.ok) throw new Error("Error al obtener mis inscripciones");
    const data = await res.json();
    const lista = Array.isArray(data) ? data : [];

    const today = new Date();
    const hoy = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const esActiva = (c) => {
      const fi = c.fecha_inicio ? new Date(c.fecha_inicio) : null;
      const ff = c.fecha_fin ? new Date(c.fecha_fin) : null;
      return fi && fi <= hoy && (!ff || ff >= hoy);
    };

    let prox = null;
    const activas = lista.filter(esActiva);
    if (activas.length > 0) {
      prox = activas.sort(
        (a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
      )[0];
    } else {
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
      span.textContent = `Tu prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³xima campaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±a: ${
        prox.nombre
      }${fecha ? " (" + fecha + ")" : ""}`;
      btnProxima.disabled = false;
      btnProxima.textContent = "Ver";
      btnProxima.onclick = () =>
        abrirModalCampania({ ...prox, ya_inscripto: true });
    } else if (span && btnProxima) {
      span.textContent =
        "AÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºn no te inscribiste a campaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±as prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ximas.";
      btnProxima.disabled = true;
      btnProxima.textContent = "Muy pronto!";
      btnProxima.onclick = null;
    }
  } catch (e) {
    console.error(
      "Error al calcular prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³xima campaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±a inscripta:",
      e
    );
  }
}

// Toast minimal
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

// ----- Notificaciones ------
btnNotif?.addEventListener("click", async (e) => {
  e.stopPropagation();
  const open = notifDropdown.style.display === "block";
  notifDropdown.style.display = open ? "none" : "block";
  if (!open) {
    await cargarNotificaciones();
  }
});

document.addEventListener("click", (e) => {
  if (notifDropdown && notifDropdown.style.display === "block") {
    const within =
      notifDropdown.contains(e.target) || btnNotif.contains(e.target);
    if (!within) notifDropdown.style.display = "none";
  }
});

async function cargarNotificaciones() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/notificaciones`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error("No se pudieron cargar notificaciones");
    const lista = await res.json();
    renderNotificaciones(lista);
    actualizarBadgeNotificaciones(lista);
  } catch (err) {
    console.error("Error al cargar notificaciones:", err);
  }
}

function renderNotificaciones(lista) {
  notifList.innerHTML = "";
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
      n.mensaje || (n.tipo ? n.tipo.replace("_", " ") : "NotificaciÃƒÂ³n");
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
        // Actualizar badge
        if (notifBadge && notifBadge.style.display !== "none") {
          const current = parseInt(notifBadge.textContent || "0", 10) || 0;
          const next = Math.max(0, current - (n.leida ? 0 : 1));
          if (next > 0) {
            notifBadge.textContent = String(next);
          } else {
            notifBadge.style.display = "none";
          }
        }
        if (n.campania_id) {
          // abre modal si hay campaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±a asociada
          abrirModalCampania({
            id: n.campania_id,
            nombre: n.mensaje,
            ya_inscripto: true,
          });
        }
      } catch {}
    });
    li.appendChild(text);
    if (meta.textContent) li.appendChild(meta);
    notifList.appendChild(li);
  });
}

function actualizarBadgeNotificaciones(lista) {
  try {
    const unread = (lista || []).filter((n) => !n.leida).length;
    if (unread > 0) {
      notifBadge.textContent = String(unread);
      notifBadge.style.display = "inline-block";
    } else {
      notifBadge.style.display = "none";
    }
  } catch {}
}

// timeago simple
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
