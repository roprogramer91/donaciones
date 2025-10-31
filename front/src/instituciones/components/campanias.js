// ============================================================
// COMPONENTE: GESTIÓN DE CAMPAÑAS
// Controla el CRUD (Crear, Leer, Actualizar, Eliminar) de campañas
// y la interfaz del modal de creación/edición.
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

const btnVerCampanias = document.getElementById("btn-ver-campanias");
const seccionCampanias = document.getElementById("seccion-campanias");

const modal = document.getElementById("modal-campania");
const cerrarModal = document.getElementById("cerrarModal");
const formCampania = document.getElementById("form-campania");

// ============================================================
// INICIALIZACIÓN
// ============================================================

export function inicializarCampanias() {
  if (!btnVerCampanias) return;

  btnVerCampanias.addEventListener("click", async () => {
    const visible = toggleSeccion("campanias");
    if (!visible) return;
    await cargarCampanias();
  });

  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "btn-nueva-campania") {
      abrirModalNuevaCampania();
    }
  });

  cerrarModal?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  formCampania?.addEventListener("submit", guardarCampania);
}

// ============================================================
// LISTADO DE CAMPAÑAS
// ============================================================

async function cargarCampanias() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/campanias`, {
      headers: authHeaders({ "X-Centro-Id": getCentroId() }),
    });

    if (!res.ok) throw new Error("No se pudieron obtener las campañas");

    const campanias = await res.json();
    renderCampanias(campanias);
  } catch (err) {
    console.error("Error al cargar campañas:", err);
    mostrarMensaje("Error al cargar campañas", "error");
  }
}

/**
 * Renderiza las campañas en la tabla principal.
 */
function renderCampanias(lista) {
  const tbody = document.querySelector("#tabla-campanias tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!Array.isArray(lista) || !lista.length) {
    tbody.innerHTML = `<tr><td colspan="5">No se encontraron campañas</td></tr>`;
    return;
  }

  lista.forEach((c) => {
    const tr = document.createElement("tr");
    tr.dataset.id = c.id;

    const fInicio = formatearFecha(c.fecha_inicio);
    const fFin = formatearFecha(c.fecha_fin);

    tr.innerHTML = `
      <td>${c.nombre}</td>
      <td>${fInicio} a ${fFin}</td>
      <td>${c.localidad_nombre || c.localidad || "--"}</td>
      <td>${c.estado_calculado ?? c.estado ?? "--"}</td>
      <td class="acciones">
        <button class="btn-editar" data-id="${c.id}" title="Editar">✏️</button>
        <button class="btn-eliminar" data-id="${c.id}" title="Eliminar">🗑️</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Asignar eventos
  tbody.querySelectorAll(".btn-editar").forEach((btn) =>
    btn.addEventListener("click", (e) => editarCampania(e.target.dataset.id))
  );
  tbody.querySelectorAll(".btn-eliminar").forEach((btn) =>
    btn.addEventListener("click", (e) => eliminarCampania(e.target.dataset.id))
  );
}

// ============================================================
// MODAL NUEVA / EDITAR CAMPAÑA
// ============================================================

async function abrirModalNuevaCampania() {
  modal.style.display = "flex";
  formCampania.reset();
  delete formCampania.dataset.editId;
  await cargarUbicaciones();
}

/**
 * Carga provincias, localidades y barrios para los selects.
 */
async function cargarUbicaciones() {
  try {
    const [resProv, resBarr] = await Promise.all([
      fetch(`${API_BASE_URL}/api/provincias`),
      fetch(`${API_BASE_URL}/api/barrios`),
    ]);

    const provincias = await resProv.json();
    const barrios = await resBarr.json();

    const selectProvincia = document.getElementById("provincia_id");
    const selectLocalidad = document.getElementById("localidad_id");
    const selectBarrio = document.getElementById("barrio_id");

    selectProvincia.innerHTML = '<option value="">Seleccionar provincia...</option>';
    selectLocalidad.innerHTML = '<option value="">Seleccionar localidad...</option>';
    selectBarrio.innerHTML = '<option value="">Seleccionar barrio...</option>';
    selectLocalidad.disabled = true;

    provincias.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nombre;
      selectProvincia.appendChild(opt);
    });

    const nombresVistos = new Set();
    barrios.forEach((b) => {
      const nombre = (b.nombre || "").toLowerCase();
      if (!nombresVistos.has(nombre)) {
        nombresVistos.add(nombre);
        const opt = document.createElement("option");
        opt.value = b.id;
        opt.textContent = b.nombre;
        selectBarrio.appendChild(opt);
      }
    });

    selectProvincia.addEventListener("change", async () => {
      const provId = selectProvincia.value;
      selectLocalidad.innerHTML = '<option value="">Seleccionar localidad...</option>';
      selectLocalidad.disabled = true;
      if (!provId) return;

      try {
        const resLoc = await fetch(`${API_BASE_URL}/api/localidades?provincia_id=${provId}`);
        const localidades = await resLoc.json();
        localidades.forEach((l) => {
          const opt = document.createElement("option");
          opt.value = l.id;
          opt.textContent = l.nombre;
          selectLocalidad.appendChild(opt);
        });
        selectLocalidad.disabled = false;
      } catch (error) {
        console.error("Error al cargar localidades:", error);
      }
    });
  } catch (error) {
    console.error("Error cargando ubicaciones:", error);
  }
}

