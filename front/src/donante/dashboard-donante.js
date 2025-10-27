import { API_BASE_URL } from "../config.js";

const estadoApto = document.getElementById('estado-apto');

// Elementos
const token = localStorage.getItem('token');
if (!token) window.location.href = '../../index.html';

const loader = document.getElementById('loader');
const contenidoPrivado = document.getElementById('contenido-privado');
const bienvenida = document.getElementById('bienvenida');
const logoutBtn = document.getElementById('logoutBtn');

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
    bienvenida.textContent = `¡Hola, ${donante.nombre || 'Donante'}!`;

    // Mostrar datos principales
    grupoSangre.textContent = donante.grupo_sanguineo || '--';
    ultimaDonacion.textContent = donante.fecha_ultima_donacion
      ? new Date(donante.fecha_ultima_donacion).toLocaleDateString()
      : '--/--/----';
    diasApto.textContent = (donante.dias_restantes !== undefined)
      ? `${donante.dias_restantes} días`
      : '-- días';

  
    // document.getElementById('provincia-nombre').textContent = donante.provincia_nombre;

    // Cargar campañas por localidad
    await cargarCampanias(token);

    loader.style.display = "none";
    contenidoPrivado.style.display = "block";

  } catch (e) {
  console.error("⚠️ Error detallado en cargarPanel():", e);

  loader.innerHTML = `
    <p style="color:red;">
      Error al cargar datos.<br>
      <strong>Detalles:</strong> ${e.message || 'Error desconocido'}<br>
      Revisa la consola para más información.
    </p>`;
}

 
}

// Botón de perfil
document.getElementById('btn-perfil').addEventListener('click', () => {
  window.location.href = "perfil-donante.html";
});


// Botón de logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = '../../index.html';
});




cargarPanel();

// ---------------- Campañas disponibles -----------------
const campaniasList = document.getElementById('campaniasList');
const modal = document.getElementById('modalCampania');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const btnAsistir = document.getElementById('btnAsistir');
let campaniaSeleccionada = null;

btnCerrarModal?.addEventListener('click', () => {
  modal.style.display = 'none';
  campaniaSeleccionada = null;
});

async function cargarCampanias(tok) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/campanias`, {
      headers: { 'Authorization': 'Bearer ' + tok }
    });
    if (!res.ok) throw new Error('Error al obtener campañas');
    const data = await res.json();
    renderCampanias(data.campanias || []);
  } catch (err) {
    console.error('Error al cargar campañas:', err);
    if (campaniasList) campaniasList.innerHTML = '<em>No se pudieron cargar las campañas</em>';
  }
}

function renderCampanias(campanias) {
  if (!campaniasList) return;
  if (!campanias || campanias.length === 0) {
    campaniasList.innerHTML = '<em>No hay campañas activas en tu localidad.</em>';
    return;
  }
  campaniasList.innerHTML = '';
  campanias.forEach(c => {
    const card = document.createElement('div');
    card.className = 'campania-card';
    const img = document.createElement('img');
    img.src = c.imagen_url || 'https://placehold.co/64x64/EEE/AAA?text=Img';
    img.alt = c.nombre || 'Campaña';
    const info = document.createElement('div');
    info.className = 'campania-info';
    const strong = document.createElement('strong');
    strong.textContent = c.nombre || 'Campaña';
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
  document.getElementById('modalTitulo').textContent = c.nombre || 'Campaña';
  document.getElementById('modalDescripcion').textContent = c.descripcion || '';
  const lugar = `${c.localidad_nombre || ''}${c.barrio_nombre ? ' - ' + c.barrio_nombre : ''}`;
  document.getElementById('modalLugar').textContent = lugar.trim();
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
    alert('Inscripción registrada. ¡Gracias por participar!');
    modal.style.display = 'none';
  } catch (err) {
    console.error('Error al inscribirse:', err);
    alert('No se pudo registrar tu asistencia.');
  }
});
