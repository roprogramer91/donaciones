// front/src/instituciones/dashboard-centro.js

import { API_BASE_URL } from "../config.js";

// ---- Elementos base ----
const loader = document.getElementById('loader-centro');
const contenido = document.getElementById('contenido-centro');
const bienvenida = document.getElementById('bienvenida-centro');
const logoutBtn = document.getElementById('logoutBtn');
const btnPerfil = document.getElementById('btn-perfil');
const btnNotifCentro = document.getElementById('btn-notif-centro');
const badgeNotifCentro = document.getElementById('badge-notif-centro');
const dropdownNotifCentro = document.getElementById('dropdown-notif-centro');
const listaNotifCentro = document.getElementById('lista-notif-centro');
// Modal Inscripciones
const modalInscripciones = document.getElementById('modal-inscripciones');
const cerrarModalInsc = document.getElementById('cerrarModalInsc');
const inscLista = document.getElementById('insc_lista');
const inscNombre = document.getElementById('insc_nombre');

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
let currentSection = null;
function toggleSeccion(seccion) {
  const seccionDonantes = document.getElementById('seccion-donantes');
  const seccionCampanias = document.getElementById('seccion-campanias');
  const seccionNotifs = document.getElementById('seccion-notifs');

  const wasOpen = currentSection === seccion;

  // Ocultar todas
  if (seccionDonantes) seccionDonantes.style.display = 'none';
  if (seccionCampanias) seccionCampanias.style.display = 'none';
  if (seccionNotifs) seccionNotifs.style.display = 'none';

  if (wasOpen) {
    currentSection = null;
    return false; // quedó oculto
  }

  // Mostrar la solicitada
  if (seccion === 'donantes' && seccionDonantes) seccionDonantes.style.display = 'block';
  if (seccion === 'campanias' && seccionCampanias) seccionCampanias.style.display = 'block';
  if (seccion === 'notifs' && seccionNotifs) seccionNotifs.style.display = 'block';

  currentSection = seccion;
  return true; // quedó visible
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
  // cargar notificaciones del centro tras abrir
  cargarNotificacionesCentro();
}, 800);

// ---- Logout ----
logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '../../index.html';
});

// ---- Notificaciones Centro (campana en header) ----
btnNotifCentro?.addEventListener('click', (e) => {
  e.stopPropagation();
  if(!dropdownNotifCentro) return;
  const visible = dropdownNotifCentro.style.display === 'block';
  dropdownNotifCentro.style.display = visible ? 'none' : 'block';
  if(!visible) cargarNotificacionesCentro();
});
document.addEventListener('click', () => { if(dropdownNotifCentro) dropdownNotifCentro.style.display='none'; });
dropdownNotifCentro?.addEventListener('click', e => e.stopPropagation());

// Cerrar modal inscripciones
cerrarModalInsc?.addEventListener('click', ()=>{ if(modalInscripciones) modalInscripciones.style.display='none'; });
modalInscripciones?.addEventListener('click', (e)=>{ if(e.target === modalInscripciones) modalInscripciones.style.display='none'; });

async function cargarNotificacionesCentro(){
  try{
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones`, { headers: authHeaders({ 'X-Centro-Id': getCentroId() }) });
    if(res.status === 404){ renderNotifsCentro([]); return; }
    if(!res.ok) throw new Error('notifs centro');
    const data = await res.json();
    renderNotifsCentro(Array.isArray(data)?data:[]);
  }catch(e){ console.error('Error al cargar notifs centro', e); }
}

function renderNotifsCentro(lista){
  if(!listaNotifCentro) return;
  listaNotifCentro.innerHTML = '';
  const noLeidas = lista.filter(n => !n.leida).length;
  if(badgeNotifCentro){
    if(noLeidas>0){ badgeNotifCentro.textContent=String(noLeidas); badgeNotifCentro.style.display='inline-block'; }
    else { badgeNotifCentro.style.display='none'; }
  }
  if(!lista.length){
    const v = document.createElement('div'); v.style.padding='12px'; v.textContent='Sin notificaciones'; listaNotifCentro.appendChild(v); return;
  }
  lista.forEach(n => {
    const item = document.createElement('div');
    item.style.padding = '10px 12px';
    item.style.borderBottom = '1px solid #f1f5f9';
    item.style.background = n.leida ? '#fff' : '#f8fafc';
    const fecha = n.created_at ? new Date(n.created_at).toLocaleString() : '';
    item.innerHTML = `<div style="font-size:0.85rem; color:#0f172a; font-weight:600;">${n.tipo||'aviso'}</div>
                      <div style="font-size:0.9rem; color:#334155; white-space:pre-wrap;">${n.mensaje||''}</div>
                      <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">${fecha}</div>`;
    item.addEventListener('click', async () => {
      if(n.leida) return;
      try{ await fetch(`${API_BASE_URL}/api/centro/notificaciones/${n.id}/leida`, { method:'PUT', headers: authHeaders({ 'X-Centro-Id': getCentroId() }) }); }catch{}
      n.leida = true; renderNotifsCentro(lista);
    });
    listaNotifCentro.appendChild(item);
  });
}

