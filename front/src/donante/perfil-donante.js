import { API_BASE_URL } from "../utils/config.js";
import { appLogger } from "../utils/logger.js";

const token = localStorage.getItem("token");
if (!token) window.location.href = "../../index.html";

// Referencias
const form = document.getElementById("perfil-form");
const mensaje = document.getElementById("perfil-mensaje");
const logoutBtn = document.getElementById("logoutBtn");
const btnDashboard = document.getElementById("btn-dashboard");

// Selects geogrÃ¡ficos
const provinciaSelect = document.getElementById("provincia");
const localidadSelect = document.getElementById("localidad");
const barrioSelect = document.getElementById("barrio");

function setMensaje(texto, color = "inherit") {
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.style.color = color;
}

function setSelectValor(select, value) {
  if (!select || value === undefined || value === null || value === "") return;
  const opt = Array.from(select.options).find(
    (o) => String(o.value) === String(value)
  );
  if (opt) select.value = opt.value;
}

// =======================
// Carga de combos
// =======================
async function cargarProvincias() {
  if (!provinciaSelect) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/provincias`);
    if (!res.ok) throw new Error("No se pudo cargar provincias");
    const provincias = await res.json();
    provinciaSelect.innerHTML = '<option value="">Provincia</option>';
    provincias.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nombre;
      provinciaSelect.appendChild(opt);
    });
  } catch (e) {
    appLogger.error("Error cargando provincias:", e);
    provinciaSelect.innerHTML = '<option value="">Sin provincias</option>';
  }
}

async function cargarLocalidades(provinciaId) {
  if (!localidadSelect) return;
  localidadSelect.innerHTML = '<option value="">Localidad</option>';
  barrioSelect && (barrioSelect.innerHTML = '<option value="">Barrio</option>');
  if (!provinciaId) {
    localidadSelect.disabled = true;
    barrioSelect && (barrioSelect.disabled = true);
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/localidades?provincia_id=${provinciaId}`
    );
    if (!res.ok) throw new Error("No se pudo cargar localidades");
    const localidades = await res.json();
    localidades.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = l.nombre;
      localidadSelect.appendChild(opt);
    });
    localidadSelect.disabled = false;
  } catch (e) {
    appLogger.error("Error cargando localidades:", e);
    localidadSelect.innerHTML = '<option value="">Sin localidades</option>';
    localidadSelect.disabled = true;
  }
}

async function cargarBarrios(localidadId) {
  if (!barrioSelect) return;
  barrioSelect.innerHTML = '<option value="">Barrio</option>';
  if (!localidadId) {
    barrioSelect.disabled = true;
    return;
  }
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/barrios?localidad_id=${localidadId}`
    );
    if (!res.ok) throw new Error("No se pudo cargar barrios");
    const barrios = await res.json();
    barrios.forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.nombre;
      barrioSelect.appendChild(opt);
    });
    barrioSelect.disabled = false;
  } catch (e) {
    appLogger.error("Error cargando barrios:", e);
    barrioSelect.innerHTML = '<option value="">Sin barrios</option>';
    barrioSelect.disabled = true;
  }
}

provinciaSelect?.addEventListener("change", async (e) => {
  await cargarLocalidades(e.target.value);
});

localidadSelect?.addEventListener("change", async (e) => {
  await cargarBarrios(e.target.value);
});

// =======================
// Cargar perfil
// =======================
async function cargarPerfil() {
  try {
    setMensaje("Cargando perfil...");
    await cargarProvincias();

    const res = await fetch(`${API_BASE_URL}/api/donantes/perfil`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`No se pudo traer el perfil (HTTP ${res.status}) ${txt}`);
    }
    const payload = await res.json().catch(() => ({}));
    const perfil = payload?.perfil || payload;
    console.info("Perfil cargado:", perfil);

    form.nombre.value = perfil.nombre || perfil.nombres || perfil.user_nombre || "";
    form.apellido.value = perfil.apellido || perfil.apellidos || perfil.user_apellido || "";
    const dniVal = perfil.dni ?? perfil.documento ?? perfil.dni_usuario ?? "";
    form.dni.value = dniVal !== null && dniVal !== undefined ? String(dniVal) : "";
    form.email.value = perfil.email || "";
    form.grupo_sanguineo.value = perfil.grupo_sanguineo || "";
    form.fecha_nacimiento.value = perfil.fecha_nacimiento
      ? perfil.fecha_nacimiento.substring(0, 10)
      : "";
    form.telefono.value = perfil.telefono || "";

    if (perfil.provincia_id) {
      setSelectValor(provinciaSelect, perfil.provincia_id);
      await cargarLocalidades(perfil.provincia_id);
      setSelectValor(localidadSelect, perfil.localidad_id);
      if (perfil.localidad_id) {
        await cargarBarrios(perfil.localidad_id);
        setSelectValor(barrioSelect, perfil.barrio_id);
      }
    }

    setMensaje("");
  } catch (err) {
    setMensaje(err?.message || "Error al cargar perfil", "red");
    appLogger.error("Error cargando perfil:", err);
  }
}

// =======================
// Guardar perfil
// =======================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMensaje("Guardando...");

  const datos = {
    grupo_sanguineo: form.grupo_sanguineo.value?.trim() || undefined,
    fecha_nacimiento: form.fecha_nacimiento.value || undefined,
    provincia_id: provinciaSelect?.value || undefined,
    localidad_id: localidadSelect?.value || undefined,
    barrio_id: barrioSelect?.value || undefined,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/perfil`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(datos),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.error || "Error al guardar cambios");
    setMensaje("Datos actualizados", "green");
  } catch (err) {
    appLogger.error("Error guardando perfil:", err);
    setMensaje(err?.message || "Error al guardar cambios", "red");
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../../index.html";
});
btnDashboard.addEventListener("click", () => {
  window.location.href = "dashboard-donante.html";
});

cargarPerfil();


