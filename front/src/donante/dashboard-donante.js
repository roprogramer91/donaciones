import { API_BASE_URL } from "../config.js";

const estadoApto = document.getElementById('estado-apto');

// Elementos
const token = localStorage.getItem('token');
if (!token) window.location.href = '../../index.html';

const loader = document.getElementById('loader');
const contenidoPrivado = document.getElementById('contenido-privado');
const bienvenida = document.getElementById('bienvenida');
const logoutBtn = document.getElementById('logoutBtn');
const proximasBox = document.querySelector('.proximas-campanias');

// Elementos de los datos personales
const grupoSangre = document.getElementById('grupo-sangre');
const ultimaDonacion = document.getElementById('ultima-donacion');
const diasApto = document.getElementById('dias-apto');

async function cargarPanel() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/perfil`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '../../index.html';
      return;
    }
    if (!res.ok) throw new Error('Error al obtener perfil');

    const donante = await res.json();
    console.log(donante); //SOLO PARA DEBUGGING

    // Mostrar estado de aptitud
    let dias = donante.dias_restantes;
    if (dias !== undefined && dias !== null) {
      if (dias === 0) {
        estadoApto.textContent = "APTO";
        estadoApto.className = "estado-apto apto";
      } else {
        estadoApto.textContent = "NO APTO";
        estadoApto.className = "estado-apto no-apto";
      }
    } else {
      estadoApto.textContent = "";
      estadoApto.className = "estado-apto";
    }
    
    // Mostrar saludo
    bienvenida.textContent = `Â¡Hola, ${donante.nombre || 'Donante'}!`;

    // Mostrar datos principales
    grupoSangre.textContent = donante.grupo_sanguineo || '--';
    ultimaDonacion.textContent = donante.fecha_ultima_donacion
      ? new Date(donante.fecha_ultima_donacion).toLocaleDateString()
      : '--/--/----';
    diasApto.textContent = (donante.dias_restantes !== undefined)
      ? `${donante.dias_restantes} dÃ­as`
      : '-- dÃ­as';

  
    // document.getElementById('provincia-nombre').textContent = donante.provincia_nombre;

    // Cargar campaÃ±as por localidad y mis inscripciones
    await cargarCampanias(token);
    await cargarProximaInscripcion(token);

    loader.style.display = "none";
    contenidoPrivado.style.display = "block";

  } catch (e) {
  console.error("âš ï¸ Error detallado en cargarPanel():", e);

  loader.innerHTML = `
    <p style="color:red;">
      Error al cargar datos.<br>
      <strong>Detalles:</strong> ${e.message || 'Error desconocido'}<br>
      Revisa la consola para mÃ¡s informaciÃ³n.
    </p>`;
}

 
}

// BotÃ³n de perfil
document.getElementById('btn-perfil').addEventListener('click', () => {
  window.location.href = "perfil-donante.html";
});


// BotÃ³n de logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = '../../index.html';
});




cargarPanel();

// ---------------- CampaÃ±as disponibles -----------------
const campaniasList = document.getElementById('campaniasList');
const modal = document.getElementById('modalCampania');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const btnAsistir = document.getElementById('btnAsistir');
let campaniaSeleccionada = null;
let proximaSeleccionada = null;

btnCerrarModal?.addEventListener('click', () => {
  modal.style.display = 'none';
  campaniaSeleccionada = null;
});

async function cargarCampanias(tok) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/campanias`, {
      headers: { 'Authorization': 'Bearer ' + tok }
    });
    if (!res.ok) throw new Error('Error al obtener campaÃ±as');
    const data = await res.json();
    const lista = data.campanias || [];
    renderCampanias(lista);
  } catch (err) {
    console.error('Error al cargar campaÃ±as:', err);
    if (campaniasList) campaniasList.innerHTML = '<em>No se pudieron cargar las campaÃ±as</em>';
  }
}

