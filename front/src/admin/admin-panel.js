import { apiFetch } from "../utils/api.js";

const centrosBody = document.getElementById("centrosBody");
const tableMessage = document.getElementById("tableMessage");
const form = document.getElementById("centroForm");
const formMessage = document.getElementById("formMessage");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const cancelEditBtn = document.getElementById("cancelEdit");
const passwordRow = document.getElementById("passwordRow");
const logoutBtn = document.getElementById("logoutBtn");
const provinciaSelect = document.getElementById("provincia_id");
const localidadSelect = document.getElementById("localidad_id");
const barrioSelect = document.getElementById("barrio_id");

let editId = null;

function requireAdmin() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("tipo_usuario");
  if (!token || role !== "admin") {
    window.location.href = "../auth/login.html";
  }
}

function leerForm() {
  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const direccion = document.getElementById("direccion").value.trim();
  const provincia_id = provinciaSelect.value;
  const localidad_id = localidadSelect.value;
  const barrio_id = barrioSelect.value;
  const password = document.getElementById("password").value;
  const activo = document.getElementById("activo").value === "true";

  const base = {
    nombre,
    email,
    telefono,
    direccion,
    provincia_id: provincia_id ? Number(provincia_id) : null,
    localidad_id: localidad_id ? Number(localidad_id) : null,
    barrio_id: barrio_id ? Number(barrio_id) : null,
    activo,
  };

  if (!editId) {
    base.password = password;
  }

  return base;
}

function resetLocalidades(mensaje = "Elegí una provincia") {
  localidadSelect.innerHTML = `<option value="">${mensaje}</option>`;
  localidadSelect.disabled = true;
}

function resetBarrios(mensaje = "Elegí una localidad") {
  barrioSelect.innerHTML = `<option value="">${mensaje}</option>`;
  barrioSelect.disabled = true;
}

async function cargarProvincias(preselect = null) {
  provinciaSelect.disabled = true;
  provinciaSelect.innerHTML = `<option value="">Cargando provincias...</option>`;
  try {
    const data = await apiFetch("/api/provincias");
    provinciaSelect.innerHTML = `<option value="">Seleccioná...</option>`;
    data.forEach((p) => {
      provinciaSelect.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });
    if (preselect) {
      provinciaSelect.value = String(preselect);
    }
  } catch (err) {
    console.error("Error cargando provincias", err);
    provinciaSelect.innerHTML = `<option value="">Error al cargar</option>`;
  } finally {
    provinciaSelect.disabled = false;
  }
}

async function cargarLocalidades(provinciaId, preselect = null) {
  resetLocalidades("Cargando localidades...");
  resetBarrios();
  if (!provinciaId) return;
  try {
    const data = await apiFetch(`/api/localidades?provincia_id=${provinciaId}`);
    localidadSelect.innerHTML = `<option value="">Seleccioná...</option>`;
    data.forEach((l) => {
      localidadSelect.innerHTML += `<option value="${l.id}">${l.nombre}</option>`;
    });
    localidadSelect.disabled = false;
    if (preselect) localidadSelect.value = String(preselect);
  } catch (err) {
    console.error("Error cargando localidades", err);
    resetLocalidades("Error al cargar");
  }
}

async function cargarBarrios(localidadId, preselect = null) {
  resetBarrios("Cargando barrios...");
  if (!localidadId) return;
  try {
    const data = await apiFetch(`/api/barrios?localidad_id=${localidadId}`);
    if (!Array.isArray(data) || data.length === 0) {
      resetBarrios("No hay barrios para esta localidad");
      return;
    }
    barrioSelect.innerHTML = `<option value="">Seleccioná...</option>`;
    data.forEach((b) => {
      barrioSelect.innerHTML += `<option value="${b.id}">${b.nombre}</option>`;
    });
    barrioSelect.disabled = false;
    if (preselect) barrioSelect.value = String(preselect);
  } catch (err) {
    console.error("Error cargando barrios", err);
    resetBarrios("Error al cargar");
  }
}

function limpiarForm() {
  form.reset();
  document.getElementById("activo").value = "true";
  editId = null;
  formTitle.textContent = "Crear centro";
  formSubtitle.textContent = "Alta rápida de un centro + usuario";
  cancelEditBtn.hidden = true;
  passwordRow.hidden = false;
  document.getElementById("password").required = true;
  document.getElementById("password").value = "";
  provinciaSelect.value = "";
  resetLocalidades();
  resetBarrios();
}

