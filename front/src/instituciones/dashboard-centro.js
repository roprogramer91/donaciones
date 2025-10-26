// front/src/instituciones/dashboard-centro.js

import { API_BASE_URL } from "../config.js";

// ---- Elementos base ----
const loader = document.getElementById('loader-centro');
const contenido = document.getElementById('contenido-centro');
const bienvenida = document.getElementById('bienvenida-centro');
const logoutBtn = document.getElementById('logoutBtn');
const btnPerfil = document.getElementById('btn-perfil');

// Helpers comunes
const token = localStorage.getItem("token");
function authHeaders(extra = {}) {
  const headers = { ...extra };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
function getCentroId() {
  const keys = ['centro_id', 'centroId', 'userCentroId'];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && !isNaN(parseInt(v))) return parseInt(v);
  }
  return 1; // TODO: guardar centroId durante el login y leerlo aquí
}
function toggleSeccion(seccion) {
  const seccionDonantes = document.getElementById("seccion-donantes");
  const seccionCampanias = document.getElementById("seccion-campanias");
  seccionDonantes.style.display = seccion === 'donantes' ? 'block' : 'none';
  seccionCampanias.style.display = seccion === 'campanias' ? 'block' : 'none';
}

// Catálogos en memoria para nombres de provincias/localidades
const provinciasById = new Map();
const localidadesById = new Map();
const provinciasCargadasParaLocalidades = new Set();

async function ensureProvincias() {
  if (provinciasById.size > 0) return;
  const res = await fetch(`${API_BASE_URL}/api/provincias`);
  const provincias = await res.json();
  provincias.forEach(p => provinciasById.set(p.id, p.nombre));
}

async function ensureLocalidadesFor(provinciaIds) {
  for (const provId of provinciaIds) {
    if (!provId || provinciasCargadasParaLocalidades.has(provId)) continue;
    const res = await fetch(`${API_BASE_URL}/api/localidades?provincia_id=${provId}`);
    const localidades = await res.json();
    localidades.forEach(l => localidadesById.set(l.id, l.nombre));
    provinciasCargadasParaLocalidades.add(provId);
  }
}

// ---- Loader inicial ----
setTimeout(() => {
  const centroNombre = localStorage.getItem("centroNombre") || "Centro de Hemoterapia";
  bienvenida.textContent = `Bienvenido, ${centroNombre}!`;
  loader.style.display = "none";
  contenido.style.display = "block";
}, 800);

// ---- Logout ----
logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '../../index.html';
});

// ---- Perfil Centro ----
const modalPerfil = document.getElementById('modal-perfil');
const cerrarModalPerfil = document.getElementById('cerrarModalPerfil');
const formPerfil = document.getElementById('form-perfil');

btnPerfil?.addEventListener('click', async () => {
  modalPerfil.style.display = 'flex';
  await cargarPerfilCentro();
});

cerrarModalPerfil?.addEventListener('click', () => {
  modalPerfil.style.display = 'none';
});

async function cargarPerfilCentro() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/me`, {
      headers: authHeaders({ 'X-Centro-Id': getCentroId() })
    });
    if (!res.ok) throw new Error('No se pudo cargar el perfil');
    const data = await res.json();
    document.getElementById('perfil_nombre').value = data.nombre || '';
    document.getElementById('perfil_direccion').value = data.direccion || '';
    document.getElementById('perfil_telefono').value = data.telefono || '';
    document.getElementById('perfil_email').value = data.email || '';
  } catch (e) {
    console.error(e);
    alert('Error al cargar el perfil');
  }
}

formPerfil?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById('perfil_nombre').value.trim(),
    direccion: document.getElementById('perfil_direccion').value.trim(),
    telefono: document.getElementById('perfil_telefono').value.trim(),
    email: document.getElementById('perfil_email').value.trim(),
  };
  if (!payload.nombre) {
    alert('El nombre es obligatorio');
    return;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/me`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json', 'X-Centro-Id': getCentroId() }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('No se pudo guardar el perfil');
    const actualizado = await res.json();
    bienvenida.textContent = `Bienvenido, ${actualizado.nombre || 'Centro de Hemoterapia'}!`;
    modalPerfil.style.display = 'none';
  } catch (e) {
    console.error(e);
    alert('Error al guardar el perfil');
  }
});