// ============================================================
// GUARDAR (CREAR / EDITAR) CAMPAÑA
// ============================================================

async function guardarCampania(e) {
  e.preventDefault();

  const editId = formCampania.dataset.editId || null;
  const payload = obtenerDatosFormulario();

  if (!validarCampos(payload)) return;

  try {
    const method = editId ? "PUT" : "POST";
    const url = editId
      ? `${API_BASE_URL}/api/campanias/${editId}`
      : `${API_BASE_URL}/api/campanias`;

    const res = await fetch(url, {
      method,
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Error al guardar la campaña");

    mostrarMensaje(
      editId ? "Campaña actualizada correctamente" : "Campaña creada con éxito",
      "success"
    );

    modal.style.display = "none";
    formCampania.reset();
    delete formCampania.dataset.editId;

    await cargarCampanias();
  } catch (error) {
    console.error(error);
    mostrarMensaje("Error al guardar la campaña", "error");
  }
}

/**
 * Toma los valores del formulario y arma el objeto a enviar.
 */
function obtenerDatosFormulario() {
  return {
    centro_id: getCentroId(),
    nombre: document.getElementById("nombre").value.trim(),
    descripcion: document.getElementById("descripcion").value.trim(),
    imagen_url: document.getElementById("imagen_url").value.trim(),
    provincia_id: parseInt(document.getElementById("provincia_id").value),
    localidad_id: parseInt(document.getElementById("localidad_id").value),
    barrio_id: parseInt(document.getElementById("barrio_id").value),
    fecha_inicio: document.getElementById("fecha_inicio").value,
    fecha_fin: document.getElementById("fecha_fin").value,
  };
}

/**
 * Valida campos obligatorios y fechas coherentes.
 */
function validarCampos(data) {
  if (
    !data.nombre ||
    !data.descripcion ||
    !data.fecha_inicio ||
    !data.fecha_fin ||
    !data.provincia_id ||
    !data.localidad_id ||
    !data.barrio_id
  ) {
    mostrarMensaje("Por favor, completa todos los campos obligatorios", "error");
    return false;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (new Date(data.fecha_inicio) < hoy) {
    mostrarMensaje("La fecha de inicio no puede ser anterior a hoy", "error");
    return false;
  }

  if (new Date(data.fecha_fin) < new Date(data.fecha_inicio)) {
    mostrarMensaje(
      "La fecha de fin no puede ser anterior a la de inicio",
      "error"
    );
    return false;
  }

  return true;
}

// ============================================================
// EDITAR Y ELIMINAR
// ============================================================

async function editarCampania(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/campanias/${id}`, {
      headers: authHeaders(),
    });

    const campania = await res.json();
    await cargarUbicaciones();

    formCampania.dataset.editId = id;
    document.getElementById("nombre").value = campania.nombre || "";
    document.getElementById("descripcion").value = campania.descripcion || "";
    document.getElementById("imagen_url").value = campania.imagen_url || "";
    document.getElementById("provincia_id").value = campania.provincia_id || "";
    document.getElementById("localidad_id").value = campania.localidad_id || "";
    document.getElementById("barrio_id").value = campania.barrio_id || "";
    document.getElementById("fecha_inicio").value =
      (campania.fecha_inicio || "").split("T")[0] || "";
    document.getElementById("fecha_fin").value =
      (campania.fecha_fin || "").split("T")[0] || "";

    modal.style.display = "flex";
  } catch (error) {
    console.error("Error al cargar campaña para editar:", error);
    mostrarMensaje("No se pudo cargar la campaña", "error");
  }
}

async function eliminarCampania(id) {
  const confirmar = confirm("¿Seguro que deseas eliminar esta campaña?");
  if (!confirmar) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/campanias/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) throw new Error("Error al eliminar campaña");
    mostrarMensaje("Campaña eliminada correctamente", "success");
    await cargarCampanias();
  } catch (error) {
    console.error(error);
    mostrarMensaje("No se pudo eliminar la campaña", "error");
  }
}

// ============================================================
// UTILIDAD LOCAL: FORMATEAR FECHA
// ============================================================

function formatearFecha(f) {
  if (!f) return "--";
  try {
    const d = new Date(f);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return "--";
  }
}
