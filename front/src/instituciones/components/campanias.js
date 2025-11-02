/* ==========================================================
   COMPONENTE: CAMPAÑAS
   Controla la carga, render y gestión de campañas del centro
=========================================================== */

import { API_BASE_URL } from "../../config.js";
import { abrirModal, cerrarModal } from "./modales/modalBase.js";
import { mostrarPopup } from "./popup.js";

/* === FUNCIÓN PRINCIPAL === */
export async function cargarCampanias() {
  const contenedor = document.getElementById("seccion-campanias");
  if (!contenedor) {
    console.error("⚠️ No se encontró #seccion-campanias en el DOM.");
    return;
  }

  contenedor.innerHTML = "<p>Cargando campañas...</p>";

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/campanias`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Error al obtener campañas");

    const data = await res.json();

    /* === GENERAR HTML DE TABLA === */
    const html = `
      <div class="campanias-header">
        <h2>Campañas registradas</h2>
        <button id="btnNuevaCampania">+ Nueva campaña</button>
      </div>

      <div class="tabla-container">
        <table class="tabla-datos">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Localidad</th>
              <th>Barrio</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (c) => `
              <tr>
                <td>${c.id}</td>
                <td>${c.nombre}</td>
                <td>${c.localidad_nombre || "-"}</td>
                <td>${c.barrio_nombre || "-"}</td>
                <td>${formatearFecha(c.fecha_inicio)}</td>
                <td>${formatearFecha(c.fecha_fin)}</td>
                <td>${c.estado || "-"}</td>
                <td>
                  <button class="btn-secundario btn-editar" data-id="${c.id}">Editar</button>
                  <button class="btn-peligro btn-eliminar" data-id="${c.id}" data-nombre="${c.nombre}">Eliminar</button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    contenedor.innerHTML = html;

    // === Asignar eventos ===
    document.getElementById("btnNuevaCampania")?.addEventListener("click", () => abrirModalCampania());

    document.querySelectorAll(".btn-editar").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        await abrirModalCampania(id);
      });
    });

    document.querySelectorAll(".btn-eliminar").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const nombre = btn.dataset.nombre;
        mostrarModalConfirmacionEliminar(id, nombre);
      });
    });
  } catch (error) {
    console.error("❌ Error al cargar campañas:", error);
    contenedor.innerHTML = `<p>Error al cargar campañas. Intente más tarde.</p>`;
  }
}

/* === UTILIDAD: FORMATEAR FECHA === */
function formatearFecha(fecha) {
  if (!fecha) return "-";
  const f = new Date(fecha);
  return f.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ==========================================================
   MODAL DE CAMPAÑA (CREAR O EDITAR)
=========================================================== */
async function abrirModalCampania(id = null) {
  const esEdicion = !!id;
  const titulo = esEdicion ? "Editar campaña" : "Nueva campaña";

  // 👉 antes de abrir el modal, marcamos el contenedor como grande
  const modalContent = document.getElementById("modal-content");
  modalContent.classList.add("large");

  abrirModal(`
    <h3>${titulo}</h3>
    <form id="formCampania" class="form-campania">
      <label>Nombre</label>
      <input type="text" id="nombre" name="nombre" required />

      <label>Descripción</label>
      <textarea id="descripcion" name="descripcion" rows="3" required></textarea>

      <label>URL de imagen</label>
      <input type="url" id="imagen_url" name="imagen_url" placeholder="https://..." required />

      <label>Provincia</label>
      <select id="provincia_id" name="provincia_id" required>
        <option value="">Seleccionar...</option>
      </select>

      <label>Localidad</label>
      <select id="localidad_id" name="localidad_id" disabled required>
        <option value="">Seleccionar...</option>
      </select>

      <label>Barrio</label>
      <select id="barrio_id" name="barrio_id" disabled required>
        <option value="">Seleccionar...</option>
      </select>

      <label>Fecha de inicio</label>
      <input type="date" id="fecha_inicio" name="fecha_inicio" required />

      <label>Fecha de fin</label>
      <input type="date" id="fecha_fin" name="fecha_fin" required />

      <div class="modal-buttons">
        <button type="submit" class="btn-accion-centro">${esEdicion ? "Actualizar" : "Guardar"}</button>
        <button type="button" id="btnCancelarModal" class="btn-secundario">Cancelar</button>
      </div>
    </form>
  `);

  const form = document.getElementById("formCampania");
  const btnCancelar = document.getElementById("btnCancelarModal");
  const selectProvincia = document.getElementById("provincia_id");
  const selectLocalidad = document.getElementById("localidad_id");
  const selectBarrio = document.getElementById("barrio_id");
  const inputInicio = document.getElementById("fecha_inicio");
  const inputFin = document.getElementById("fecha_fin");

  const hoy = new Date().toISOString().split("T")[0];
  inputInicio.min = hoy;
  inputFin.min = hoy;

  inputInicio.addEventListener("change", () => {
    inputFin.min = inputInicio.value;
  });

  await cargarProvincias();

  if (esEdicion) {
    const datos = await obtenerCampaniaPorId(id);
    if (!datos) return mostrarPopup("No se pudo cargar la campaña.", "error");

    form.nombre.value = datos.nombre;
    form.descripcion.value = datos.descripcion;
    form.imagen_url.value = datos.imagen_url;
    form.fecha_inicio.value = datos.fecha_inicio.split("T")[0];
    form.fecha_fin.value = datos.fecha_fin.split("T")[0];

    await cargarProvincias();
    form.provincia_id.value = datos.provincia_id;

    await cargarLocalidades(datos.provincia_id);
    form.localidad_id.value = datos.localidad_id;
    form.localidad_id.disabled = false;

    await cargarBarrios(datos.localidad_id);
    form.barrio_id.value = datos.barrio_id;
    form.barrio_id.disabled = false;
  }

  selectProvincia.addEventListener("change", async () => {
    limpiarSelect(selectLocalidad);
    limpiarSelect(selectBarrio);
    selectLocalidad.disabled = true;
    selectBarrio.disabled = true;
    if (selectProvincia.value) await cargarLocalidades(selectProvincia.value);
  });

  selectLocalidad.addEventListener("change", async () => {
    limpiarSelect(selectBarrio);
    selectBarrio.disabled = true;
    if (selectLocalidad.value) await cargarBarrios(selectLocalidad.value);
  });

  if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
      cerrarModal();
      // 👉 al cerrar, quitamos la clase large
      modalContent.classList.remove("large");
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (esEdicion) {
      await actualizarCampania(id);
    } else {
      await guardarNuevaCampania();
    }
    // 👉 al cerrar automáticamente luego de guardar:
    modalContent.classList.remove("large");
  });
}

/* === FUNCIONES AUXILIARES === */
function limpiarSelect(select) {
  select.innerHTML = '<option value="">Seleccionar...</option>';
}

async function cargarProvincias() {
  const res = await fetch(`${API_BASE_URL}/api/provincias`);
  const provincias = await res.json();
  const select = document.getElementById("provincia_id");
  limpiarSelect(select);
  provincias.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.nombre;
    select.appendChild(opt);
  });
}

async function cargarLocalidades(provinciaId) {
  const res = await fetch(`${API_BASE_URL}/api/localidades/provincia/${provinciaId}`);
  const localidades = await res.json();
  const select = document.getElementById("localidad_id");
  limpiarSelect(select);
  localidades.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l.id;
    opt.textContent = l.nombre;
    select.appendChild(opt);
  });
  select.disabled = false;
}

async function cargarBarrios(localidadId) {
  const res = await fetch(`${API_BASE_URL}/api/barrios/localidad/${localidadId}`);
  const barrios = await res.json();
  const select = document.getElementById("barrio_id");
  limpiarSelect(select);
  barrios.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.nombre;
    select.appendChild(opt);
  });
  select.disabled = false;
}

/* === OBTENER CAMPAÑA POR ID === */
async function obtenerCampaniaPorId(id) {
  const res = await fetch(`${API_BASE_URL}/api/campanias/${id}`);
  if (!res.ok) return null;
  return await res.json();
}

/* === CREAR / EDITAR CAMPAÑA === */
async function guardarNuevaCampania() {
  await guardarOCrearCampania("POST");
}
async function actualizarCampania(id) {
  await guardarOCrearCampania("PUT", id);
}

async function guardarOCrearCampania(metodo, id = null) {
  const form = document.getElementById("formCampania");
  const token = localStorage.getItem("token");
  const hoy = new Date().toISOString().split("T")[0];

  const datos = {
    centro_id: 1,
    nombre: form.nombre.value.trim(),
    descripcion: form.descripcion.value.trim(),
    imagen_url: form.imagen_url.value.trim(),
    provincia_id: form.provincia_id.value,
    localidad_id: form.localidad_id.value,
    barrio_id: form.barrio_id.value,
    fecha_inicio: form.fecha_inicio.value,
    fecha_fin: form.fecha_fin.value,
  };

  if (!datos.nombre || !datos.descripcion || !datos.imagen_url)
    return mostrarPopup("Todos los campos son obligatorios.", "advertencia");
  if (datos.fecha_inicio < hoy)
    return mostrarPopup("La fecha de inicio no puede ser anterior a hoy.", "advertencia");
  if (datos.fecha_fin < datos.fecha_inicio)
    return mostrarPopup("La fecha de fin no puede ser anterior a la de inicio.", "advertencia");

  const url = `${API_BASE_URL}/api/campanias${metodo === "PUT" ? `/${id}` : ""}`;

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });

    if (!res.ok) throw new Error("Error al guardar campaña");

    mostrarPopup(
      metodo === "PUT" ? "Campaña actualizada correctamente." : "Campaña creada correctamente.",
      "exito"
    );
    cerrarModal();
    const modalContent = document.getElementById("modal-content");
    modalContent.classList.remove("large"); // 🔧 reset del tamaño
    cargarCampanias();
  } catch (err) {
    console.error("Error al guardar:", err);
    mostrarPopup("No se pudo guardar la campaña.", "error");
  }
}

/* ==========================================================
   MODAL DE CONFIRMACIÓN PARA ELIMINAR
=========================================================== */
function mostrarModalConfirmacionEliminar(id, nombre) {
  const modalContent = document.getElementById("modal-content");
  modalContent.classList.remove("large"); // 🔧 los modales de confirmación son pequeños

  abrirModal(`
    <h3>Confirmar eliminación</h3>
    <p>¿Estás seguro de que deseas eliminar la campaña <strong>"${nombre}"</strong>? Esta acción no se puede deshacer.</p>
    <div class="modal-buttons">
      <button id="btnConfirmEliminar" class="btn-peligro">Eliminar</button>
      <button id="btnCancelarEliminar" class="btn-secundario">Cancelar</button>
    </div>
  `);

  document.getElementById("btnCancelarEliminar").addEventListener("click", cerrarModal);
  document.getElementById("btnConfirmEliminar").addEventListener("click", async () => {
    await eliminarCampania(id);
    cerrarModal();
  });
}

/* === ELIMINAR CAMPAÑA === */
async function eliminarCampania(id) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_BASE_URL}/api/campanias/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Error al eliminar campaña");

    mostrarPopup("Campaña eliminada correctamente.", "exito");
    cargarCampanias();
  } catch (err) {
    console.error("❌ Error al eliminar campaña:", err);
    mostrarPopup("No se pudo eliminar la campaña. Intente nuevamente.", "error");
  }
}