// ---- Inscripciones por usuario (popup desde tabla Donantes) ----
async function abrirModalInscripciones(usuarioId, nombre){
  if(!modalInscripciones || !inscLista) return;
  inscNombre.textContent = nombre ? `Donante: ${nombre}` : '';
  inscLista.innerHTML = '<div style="color:#64748b;">Cargando...</div>';
  modalInscripciones.style.display = 'flex';
  try{
    const res = await fetch(`${API_BASE_URL}/api/centro/donantes/${usuarioId}/inscripciones`, { headers: authHeaders({'X-Centro-Id': getCentroId()}) });
    const lista = await res.json();
    inscLista.innerHTML = '';
    if(!Array.isArray(lista) || !lista.length){
      inscLista.innerHTML = '<div style="color:#6b7280;">Sin inscripciones</div>';
      return;
    }
    lista.forEach(c => {
      const div = document.createElement('div');
      const fecha = (c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : '--');
      div.innerHTML = `<a href="#" data-id="${c.id}">${c.nombre || 'Campaña'}</a> <span style="color:#64748b;">(${fecha})</span>`;
      const a = div.querySelector('a');
      a.addEventListener('click', (ev)=>{
        ev.preventDefault();
        modalInscripciones.style.display = 'none';
        irAGestionCampaniasYResaltar(c.id);
      });
      inscLista.appendChild(div);
    });
  }catch(e){
    console.error('Error al cargar inscripciones:', e);
    inscLista.innerHTML = '<div style="color:#ef4444;">Error al cargar inscripciones</div>';
  }
}

async function irAGestionCampaniasYResaltar(campaniaId){
  // Asegurar sección abierta y datos cargados
  if(currentSection !== 'campanias') toggleSeccion('campanias');
  await cargarCampanias();
  // Pequeño delay para asegurar render
  setTimeout(()=> resaltarCampaniaEnTabla(campaniaId), 50);
}

function resaltarCampaniaEnTabla(campaniaId){
  const tbody = document.querySelector('#tabla-campanias tbody');
  if(!tbody) return;
  const row = tbody.querySelector(`tr[data-id="${campaniaId}"]`);
  if(row){
    row.classList.remove('blink-highlight');
    // scroll a la vista y parpadeo
    try{ row.scrollIntoView({ behavior:'smooth', block:'center' }); } catch{}
    setTimeout(()=> row.classList.add('blink-highlight'), 10);
    // limpiar clase luego de la animación
    setTimeout(()=> row.classList.remove('blink-highlight'), 3500);
  }
}

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