// ------------------------------------------------------
// SECCIÓN: VER DONANTES
// ------------------------------------------------------
const btnVerDonantes = document.getElementById("btn-ver-donantes");
const seccionDonantes = document.getElementById("seccion-donantes");
const tablaBody = document.querySelector("#tabla-donantes tbody");
const filtroGrupo = document.getElementById("filtro-grupo");
const btnFiltro = document.getElementById("btn-aplicar-filtro");
const filtroProvincia = document.getElementById('filtro-provincia');
const filtroLocalidad = document.getElementById('filtro-localidad');
const filtroBarrio = document.getElementById('filtro-barrio');
const filtroApto = document.getElementById('filtro-apto');

btnVerDonantes.addEventListener("click", async () => {
  toggleSeccion("donantes");
  await inicializarFiltrosDonantes();
  await cargarDonantes();
});

btnFiltro.addEventListener("click", async () => {
  await cargarDonantes();
});

async function cargarDonantes() {
  const grupo = filtroGrupo.value;
  const params = new URLSearchParams();
  if (grupo) params.append("grupo", grupo);
  const provinciaId = filtroProvincia?.value;
  const localidadId = filtroLocalidad?.value;
  const barrioId = filtroBarrio?.value;
  if (provinciaId) params.append('provincia', provinciaId);
  if (localidadId) params.append('localidad', localidadId);
  if (barrioId) params.append('barrio', barrioId);
  if (filtroApto?.checked) params.append('apto', 'true');

  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/filtro?${params.toString()}`, {
      headers: authHeaders(),
    });

    if (!res.ok) throw new Error("Error al obtener donantes");
    const data = await res.json();
    const provIds = new Set((data || []).map(d => d.provincia_id).filter(Boolean));
    await ensureProvincias();
    await ensureLocalidadesFor(provIds);
    renderDonantes(data);
  } catch (err) {
    console.error("Error al cargar donantes:", err);
    tablaBody.innerHTML = `<tr><td colspan="7">Error al cargar donantes</td></tr>`;
  }
}

async function inicializarFiltrosDonantes() {
  try {
    // Provincias
    if (filtroProvincia && filtroProvincia.options.length <= 1) {
      const resP = await fetch(`${API_BASE_URL}/api/provincias`);
      const provincias = await resP.json();
      filtroProvincia.innerHTML = '<option value="">Todas las provincias</option>';
      provincias.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id; opt.textContent = p.nombre; filtroProvincia.appendChild(opt);
      });
    }

    // Barrios (lista simple)
    if (filtroBarrio && filtroBarrio.options.length <= 1) {
      const resB = await fetch(`${API_BASE_URL}/api/barrios`);
      const barrios = await resB.json();
      filtroBarrio.innerHTML = '<option value="">Todos los barrios</option>';
      const vistos = new Set();
      barrios.forEach(b => {
        const nombre = (b.nombre||'').toLowerCase();
        if (vistos.has(nombre)) return; vistos.add(nombre);
        const opt = document.createElement('option');
        opt.value = b.id; opt.textContent = b.nombre; filtroBarrio.appendChild(opt);
      });
    }

    // Localidades dependientes de provincia
    filtroProvincia?.addEventListener('change', async () => {
      const provId = filtroProvincia.value;
      filtroLocalidad.innerHTML = '<option value="">Todas las localidades</option>';
      filtroLocalidad.disabled = true;
      if (!provId) return;
      const resL = await fetch(`${API_BASE_URL}/api/localidades?provincia_id=${provId}`);
      const localidades = await resL.json();
      localidades.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id; opt.textContent = l.nombre; filtroLocalidad.appendChild(opt);
      });
      filtroLocalidad.disabled = false;
    }, { once: true });
  } catch (e) {
    console.error('Error inicializando filtros de donantes:', e);
  }
}

function renderDonantes(donantes) {
  tablaBody.innerHTML = "";
  if (!donantes || !donantes.length) {
    tablaBody.innerHTML = `<tr><td colspan="7">No se encontraron donantes</td></tr>`;
    return;
  }

  donantes.forEach((d) => {
    const tr = document.createElement("tr");
    const provinciaNombre = d.provincia_nombre || provinciasById.get(d.provincia_id) || "";
    const localidadNombre = d.localidad_nombre || localidadesById.get(d.localidad_id) || "";
    tr.innerHTML = `
      <td>${d.nombre || ""} ${d.apellido || ""}</td>
      <td>${d.grupo_sanguineo || ""}</td>
      <td>${provinciaNombre}</td>
      <td>${localidadNombre}</td>
      <td>${d.telefono || ""}</td>
      <td>${d.apto_para_donar ? "Sí" : "No"}</td>
      <td>${d.dias_restantes ?? ""}</td>
    `;
    tablaBody.appendChild(tr);
  });
}

// ------------------------------------------------------
// SECCIÓN: GESTIONAR CAMPAÑAS (GET / POST / PUT / DELETE)
// ------------------------------------------------------
const btnVerCampanias = document.getElementById('btn-ver-campanias');
const seccionCampanias = document.getElementById('seccion-campanias');

btnVerCampanias.addEventListener('click', async () => {
  toggleSeccion('campanias');
  await cargarCampanias();
});

async function cargarCampanias() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/campanias`, {
      headers: authHeaders(),
    });
    const campanias = await res.json();

    const tbody = document.querySelector('#tabla-campanias tbody');
    tbody.innerHTML = '';

    campanias.forEach(c => {
      const fechaInicio = c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : '--';
      const fechaFin = c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString() : '--';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.nombre}</td>
        <td>${fechaInicio} a ${fechaFin}</td>
        <td>${c.localidad || c.localidad_nombre || c.localidad || '--'}</td>
        <td>${c.estado ?? ''}</td>
        <td>
          <button class="btn-editar" data-id="${c.id}" title="Editar campaña">✏️</button>
          <button class="btn-eliminar" data-id="${c.id}" title="Eliminar campaña">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-editar').forEach(btn =>
      btn.addEventListener('click', (e) => editarCampania(e.target.dataset.id))
    );
    document.querySelectorAll('.btn-eliminar').forEach(btn =>
      btn.addEventListener('click', (e) => eliminarCampania(e.target.dataset.id))
    );

  } catch (err) {
    console.error('Error al cargar campañas:', err);
  }
}

