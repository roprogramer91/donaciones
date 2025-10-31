/* ==========================================================
   COMPONENTE: CAMPAÑAS
   Controla la carga, render y gestión de campañas del centro
=========================================================== */

import { API_BASE_URL } from "../../config.js";
import { abrirModal, cerrarModal } from "./modales/modalBase.js";

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
                  <button class="btn-secundario">Editar</button>
                  <button class="btn-peligro">Eliminar</button>
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

    /* === ASOCIAR EVENTO AL BOTÓN DE NUEVA CAMPAÑA === */
    const btnNueva = document.getElementById("btnNuevaCampania");
    if (btnNueva) btnNueva.addEventListener("click", abrirModalNuevaCampania);

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

/* === FUNCIÓN: ABRIR MODAL DE NUEVA CAMPAÑA === */
function abrirModalNuevaCampania() {
  abrirModal(`
    <h3>Nueva Campaña</h3>
    <form id="formNuevaCampania" class="form-campania">
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
        <button type="submit" class="btn-accion-centro">Guardar</button>
        <button type="button" id="btnCancelarModal" class="btn-secundario">Cancelar</button>
      </div>
    </form>
  `);

  // === Referencias ===
  const form = document.getElementById("formNuevaCampania");
  const btnCancelar = document.getElementById("btnCancelarModal");
  const selectProvincia = document.getElementById("provincia_id");
  const selectLocalidad = document.getElementById("localidad_id");
  const selectBarrio = document.getElementById("barrio_id");

  // === Cargar provincias ===
  cargarProvincias();

  // === Eventos encadenados ===
  selectProvincia.addEventListener("change", async () => {
    const idProvincia = selectProvincia.value;
    limpiarSelect(selectLocalidad);
    limpiarSelect(selectBarrio);
    selectLocalidad.disabled = true;
    selectBarrio.disabled = true;
    if (idProvincia) await cargarLocalidades(idProvincia);
  });

  selectLocalidad.addEventListener("change", async () => {
    const idLocalidad = selectLocalidad.value;
    limpiarSelect(selectBarrio);
    selectBarrio.disabled = true;
    if (idLocalidad) await cargarBarrios(idLocalidad);
  });

  // === Botones ===
  if (btnCancelar) btnCancelar.addEventListener("click", cerrarModal);
  if (form)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await guardarNuevaCampania();
    });
}

/* === FUNCIONES AUXILIARES === */
function limpiarSelect(select) {
  select.innerHTML = '<option value="">Seleccionar...</option>';
}

/* === CARGA DE DATOS === */
async function cargarProvincias() {
  try {
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
  } catch (err) {
    console.error("Error al cargar provincias:", err);
  }
}

async function cargarLocalidades(provinciaId) {
  try {
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
  } catch (err) {
    console.error("Error al cargar localidades:", err);
  }
}

async function cargarBarrios(localidadId) {
  try {
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
  } catch (err) {
    console.error("Error al cargar barrios:", err);
  }
}

/* === GUARDAR CAMPAÑA === */
async function guardarNuevaCampania() {
  const token = localStorage.getItem("token");
  const form = document.getElementById("formNuevaCampania");

  const datos = {
    centro_id: 1, // ⚠️ temporal
    nombre: form.nombre.value.trim(),
    descripcion: form.descripcion.value.trim(),
    imagen_url: form.imagen_url.value.trim(),
    localidad_id: form.localidad_id.value,
    barrio_id: form.barrio_id.value,
    fecha_inicio: form.fecha_inicio.value,
    fecha_fin: form.fecha_fin.value,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/campanias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });

    if (!res.ok) throw new Error("Error al crear la campaña");

    alert("✅ Campaña creada correctamente.");
    cerrarModal();
    cargarCampanias();
  } catch (err) {
    console.error(err);
    alert("❌ No se pudo crear la campaña. Intente nuevamente.");
  }
}