function renderCampanias(campanias) {
  if (!campaniasList) return;
  const disponibles = (campanias || []).filter(c => !c.ya_inscripto);
  if (disponibles.length === 0) {
    campaniasList.innerHTML = '<em>No hay campañas activas o futuras disponibles.</em>';
    return;
  }
  campaniasList.innerHTML = '';
  disponibles.forEach(c => {
    const card = document.createElement('div');
    card.className = 'campania-card';
    const img = document.createElement('img');
    img.src = c.imagen_url || 'https://placehold.co/64x64/EEE/AAA?text=Img';
    img.alt = c.nombre || 'CampaÃ±a';
    const info = document.createElement('div');
    info.className = 'campania-info';
    const strong = document.createElement('strong');
    strong.textContent = c.nombre || 'CampaÃ±a';
    const p = document.createElement('p');
    p.textContent = c.descripcion || '';
    const tag = document.createElement('span');
    tag.style.cssText = 'display:inline-block;margin-top:4px;padding:2px 8px;border-radius:10px;font-size:0.78rem;background:#eee;color:#555;';
    if (c.estado_calculado === 'activa') {
      tag.textContent = 'Activa';
      tag.style.background = '#d4f5d7'; tag.style.color = '#1b7e20';
    } else if (c.estado_calculado === 'futura') {
      const dias = typeof c.dias_para_inicio === 'number' && c.dias_para_inicio > 0 ? ` (en ${c.dias_para_inicio} dias)` : '';
      tag.textContent = 'Proxima' + dias;
      tag.style.background = '#e7f0ff'; tag.style.color = '#0a58ca';
    }
    const btn = document.createElement('button');
    btn.textContent = 'Ver';
    btn.className = 'btn-secundario';
    btn.addEventListener('click', () => abrirModalCampania(c));
    info.appendChild(strong);
    info.appendChild(p);
    info.appendChild(tag);
    info.appendChild(btn);
    card.appendChild(img);
    card.appendChild(info);
    campaniasList.appendChild(card);
  });
}

function abrirModalCampania(c) {
  campaniaSeleccionada = c;
  document.getElementById('modalTitulo').textContent = c.nombre || 'CampaÃ±a';
  document.getElementById('modalDescripcion').textContent = c.descripcion || '';
  const lugar = `${c.localidad_nombre || ''}${c.barrio_nombre ? ' - ' + c.barrio_nombre : ''}`;
  document.getElementById('modalLugar').textContent = lugar.trim();
  if (c.ya_inscripto === true) {
    btnAsistir.disabled = true;
    btnAsistir.textContent = 'Inscripto';
  } else {
    btnAsistir.disabled = !c.inscribible;
    btnAsistir.textContent = 'ASISTIR';
  }
  modal.style.display = 'flex';
}

btnAsistir?.addEventListener('click', async () => {
  if (!campaniaSeleccionada) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/campanias/${campaniaSeleccionada.id}/asistir`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || 'Error al inscribirse');
    }
    alert('InscripciÃ³n registrada. Â¡Gracias por participar!');
    modal.style.display = 'none';
    // refrescar listados y proxima
    await cargarCampanias(token);
    await cargarProximaInscripcion(token);
  } catch (err) {
    console.error('Error al inscribirse:', err);
    alert('No se pudo registrar tu asistencia.');
  }
});

// -------- Mis CampaÃ±as (inscripciones del donante) ---------
function ensureMisCampaniasContainer() {
  if (document.getElementById('misCampaniasList')) return document.getElementById('misCampaniasList');
  const section = document.querySelector('.dashboard-campanias');
  if (!section) return null;
  const hr = document.createElement('hr');
  const h2 = document.createElement('h2');
  h2.textContent = 'Mis campaÃ±as';
  const div = document.createElement('div');
  div.className = 'campanias-list';
  div.id = 'misCampaniasList';
  section.appendChild(hr);
  section.appendChild(h2);
  section.appendChild(div);
  return div;
}

async function cargarMisCampanias(tok) {
  try {
    const listEl = ensureMisCampaniasContainer();
    if (!listEl) return;
    const res = await fetch(`${API_BASE_URL}/api/donantes/inscripciones`, {
      headers: { 'Authorization': 'Bearer ' + tok }
    });
    if (!res.ok) throw new Error('Error al obtener mis inscripciones');
    const data = await res.json();
    renderMisCampanias(data || [], listEl);
  } catch (e) {
    console.error('Error al cargar mis campaÃ±as:', e);
  }
}

function renderMisCampanias(campanias, container) {
  if (!container) return;
  if (!campanias || campanias.length === 0) {
    container.innerHTML = '<em>TodavÃ­a no te inscribiste a campaÃ±as.</em>';
    return;
  }
  container.innerHTML = '';
  campanias.forEach(c => {
    const card = document.createElement('div');
    card.className = 'campania-card';
    const img = document.createElement('img');
    img.src = c.imagen_url || 'https://placehold.co/64x64/EEE/AAA?text=Img';
    img.alt = c.nombre || 'CampaÃ±a';
    const info = document.createElement('div');
    info.className = 'campania-info';
    const strong = document.createElement('strong');
    strong.textContent = c.nombre || 'CampaÃ±a';
    const p = document.createElement('p');
    const fecha = c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : '';
    p.textContent = fecha ? `Te inscribiste. Fecha de inicio: ${fecha}` : 'Te inscribiste.';
    const btn = document.createElement('button');
    btn.textContent = 'Ver';
    btn.className = 'btn-secundario';
    btn.addEventListener('click', () => abrirModalCampania({ ...c, ya_inscripto: true }));
    info.appendChild(strong);
    info.appendChild(p);
    info.appendChild(btn);
    card.appendChild(img);
    card.appendChild(info);
    container.appendChild(card);
  });
}