// --- Eliminar campaña ---
async function eliminarCampania(id) {
  const primera = confirm("¿Seguro que deseas eliminar esta campaña?");
  if (!primera) return;
  const segunda = confirm("Esta acción no se puede deshacer. ¿Confirmas la eliminación?");
  if (!segunda) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/campanias/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Error al eliminar campaña");
    alert("Campaña eliminada correctamente.");
    await cargarCampanias();
  } catch (err) {
    console.error(err);
    alert("No se pudo eliminar la campaña.");
  }
}

// --- Editar campaña ---
async function editarCampania(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/campanias/${id}`, {
      headers: authHeaders(),
    });
    const campania = await res.json();

    modal.style.display = 'flex';
    await cargarUbicaciones();

    document.getElementById('nombre').value = campania.nombre || '';
    document.getElementById('descripcion').value = campania.descripcion || '';
    document.getElementById('imagen_url').value = campania.imagen_url || '';
    document.getElementById('provincia_id').value = campania.provincia_id || '';
    document.getElementById('localidad_id').value = campania.localidad_id || '';
    document.getElementById('barrio_id').value = campania.barrio_id || '';
    document.getElementById('fecha_inicio').value = (campania.fecha_inicio || '').split('T')[0] || '';
    document.getElementById('fecha_fin').value = (campania.fecha_fin || '').split('T')[0] || '';

    formCampania.dataset.editId = id;

  } catch (err) {
    console.error('Error al cargar campaña para editar:', err);
    alert('No se pudo cargar la campaña para editar.');
  }
}

// ------------------------------------------------------
// MODAL NUEVA / EDITAR CAMPAÑA
// ------------------------------------------------------
const modal = document.getElementById('modal-campania');
const cerrarModal = document.getElementById('cerrarModal');
const formCampania = document.getElementById('form-campania');

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'btn-nueva-campania') {
    modal.style.display = 'flex';
    cargarUbicaciones();
    delete formCampania.dataset.editId;
    formCampania.reset();
  }
});

cerrarModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

async function cargarUbicaciones() {
  try {
    const [resProvincias, resBarrios] = await Promise.all([
      fetch(`${API_BASE_URL}/api/provincias`),
      fetch(`${API_BASE_URL}/api/barrios`)
    ]);

    const provincias = await resProvincias.json();
    const barrios = await resBarrios.json();

    const selectProvincia = document.getElementById('provincia_id');
    const selectLocalidad = document.getElementById('localidad_id');
    const selectBarrio = document.getElementById('barrio_id');

    selectProvincia.innerHTML = '<option value="">Seleccionar provincia...</option>';
    selectLocalidad.innerHTML = '<option value="">Seleccionar localidad...</option>';
    selectBarrio.innerHTML = '<option value="">Seleccionar barrio...</option>';
    selectLocalidad.disabled = true;

    provincias.forEach(prov => {
      const opt = document.createElement('option');
      opt.value = prov.id;
      opt.textContent = prov.nombre;
      selectProvincia.appendChild(opt);
    });

    const barriosUnicos = [];
    const nombresVistos = new Set();
    barrios.forEach(barr => {
      const nombre = (barr.nombre || '').toLowerCase();
      if (!nombresVistos.has(nombre)) {
        nombresVistos.add(nombre);
        barriosUnicos.push(barr);
      }
    });

    barriosUnicos.forEach(barr => {
      const opt = document.createElement('option');
      opt.value = barr.id;
      opt.textContent = barr.nombre;
      selectBarrio.appendChild(opt);
    });

    selectProvincia.addEventListener('change', async () => {
      const provinciaId = selectProvincia.value;
      selectLocalidad.innerHTML = '<option value="">Seleccionar localidad...</option>';
      selectLocalidad.disabled = true;
      if (!provinciaId) return;

      try {
        const resLocalidades = await fetch(`${API_BASE_URL}/api/localidades?provincia_id=${provinciaId}`);
        const localidades = await resLocalidades.json();
        localidades.forEach(loc => {
          const opt = document.createElement('option');
          opt.value = loc.id;
          opt.textContent = loc.nombre;
          selectLocalidad.appendChild(opt);
        });
        selectLocalidad.disabled = false;
      } catch (error) {
        console.error('Error cargando localidades:', error);
      }
    });
  } catch (error) {
    console.error('Error cargando ubicaciones:', error);
  }
}

// --- Crear o editar campaña ---
formCampania.addEventListener('submit', async (e) => {
  e.preventDefault();

  const editId = formCampania.dataset.editId || null;
  const nombre = document.getElementById('nombre').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const imagen_url = document.getElementById('imagen_url').value.trim();
  const provincia_id = parseInt(document.getElementById('provincia_id').value);
  const localidad_id = parseInt(document.getElementById('localidad_id').value);
  const barrio_id = parseInt(document.getElementById('barrio_id').value);
  const fecha_inicio = document.getElementById('fecha_inicio').value;
  const fecha_fin = document.getElementById('fecha_fin').value;

  if (!nombre || !descripcion || !fecha_inicio || !fecha_fin || !provincia_id || !localidad_id || !barrio_id) {
    alert('Por favor, completa todos los campos obligatorios.');
    return;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (new Date(fecha_inicio) < hoy) {
    alert('La fecha de inicio no puede ser anterior a hoy.');
    return;
  }
  if (new Date(fecha_fin) < new Date(fecha_inicio)) {
    alert('La fecha de fin no puede ser anterior a la fecha de inicio.');
    return;
  }

  const nuevaCampania = {
    centro_id: getCentroId(),
    nombre,
    descripcion,
    imagen_url,
    provincia_id,
    localidad_id,
    barrio_id,
    fecha_inicio,
    fecha_fin
  };

  try {
    const method = editId ? 'PUT' : 'POST';
    const url = editId
      ? `${API_BASE_URL}/api/campanias/${editId}`
      : `${API_BASE_URL}/api/campanias`;

    const res = await fetch(url, {
      method,
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(nuevaCampania)
    });

    if (!res.ok) throw new Error('Error al guardar la campaña');
    alert(editId ? 'Campaña actualizada correctamente' : 'Campaña creada con éxito');
    modal.style.display = 'none';
    formCampania.reset();
    delete formCampania.dataset.editId;
    await cargarCampanias();

  } catch (error) {
    console.error(error);
    alert('Error al guardar la campaña: ' + error.message);
  }
});

