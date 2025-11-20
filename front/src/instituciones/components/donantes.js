// ============================================================
// COMPONENTE: DONANTES REGISTRADOS
// Controla la carga, filtrado y exportación de donantes
// para el panel del Centro de Hemoterapia.
// ============================================================

import { API_BASE_URL } from "../../utils/config.js";
import { toggleSeccion } from "../dashboard-centro.js";
import { abrirModalInscripciones } from "./modales/modalInscripciones.js";
import { mostrarPopup } from "./popup.js";
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
          Authorization: `Bearer ${token}`, //  solo token
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
    mostrarPopup("Error al cargar donantes", "error");
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
  if (filtroBarrio?.value) {
    const barrioVal = filtroBarrio.value;
    if (barrioVal.includes(",")) {
      barrioVal
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .forEach((id) => params.append("barrio", id));
    } else {
      addParam("barrio", barrioVal);
    }
  }
  if (filtroApto?.checked) addParam("apto", "true");

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

    resetFiltroBarrio("Selecciona una localidad");
    // --- Localidades dependientes de provincia ---
    filtroProvincia?.addEventListener("change", async () => {
      const provId = filtroProvincia.value;
      filtroLocalidad.innerHTML =
        '<option value="">Todas las localidades</option>';
      filtroLocalidad.disabled = true;
      resetFiltroBarrio("Selecciona una localidad");
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

    filtroLocalidad?.addEventListener("change", async () => {
      const locId = filtroLocalidad.value;
      if (!locId) {
        resetFiltroBarrio("Selecciona una localidad");
        return;
      }
      await cargarBarriosFiltro(locId);
    });
  } catch (e) {
    appLogger.error("Error inicializando filtros de donantes:", e);
  }
}

function resetFiltroBarrio(mensaje = "Selecciona una localidad") {
  if (!filtroBarrio) return;
  filtroBarrio.innerHTML = `<option value="">${mensaje}</option>`;
  filtroBarrio.disabled = true;
}

async function cargarBarriosFiltro(localidadId) {
  if (!filtroBarrio) return;
  filtroBarrio.disabled = true;
  filtroBarrio.innerHTML = '<option value="">Cargando barrios...</option>';
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/barrios?localidad_id=${localidadId}`
    );
    const barrios = await res.json();
    if (!Array.isArray(barrios) || barrios.length === 0) {
      resetFiltroBarrio("Sin barrios para esta localidad");
      return;
    }
    filtroBarrio.innerHTML = '<option value="">Todos los barrios</option>';
    const grupos = new Map();
    barrios.forEach((b) => {
      const clave = (b.nombre || "").toLowerCase().trim();
      if (!grupos.has(clave)) {
        grupos.set(clave, { nombre: b.nombre, ids: [] });
      }
      grupos.get(clave).ids.push(b.id);
    });

    grupos.forEach(({ nombre, ids }) => {
      const opt = document.createElement("option");
      opt.value = ids.join(",");
      opt.textContent =
        ids.length > 1 ? `${nombre} (${ids.length})` : nombre;
      filtroBarrio.appendChild(opt);
    });
    filtroBarrio.disabled = false;
  } catch (error) {
    appLogger.error("Error cargando barrios para filtro:", error);
    resetFiltroBarrio("Error al cargar barrios");
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
  resetFiltroBarrio("Selecciona una localidad");
  if (filtroApto) filtroApto.checked = false;

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
    const insc = Boolean(d.campania_inscripta);

    tr.innerHTML = `
      <td>${nombreCompleto}</td>
      <td>${d.grupo_sanguineo || ""}</td>
      <td>${d.provincia_nombre || ""}</td>
      <td>${d.localidad_nombre || ""}</td>
      <td>${d.telefono || ""}</td>
      <td>${
        insc
          ? `<a href="#" class="link-inscripciones" data-usuario="${
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
        const usuario = link.dataset.usuario;
        if (usuario) {
          abrirModalInscripciones(
            usuario,
            link.dataset.nombre || "Donante"
          );
        }
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
const filtroBusqueda = document.getElementById("filtro-busqueda");
filtroBusqueda?.addEventListener("input", (e) => {
  const texto = e.target.value.toLowerCase().trim();
  if (!texto) {
    renderDonantesPaginados();
    document.getElementById("paginacion-info").textContent = "Paginaci�n";
    return;
  }

  const filtrados = ultimoResultadoDonantes.filter((d) =>
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