btnVerDonantes.addEventListener('click', async () => {
  const visible = toggleSeccion('donantes');
  if (!visible) return; // toggle off
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
    tablaBody.innerHTML = `<tr><td colspan=\"8\">Error al cargar donantes</td></tr>`;
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
  const headers = ['Nombre','Grupo','Provincia','Localidad','Telefono','Campaña','Apto','Dias restantes','Email'];
  const rows = ultimoResultadoDonantes.map(d => {
    const provinciaNombre = d.provincia_nombre || '';
    const localidadNombre = d.localidad_nombre || '';
    const nombreCompleto = `${d.nombre || ''} ${d.apellido || ''}`.trim();
    const aptoTxt = d.apto_para_donar ? 'Si' : 'No';
    const insc = (d.inscripto_en_campania === true) || (!!d.campania_inscripta);
    return [
      nombreCompleto,
      d.grupo_sanguineo || '',
      provinciaNombre,
      localidadNombre,
      d.telefono || '',
      insc ? 'Inscripto' : 'Ninguna',
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
    tablaBody.innerHTML = `<tr><td colspan="8">No se encontraron donantes</td></tr>`;
    return;
  }

  donantes.forEach((d) => {
    const tr = document.createElement("tr");
    const provinciaNombre = d.provincia_nombre || provinciasById.get(d.provincia_id) || "";
    const localidadNombre = d.localidad_nombre || localidadesById.get(d.localidad_id) || "";
    const nombreCompleto = `${d.nombre || ""} ${d.apellido || ""}`.trim();
    const insc = (d.inscripto_en_campania === true) || (!!d.campania_inscripta);
    const campaniaCol = insc
      ? `<a href="#" class="link-inscripciones" data-uid="${d.usuario_id}" data-nombre="${nombreCompleto.replace(/"/g,'&quot;')}">Inscripto</a>`
      : 'Ninguna';
    tr.innerHTML = `
      <td>${d.nombre || ""} ${d.apellido || ""}</td>
      <td>${d.grupo_sanguineo || ""}</td>
      <td>${provinciaNombre}</td>
      <td>${localidadNombre}</td>
      <td>${d.telefono || ""}</td>
      <td>${campaniaCol}</td>
      <td>${d.apto_para_donar ? "Si" : "No"}</td>
      <td>${d.dias_restantes ?? ""}</td>
    `;
    const a = tr.querySelector('.link-inscripciones');
    if(a){
      a.addEventListener('click', (ev)=>{
        ev.preventDefault();
        const uid = parseInt(a.getAttribute('data-uid'),10);
        const nom = a.getAttribute('data-nombre') || '';
        abrirModalInscripciones(uid, nom);
      });
    }
    tablaBody.appendChild(tr);
  });
}

// ------------------------------------------------------
// SECCIÓN: GESTIONAR CAMPAÑAS (GET / POST / PUT / DELETE)
// ------------------------------------------------------
const btnVerCampanias = document.getElementById('btn-ver-campanias');
const seccionCampanias = document.getElementById('seccion-campanias');

btnVerCampanias.addEventListener('click', async () => {
  const visible = toggleSeccion('campanias');
  if (!visible) return;
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
      tr.setAttribute('data-id', c.id);
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









// ------------------------------------------------------
// SECCION: NOTIFICACIONES A DONANTES
// ------------------------------------------------------
const btnEnviarNotif = document.getElementById('btn-enviar-notif');
const btnFelicitacionesHoy = document.getElementById('btn-felicitaciones-hoy');
const msgNotif = document.getElementById('notif-centro-mensaje');

btnEnviarNotif?.addEventListener('click', async () => {
  const mensaje = (document.getElementById('notif_mensaje')?.value || '').trim();
  const tipo = document.getElementById('notif_tipo')?.value || 'aviso';
  const campania_id = parseInt(document.getElementById('notif_campania_sel')?.value || '', 10) || null;
  const provincia = parseInt(document.getElementById('f_notif_provincia')?.value || '', 10) || undefined; const localidad = parseInt(document.getElementById('f_notif_localidad')?.value || '', 10) || undefined;
  const grupo = document.getElementById('f_notif_grupo')?.value || undefined;
  const apto = document.getElementById('f_notif_apto')?.checked ? 'true' : undefined;
  if (!mensaje) { msgNotif.textContent = 'El mensaje es obligatorio'; return; }
  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ mensaje, tipo, campania_id, filtros: { localidad, grupo, estado: undefined, apto } })
    });
    if (!res.ok) throw new Error('No se pudo enviar');
    const r = await res.json();
    msgNotif.textContent = `Notificaciones enviadas: ${r.enviados}`;
  } catch (e) {
    console.error(e); msgNotif.textContent = 'Error al enviar notificaciones';
  }
});

btnFelicitacionesHoy?.addEventListener('click', async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones/felicitaciones`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ dias: 0 })
    });
    if (!res.ok) throw new Error('No se pudo generar');
    const r = await res.json();
    msgNotif.textContent = `Felicitaciones generadas: ${r.enviados}`;
  } catch (e) {
    console.error(e); msgNotif.textContent = 'Error al generar felicitaciones';
  }
});

// Botón para abrir sección Notificaciones
const btnVerNotifs = document.getElementById('btn-ver-notifs');
const seccionNotifs = document.getElementById('seccion-notifs');
btnVerNotifs?.addEventListener('click', async () => {
  const visible = toggleSeccion('notifs');
  if (!visible) return;
  await cargarProvinciasNotif();
  await cargarCampaniasNotif();
  if (seccionNotifs) seccionNotifs.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Previsualizar alcance de notificaciones
const btnPreviewNotif = document.getElementById('btn-preview-notif');
const previewOut = document.getElementById('notif-centro-preview');
btnPreviewNotif?.addEventListener('click', async () => {
  const provincia = parseInt(document.getElementById('f_notif_provincia')?.value || '', 10) || undefined; const localidad = parseInt(document.getElementById('f_notif_localidad')?.value || '', 10) || undefined;
  const grupo = document.getElementById('f_notif_grupo')?.value || undefined;
  const apto = document.getElementById('f_notif_apto')?.checked ? 'true' : undefined;
  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones/preview`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ filtros: { provincia, localidad, grupo, estado: undefined, apto } })
    });
    if (!res.ok) throw new Error('No se pudo previsualizar');
    const r = await res.json();
    if (previewOut) previewOut.textContent = `Alcance estimado: ${r.destinatarios} donantes`;
  } catch (e) {
    console.error(e); if (previewOut) previewOut.textContent = 'Error al previsualizar alcance';
  }
});

