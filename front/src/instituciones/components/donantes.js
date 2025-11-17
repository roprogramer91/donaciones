// ============================================================
// COMPONENTE: DONANTES REGISTRADOS
// Controla la carga, filtrado y exportación de donantes
// para el panel del Centro de Hemoterapia.
// ============================================================

import { API_BASE_URL } from "../../utils/config.js";
import { toggleSeccion } from "../dashboard-centro.js";
import { appLogger } from "../../utils/logger.js";

// ============================================================
// VARIABLES Y ELEMENTOS BASE
// ============================================================

const btnVerDonantes = document.getElementById("btn-ver-donantes");
const seccionDonantes = document.getElementById("seccion-donantes");
const tablaBody = document.querySelector("#tabla-donantes tbody");

const filtroGrupo = document.getElementById("filtro-grupo");
const filtroProvincia = document.getElementById("filtro-provincia");
const filtroLocalidad = document.getElementById("filtro-localidad");
const filtroBarrio = document.getElementById("filtro-barrio");
const filtroApto = document.getElementById("filtro-apto");
const filtroEdadMin = document.getElementById("filtro-edad-min");
const filtroEdadMax = document.getElementById("filtro-edad-max");
const filtroDiasRestMax = document.getElementById("filtro-dias-rest-max");

const btnFiltro = document.getElementById("btn-aplicar-filtro");
const btnLimpiarFiltro = document.getElementById("btn-limpiar-filtro");
const btnExportarCSV = document.getElementById("btn-exportar-csv");
const conteoDonantes = document.getElementById("conteo-donantes");

let ultimoResultadoDonantes = [];

// ============================================================
// INICIALIZACIÓN DEL MÓDULO
// ============================================================

export function inicializarDonantes() {
  if (!btnVerDonantes) return;

  btnVerDonantes.addEventListener("click", async () => {
    const visible = toggleSeccion("donantes");
    if (!visible) return;
    await inicializarFiltrosDonantes();
    await cargarDonantes();
  });

  btnFiltro?.addEventListener("click", cargarDonantes);
  btnLimpiarFiltro?.addEventListener("click", limpiarFiltros);
}

// ============================================================
// PLEGABLE DE NOTIFICACIONES
// ============================================================
const toggleNotif = document.getElementById("toggle-notif");
const notifPanel = document.getElementById("notif-panel");

if (toggleNotif && notifPanel) {
  toggleNotif.addEventListener("click", () => {
    notifPanel.classList.toggle("oculto");
    toggleNotif.classList.toggle("activo");
  });
}

// Inicializamos módulo de notificaciones solo cuando se abra
import("./notificaciones.js").then((mod) => {
  if (mod?.inicializarNotificaciones) mod.inicializarNotificaciones();
});

// ============================================================
// CARGA DE DONANTES CON FILTROS
// ============================================================
async function cargarDonantes() {
  try {
    const params = construirParametros();
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_BASE_URL}/api/donantes/filtro?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ solo token
        },
      }
    );

    if (!res.ok) throw new Error("Error al obtener donantes");
    const data = await res.json();

    ultimoResultadoDonantes = Array.isArray(data) ? data : [];
    actualizarConteoYExport();
    renderDonantes(data);
  } catch (err) {
    appLogger.error("❌ Error al cargar donantes:", err);
    tablaBody.innerHTML = `<tr><td colspan="8">Error al cargar donantes</td></tr>`;
    mostrarMensaje("Error al cargar donantes", "error");
  }
}

/**
 * Construye los parámetros de búsqueda desde los filtros activos.
 */
function construirParametros() {
  const params = new URLSearchParams();

  const addParam = (key, value) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value);
    }
  };

  addParam("grupo", filtroGrupo?.value);
  addParam("provincia", filtroProvincia?.value);
  addParam("localidad", filtroLocalidad?.value);
  addParam("barrio", filtroBarrio?.value);
  if (filtroApto?.checked) addParam("apto", "true");

  const eMin = parseInt(filtroEdadMin?.value || "");
  const eMax = parseInt(filtroEdadMax?.value || "");
  const drm = parseInt(filtroDiasRestMax?.value || "");
  if (!isNaN(eMin)) addParam("edad_min", eMin);
  if (!isNaN(eMax)) addParam("edad_max", eMax);
  if (!isNaN(drm)) addParam("dias_restantes_max", drm);

  return params;
}

