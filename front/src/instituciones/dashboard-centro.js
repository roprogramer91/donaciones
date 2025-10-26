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
// nombres vienen del backend\n

// ---- Loader inicial ----
setTimeout(() => {
  const centroNombre = localStorage.getItem("centroNombre") || "Centro de Hemoterapia";
  bienvenida.textContent = `Bienvenido, ${centroNombre}!`;
  loader.style.display = "none";
  contenido.style.display = "block";
  // Cargar resumen al mostrar el panel
  cargarResumen();
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
const filtroEdadMin = document.getElementById('filtro-edad-min');
const filtroEdadMax = document.getElementById('filtro-edad-max');
const filtroDiasRestMax = document.getElementById('filtro-dias-rest-max');
const btnLimpiarFiltro = document.getElementById('btn-limpiar-filtro');
const btnExportarCSV = document.getElementById('btn-exportar-csv');
const conteoDonantes = document.getElementById('conteo-donantes');

let ultimoResultadoDonantes = [];

btnVerDonantes.addEventListener("click", async () => {
  toggleSeccion("donantes");
  await inicializarFiltrosDonantes();
  await cargarDonantes();
});

btnFiltro.addEventListener("click", async () => {
  await cargarDonantes();
});

btnLimpiarFiltro?.addEventListener('click', async () => {
  if (filtroGrupo) filtroGrupo.value = '';
  if (filtroProvincia) filtroProvincia.value = '';
  if (filtroLocalidad) {
    filtroLocalidad.innerHTML = '<option value="">Todas las localidades</option>';
    filtroLocalidad.disabled = true;
  }
  if (filtroBarrio) filtroBarrio.value = '';
  if (filtroApto) filtroApto.checked = false;
  if (filtroEdadMin) filtroEdadMin.value = '';
  if (filtroEdadMax) filtroEdadMax.value = '';
  if (filtroDiasRestMax) filtroDiasRestMax.value = '';
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
  const eMin = parseInt(filtroEdadMin?.value || ''); if (!isNaN(eMin)) params.append('edad_min', String(eMin));
  const eMax = parseInt(filtroEdadMax?.value || ''); if (!isNaN(eMax)) params.append('edad_max', String(eMax));
  const drm = parseInt(filtroDiasRestMax?.value || ''); if (!isNaN(drm)) params.append('dias_restantes_max', String(drm));

  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/filtro?${params.toString()}`, {
      headers: authHeaders(),
    });

    if (!res.ok) throw new Error("Error al obtener donantes");
    const data = await res.json();
        ultimoResultadoDonantes = Array.isArray(data) ? data : [];
    actualizarConteoYExport();
    renderDonantes(data);
  } catch (err) {
    console.error("Error al cargar donantes:", err);
    tablaBody.innerHTML = `<tr><td colspan="7">Error al cargar donantes</td></tr>`;
    ultimoResultadoDonantes = [];
    actualizarConteoYExport();
  }
}

// ----- Resumen: donantes aptos, campanias activas y proximas -----
async function cargarResumen() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/summary`, {
      headers: authHeaders({ 'X-Centro-Id': getCentroId() })
    });
    if (!res.ok) throw new Error('No se pudo cargar el resumen');
    const s = await res.json();

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val ?? '--'); };
    setText('donantes-activos', s.donantes_aptos_hoy);
    setText('donantes-totales', s.donantes_totales);
    setText('campanias-activas', s.campanias_activas);
    setText('campanias-proximas', s.proximas_14_dias);
    setText('campanias-finalizadas', s.campanias_finalizadas);

    const contGrupos = document.getElementById('resumen-grupos');
    if (contGrupos && s.aptos_por_grupo) {
      const orden = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
      contGrupos.innerHTML = orden.map(g => `<span style="background:#e7f0fe;color:#1f3c80;padding:0.25rem 0.5rem;border-radius:999px;font-size:0.85rem;">${g}: <b>${s.aptos_por_grupo[g] || 0}</b></span>`).join('');
    }

    const elSig = document.getElementById('campania-siguiente');
    if (elSig) {
      if (s.siguiente_campania) {
        const f = new Date(s.siguiente_campania.fecha_inicio);
        elSig.textContent = `${s.siguiente_campania.nombre || 'Campaña'} — ${f.toLocaleDateString()}`;
      } else {
        elSig.textContent = '--';
      }
    }

  } catch (e) {
    console.error('Error cargando resumen:', e);
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
    });
  } catch (e) {
    console.error('Error inicializando filtros de donantes:', e);
  }
}

function actualizarConteoYExport() {
  if (conteoDonantes) {
    const n = ultimoResultadoDonantes.length;
    conteoDonantes.textContent = `${n} ${n === 1 ? 'resultado' : 'resultados'}`;
  }
  if (btnExportarCSV) {
    btnExportarCSV.disabled = ultimoResultadoDonantes.length === 0;
    btnExportarCSV.onclick = () => exportarCSVDonantes();
  }
}

function exportarCSVDonantes() {
  if (!ultimoResultadoDonantes.length) return;
  const headers = ['Nombre','Grupo','Provincia','Localidad','Telefono','Apto','Dias restantes','Email'];
  const rows = ultimoResultadoDonantes.map(d => {
    const provinciaNombre = d.provincia_nombre || '';
    const localidadNombre = d.localidad_nombre || '';
    const nombreCompleto = `${d.nombre || ''} ${d.apellido || ''}`.trim();
    const aptoTxt = d.apto_para_donar ? 'Si' : 'No';
    return [
      nombreCompleto,
      d.grupo_sanguineo || '',
      provinciaNombre,
      localidadNombre,
      d.telefono || '',
      aptoTxt,
      d.dias_restantes ?? '',
      d.email || ''
    ];
  });
  const escape = (val) => {
    const s = String(val ?? '');
    const needs = /[",\n]/.test(s);
    return needs ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const pad = (x) => String(x).padStart(2, '0');
  const fname = `donantes_filtrados_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}.csv`;
  a.href = url; a.download = fname; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
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
      <td>${d.apto_para_donar ? "Si" : "No"}</td>
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
        <td>${c.localidad_nombre || c.localidad || '--'}</td>
        <td>${c.estado_calculado ?? c.estado ?? '--'}</td>

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