// Previsualizar felicitaciones
const btnPreviewFel = document.getElementById('btn-preview-felicitaciones');
btnPreviewFel?.addEventListener('click', async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones/felicitaciones/preview`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ dias: 0 })
    });
    if (!res.ok) throw new Error('No se pudo previsualizar');
    const r = await res.json();
    if (previewOut) previewOut.textContent = `Cumplea�os hoy: ${r.candidatos} donantes`;
  } catch (e) {
    console.error(e); if (previewOut) previewOut.textContent = 'Error al previsualizar felicitaciones';
  }
});

// Cargar cat�logos para Notificaciones (provincia/localidad y campa�as)
const selProvN = document.getElementById('f_notif_provincia');
const selLocN = document.getElementById('f_notif_localidad');
const selCamp = document.getElementById('notif_campania_sel');

async function cargarProvinciasNotif() {
  if (!selProvN) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/provincias`);
    const data = await res.json();
    selProvN.innerHTML = '<option value="">Todas las provincias</option>';
    data.forEach(p => {
      const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.nombre; selProvN.appendChild(opt);
    });
  } catch {}
}

async function cargarLocalidadesNotif(provId) {
  if (!selLocN) return;
  selLocN.disabled = !provId; selLocN.innerHTML = '<option value="">Todas las localidades</option>';
  if (!provId) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/localidades?provincia=${provId}`);
    const data = await res.json();
    data.forEach(l => { const opt = document.createElement('option'); opt.value = l.id; opt.textContent = l.nombre; selLocN.appendChild(opt); });
  } catch {}
}

selProvN?.addEventListener('change', async (e) => {
  await cargarLocalidadesNotif(e.target.value || '');
});

async function cargarCampaniasNotif() {
  if (!selCamp) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/campanias`);
    const lista = await res.json();
    selCamp.innerHTML = '<option value="">Seleccionar campa�a...</option>';
    lista.forEach(c => { const opt=document.createElement('option'); opt.value=c.id; opt.textContent=c.nombre; selCamp.appendChild(opt); });
  } catch {}
}