// ============================================================
// FILTROS (Provincias, Localidades, Barrios)
// ============================================================

async function inicializarFiltrosDonantes() {
  try {
    // --- Provincias ---
    if (filtroProvincia && filtroProvincia.options.length <= 1) {
      const resP = await fetch(`${API_BASE_URL}/api/provincias`);
      const provincias = await resP.json();
      filtroProvincia.innerHTML =
        '<option value="">Todas las provincias</option>';
      provincias.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.nombre;
        filtroProvincia.appendChild(opt);
      });
    }

    // --- Barrios ---
    if (filtroBarrio && filtroBarrio.options.length <= 1) {
      const resB = await fetch(`${API_BASE_URL}/api/barrios`);
      const barrios = await resB.json();
      filtroBarrio.innerHTML = '<option value="">Todos los barrios</option>';
      const vistos = new Set();
      barrios.forEach((b) => {
        const nombre = (b.nombre || "").toLowerCase();
        if (vistos.has(nombre)) return;
        vistos.add(nombre);
        const opt = document.createElement("option");
        opt.value = b.id;
        opt.textContent = b.nombre;
        filtroBarrio.appendChild(opt);
      });
    }

    // --- Localidades dependientes de provincia ---
    filtroProvincia?.addEventListener("change", async () => {
      const provId = filtroProvincia.value;
      filtroLocalidad.innerHTML =
        '<option value="">Todas las localidades</option>';
      filtroLocalidad.disabled = true;
      if (!provId) return;
      const resL = await fetch(
        `${API_BASE_URL}/api/localidades?provincia_id=${provId}`
      );
      const localidades = await resL.json();
      localidades.forEach((l) => {
        const opt = document.createElement("option");
        opt.value = l.id;
        opt.textContent = l.nombre;
        filtroLocalidad.appendChild(opt);
      });
      filtroLocalidad.disabled = false;
    });
  } catch (e) {
    appLogger.error("Error inicializando filtros de donantes:", e);
  }
}

// ============================================================
// LIMPIAR FILTROS Y RECARGAR TABLA
// ============================================================

async function limpiarFiltros() {
  if (filtroGrupo) filtroGrupo.value = "";
  if (filtroProvincia) filtroProvincia.value = "";
  if (filtroLocalidad) {
    filtroLocalidad.innerHTML =
      '<option value="">Todas las localidades</option>';
    filtroLocalidad.disabled = true;
  }
  if (filtroBarrio) filtroBarrio.value = "";
  if (filtroApto) filtroApto.checked = false;
  if (filtroEdadMin) filtroEdadMin.value = "";
  if (filtroEdadMax) filtroEdadMax.value = "";
  if (filtroDiasRestMax) filtroDiasRestMax.value = "";

  await cargarDonantes();
}

// ============================================================
// TABLA DE RESULTADOS Y EXPORTACIÓN
// ============================================================

function actualizarConteoYExport() {
  const n = ultimoResultadoDonantes.length;
  if (conteoDonantes)
    conteoDonantes.textContent = `${n} ${n === 1 ? "resultado" : "resultados"}`;

  if (btnExportarCSV) {
    btnExportarCSV.disabled = !n;
    btnExportarCSV.onclick = exportarCSVDonantes;
  }
}