async function llenarForm(centro) {
  document.getElementById("nombre").value = centro.nombre || "";
  document.getElementById("email").value = centro.email || "";
  document.getElementById("telefono").value = centro.telefono || "";
  document.getElementById("direccion").value = centro.direccion || "";
  document.getElementById("activo").value = centro.activo ? "true" : "false";

  await cargarProvincias(centro.provincia_id || null);
  if (centro.provincia_id) {
    await cargarLocalidades(centro.provincia_id, centro.localidad_id || null);
  } else {
    resetLocalidades();
  }
  if (centro.localidad_id) {
    await cargarBarrios(centro.localidad_id, centro.barrio_id || null);
  } else {
    resetBarrios();
  }

  passwordRow.hidden = true;
  document.getElementById("password").required = false;
  document.getElementById("password").value = "";

  formTitle.textContent = `Editar centro #${centro.id}`;
  formSubtitle.textContent = "Actualiza datos sin cambiar la contraseña";
  cancelEditBtn.hidden = false;
  editId = centro.id;
}

async function cargarCentros() {
  try {
    centrosBody.innerHTML = `<tr><td colspan="6" class="loading">Cargando...</td></tr>`;
    const data = await apiFetch("/api/admin/centros");
    if (!Array.isArray(data) || data.length === 0) {
      centrosBody.innerHTML = `<tr><td colspan="6" class="loading">No hay centros cargados.</td></tr>`;
      return;
    }
    centrosBody.innerHTML = data
      .map((c) => {
        const activo = c.activo ? "Sí" : "No";
        const badgeClass = c.activo ? "badge success" : "badge muted";
        return `
          <tr>
            <td>${c.id}</td>
            <td>${c.nombre || "-"}</td>
            <td>${c.email || "-"}</td>
            <td>${c.telefono || "-"}</td>
            <td><span class="${badgeClass}">${activo}</span></td>
            <td>
              <div class="table-actions">
                <button class="btn icon secondary" data-edit="${c.id}">Editar</button>
                <button class="btn icon" data-delete="${c.id}">Borrar</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    tableMessage.textContent = err.message || "Error al cargar centros";
  }
}

async function crearCentro(payload) {
  return apiFetch("/api/admin/centros", "POST", payload);
}

async function actualizarCentro(id, payload) {
  return apiFetch(`/api/admin/centros/${id}`, "PUT", payload);
}

async function borrarCentro(id) {
  return apiFetch(`/api/admin/centros/${id}`, "DELETE");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";

  const payload = leerForm();
  try {
    if (editId) {
      await actualizarCentro(editId, payload);
      formMessage.style.color = "green";
      formMessage.textContent = "Centro actualizado";
    } else {
      await crearCentro(payload);
      formMessage.style.color = "green";
      formMessage.textContent = "Centro creado";
    }
    limpiarForm();
    await cargarCentros();
  } catch (err) {
    formMessage.style.color = "red";
    formMessage.textContent = err.message || "Error al guardar";
  }
});

centrosBody.addEventListener("click", async (e) => {
  const editIdAttr = e.target.getAttribute("data-edit");
  const deleteIdAttr = e.target.getAttribute("data-delete");

  if (editIdAttr) {
    const rows = await apiFetch("/api/admin/centros");
    const centro = rows.find((c) => String(c.id) === editIdAttr);
    if (centro) {
      await llenarForm(centro);
      formMessage.textContent = "";
    }
  }

  if (deleteIdAttr) {
    const confirmDelete = window.confirm("¿Borrar este centro y su usuario asociado?");
    if (!confirmDelete) return;
    try {
      await borrarCentro(deleteIdAttr);
      await cargarCentros();
    } catch (err) {
      tableMessage.textContent = err.message || "Error al borrar";
    }
  }
});

cancelEditBtn.addEventListener("click", () => {
  limpiarForm();
  formMessage.textContent = "";
});

localidadSelect.addEventListener("change", async (e) => {
  const locId = e.target.value;
  if (!locId) {
    resetBarrios();
    return;
  }
  await cargarBarrios(locId);
});

provinciaSelect.addEventListener("change", async (e) => {
  const provId = e.target.value;
  await cargarLocalidades(provId || null);
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("tipo_usuario");
  window.location.href = "../auth/login.html";
});

requireAdmin();
Promise.all([cargarProvincias(), cargarCentros()]).catch((err) =>
  console.error(err)
);