// --- Realtime badge for reach ---
const badgeReach = document.getElementById('notif-centro-badge');
function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
async function actualizarBadgeReach(){
  try{
    const provincia = parseInt(document.getElementById('f_notif_provincia')?.value || '',10) || undefined;
    const localidad = parseInt(document.getElementById('f_notif_localidad')?.value || '',10) || undefined;
    const grupo = document.getElementById('f_notif_grupo')?.value || undefined;
    const apto = document.getElementById('f_notif_apto')?.checked ? 'true' : undefined;
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones/preview`, {
      method:'POST', headers: authHeaders({'Content-Type':'application/json'}),
      body: JSON.stringify({ filtros: { provincia, localidad, grupo, estado: undefined, apto } })
    });
    if(!res.ok) throw new Error('preview');
    const r = await res.json();
    if(badgeReach){ badgeReach.textContent = `Alcance: ${r.destinatarios || 0}`; }
    const btnSend = document.getElementById('btn-enviar-notif');
    if(btnSend) btnSend.disabled = !r.destinatarios;
  }catch{
    if(badgeReach) badgeReach.textContent = 'Alcance: 0';
  }
}
const debReach = debounce(actualizarBadgeReach, 300);
['f_notif_provincia','f_notif_localidad','f_notif_grupo','f_notif_apto'].forEach(id=>{
  const el = document.getElementById(id); if(el){ el.addEventListener('change', debReach); el.addEventListener('input', debReach); }
});
// trigger when opening the section
btnVerNotifs?.addEventListener('click', () => { setTimeout(actualizarBadgeReach, 200); });
// Historial de envíos
async function cargarLogNotifs(){
  try{
    const res = await fetch(`${API_BASE_URL}/api/centro/notificaciones/log`, { headers: authHeaders() });
    if(!res.ok) throw new Error('log');
    const data = await res.json();
    renderLogNotifs(Array.isArray(data)?data:[]);
  }catch(e){ console.error('Error log notifs', e); }
}
function ensureLogContainer(){
  const sec = document.getElementById('seccion-notifs');
  if(!sec) return null;
  let log = document.getElementById('notif-centro-log');
  if(log) return log;
  log = document.createElement('div');
  log.id='notif-centro-log';
  log.innerHTML = '<h4 style="margin-top:1rem;">Historial de envíos</h4><table id="tabla-notif-log" style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;">Fecha</th><th style="text-align:left;">Tipo</th><th style="text-align:left;">Enviados</th><th style="text-align:left;">Mensaje</th></tr></thead><tbody></tbody></table>';
  sec.appendChild(log);
  return log;
}
function renderLogNotifs(lista){
  const log = ensureLogContainer(); if(!log) return;
  const tbody = log.querySelector('tbody');
  tbody.innerHTML='';
  if(!lista.length){ tbody.innerHTML='<tr><td colspan="4">Sin envíos recientes</td></tr>'; return; }
  lista.forEach(it=>{
    const tr = document.createElement('tr');
    const fecha = it.created_at ? new Date(it.created_at).toLocaleString() : '';
    tr.innerHTML = `<td style="padding:4px 6px;border-top:1px solid #eee;">${fecha}</td><td style="padding:4px 6px;border-top:1px solid #eee;">${it.tipo||''}</td><td style="padding:4px 6px;border-top:1px solid #eee;">${it.enviados||0}</td><td style="padding:4px 6px;border-top:1px solid #eee;">${(it.mensaje||'').substring(0,120)}</td>`;
    tr.style.cursor = 'pointer';
    tr.title = 'Ver detalle';
    tr.addEventListener('click', () => abrirModalNotifDetalle(it));
    tbody.appendChild(tr);
  });
}
btnVerNotifs?.addEventListener('click', () => { setTimeout(cargarLogNotifs, 250); });
// ---- Modal Detalle Notificaciones (historial) ----
const modalNotif = document.getElementById('modal-notif-detalle');
const cerrarModalNotifDetalle = document.getElementById('cerrarModalNotifDetalle');
cerrarModalNotifDetalle?.addEventListener('click', ()=>{ if(modalNotif) modalNotif.style.display='none'; });
if(modalNotif){
  modalNotif.addEventListener('click', (e)=>{
    if(e.target === modalNotif){ modalNotif.style.display='none'; }
  });
}

function abrirModalNotifDetalle(item){
  if(!modalNotif) return;
  const elFecha = document.getElementById('notif_det_fecha');
  const elTipo = document.getElementById('notif_det_tipo');
  const elEnv = document.getElementById('notif_det_enviados');
  const elMsg = document.getElementById('notif_det_mensaje');
  const elFiltLeg = document.getElementById('notif_det_filtros_legible');
  const elFiltJson = document.getElementById('notif_det_filtros_json');

  const fecha = item.created_at ? new Date(item.created_at).toLocaleString() : '';
  if(elFecha) elFecha.textContent = fecha || '--';
  if(elTipo) elTipo.textContent = item.tipo || '--';
  if(elEnv) elEnv.textContent = String(item.enviados ?? 0);
  if(elMsg) elMsg.textContent = item.mensaje || '';

  const filtros = (item.filtros && (typeof item.filtros === 'object' ? item.filtros : safeParseJSON(item.filtros))) || {};
  if(elFiltLeg){
    elFiltLeg.innerHTML = '';
    const map = filtroEtiquetas();
    const keys = Object.keys(filtros).filter(k => filtros[k] !== undefined && filtros[k] !== null && filtros[k] !== '');
    if(!keys.length){ elFiltLeg.textContent = '—'; }
    else{
      keys.forEach(k => {
        const val = filtros[k];
        const div = document.createElement('span');
        div.style.background = '#eef2ff';
        div.style.border = '1px solid #e5e7eb';
        div.style.borderRadius = '9999px';
        div.style.padding = '4px 8px';
        div.style.fontSize = '0.85rem';
        div.textContent = `${map[k] || k}: ${String(val)}`;
        elFiltLeg.appendChild(div);
      });
    }
  }
  if(elFiltJson){
    try{ elFiltJson.textContent = JSON.stringify(filtros || {}, null, 2); }
    catch{ elFiltJson.textContent = '{}'; }
  }

  modalNotif.style.display = 'flex';
}

function filtroEtiquetas(){
  return {
    provincia: 'Provincia',
    localidad: 'Localidad',
    barrio: 'Barrio',
    grupo: 'Grupo sanguíneo',
    estado: 'Estado',
    apto: 'Solo aptos',
    campania_id: 'Campaña'
  };
}

function safeParseJSON(x){
  try{ return JSON.parse(x); } catch{ return {}; }
}
