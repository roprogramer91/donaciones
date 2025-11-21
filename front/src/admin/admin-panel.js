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
  const provincia_id = document.getElementById("provincia_id").value;
  const localidad_id = document.getElementById("localidad_id").value;
  const barrio_id = document.getElementById("barrio_id").value;
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

function limpiarForm() {
  form.reset();
  document.getElementById("activo").value = "true";
  editId = null;
  formTitle.textContent = "Crear centro";
  formSubtitle.textContent = "Alta rápida de un centro + usuario";
  cancelEditBtn.hidden = true;
  passwordRow.hidden = false;
  document.getElementById("password").required = true;
}

function llenarForm(centro) {
  document.getElementById("nombre").value = centro.nombre || "";
  document.getElementById("email").value = centro.email || "";
  document.getElementById("telefono").value = centro.telefono || "";
  document.getElementById("direccion").value = centro.direccion || "";
  document.getElementById("provincia_id").value = centro.provincia_id || "";
  document.getElementById("localidad_id").value = centro.localidad_id || "";
  document.getElementById("barrio_id").value = centro.barrio_id || "";
  document.getElementById("activo").value = centro.activo ? "true" : "false";

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
      llenarForm(centro);
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

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("tipo_usuario");
  window.location.href = "../auth/login.html";
});

requireAdmin();
cargarCentros();
