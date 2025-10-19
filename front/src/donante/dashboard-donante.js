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