function renderDonantes(donantes) {
  tablaBody.innerHTML = "";

  if (!donantes || !donantes.length) {
    tablaBody.innerHTML = `<tr><td colspan="8">No se encontraron donantes</td></tr>`;
    return;
  }

  donantes.forEach((d) => {
    const tr = document.createElement("tr");
    const nombreCompleto = `${d.nombre || ""} ${d.apellido || ""}`.trim();
    const insc = d.inscripto_en_campania || !!d.campania_inscripta;

    tr.innerHTML = `
      <td>${nombreCompleto}</td>
      <td>${d.grupo_sanguineo || ""}</td>
      <td>${d.provincia_nombre || ""}</td>
      <td>${d.localidad_nombre || ""}</td>
      <td>${d.telefono || ""}</td>
      <td>${
        insc
          ? `<a href="#" class="link-inscripciones" data-uid="${
              d.usuario_id
            }" data-nombre="${nombreCompleto.replace(
              /"/g,
              "&quot;"
            )}">Inscripto</a>`
          : "Ninguna"
      }</td>
      <td>${d.apto_para_donar ? "Sí" : "No"}</td>
      <td>${d.dias_restantes ?? ""}</td>
    `;

    // Enlace para abrir modal de inscripciones
    const link = tr.querySelector(".link-inscripciones");
    if (link) {
      link.addEventListener("click", (ev) => {
        ev.preventDefault();
        abrirModalInscripciones(
          link.dataset.uid,
          link.dataset.nombre || "Donante"
        );
      });
    }

    tablaBody.appendChild(tr);
  });
}

/**
 * Genera un archivo CSV con los donantes filtrados.
 */
function exportarCSVDonantes() {
  if (!ultimoResultadoDonantes.length) return;

  const headers = [
    "Nombre",
    "Grupo",
    "Provincia",
    "Localidad",
    "Teléfono",
    "Campaña",
    "Apto",
    "Días restantes",
    "Email",
  ];

  const rows = ultimoResultadoDonantes.map((d) => [
    `${d.nombre || ""} ${d.apellido || ""}`.trim(),
    d.grupo_sanguineo || "",
    d.provincia_nombre || "",
    d.localidad_nombre || "",
    d.telefono || "",
    d.inscripto_en_campania ? "Inscripto" : "Ninguna",
    d.apto_para_donar ? "Sí" : "No",
    d.dias_restantes ?? "",
    d.email || "",
  ]);

  const escape = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const now = new Date();
  a.download = `donantes_${now.toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ==========================================================
   PAGINACIÓN Y BÚSQUEDA LOCAL
========================================================== */
let paginaActual = 1;
const donantesPorPagina = 6;

function renderDonantesPaginados() {
  const inicio = (paginaActual - 1) * donantesPorPagina;
  const fin = inicio + donantesPorPagina;
  const pagina = ultimoResultadoDonantes.slice(inicio, fin);

  renderDonantes(pagina);

  const totalPaginas = Math.ceil(
    ultimoResultadoDonantes.length / donantesPorPagina
  );
  document.getElementById(
    "paginacion-info"
  ).textContent = `Página ${paginaActual} de ${totalPaginas || 1}`;

  document.getElementById("btn-prev").disabled = paginaActual === 1;
  document.getElementById("btn-next").disabled = paginaActual >= totalPaginas;
}

document.getElementById("btn-prev")?.addEventListener("click", () => {
  if (paginaActual > 1) {
    paginaActual--;
    renderDonantesPaginados();
  }
});

document.getElementById("btn-next")?.addEventListener("click", () => {
  const totalPaginas = Math.ceil(
    ultimoResultadoDonantes.length / donantesPorPagina
  );
  if (paginaActual < totalPaginas) {
    paginaActual++;
    renderDonantesPaginados();
  }
});

/* ==========================================================
   BÚSQUEDA LOCAL POR NOMBRE O EMAIL
========================================================== */
document.getElementById("filtro-busqueda")?.addEventListener("input", (e) => {
  const texto = e.target.value.toLowerCase().trim();
  if (!texto) {
    renderDonantesPaginados();
    return;
  }

  const filtrados = ultimoResultadoDonantes.filter(
    (d) =>
      (d.nombre && d.nombre.toLowerCase().includes(texto)) ||
      (d.apellido && d.apellido.toLowerCase().includes(texto)) ||
      (d.email && d.email.toLowerCase().includes(texto))
  );

  renderDonantes(filtrados);
  document.getElementById("paginacion-info").textContent = "Filtrado local";
});

// ============================================================
// Función pública para obtener los donantes filtrados actuales
// ============================================================
export function obtenerUltimoResultadoDonantes() {
  return ultimoResultadoDonantes || [];
}
