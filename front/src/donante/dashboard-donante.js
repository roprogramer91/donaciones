import { API_BASE_URL } from "../config.js";

// 1. Chequear token antes de todo
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '../../index.html';
}

// Elementos
const loader = document.getElementById('loader');
const contenidoPrivado = document.getElementById('contenido-privado');
const bienvenida = document.getElementById('bienvenida');
const logoutBtn = document.getElementById('logoutBtn');

// 2. Obtener datos del usuario para el saludo
async function cargarPanel() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/me`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Respuesta del backend:', res.status);
    console.log('Token enviado:', token);

    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '../../index.html';
      return;
    }
    const user = await res.json();

    // Mostrar saludo
    bienvenida.textContent = `¡Hola, ${user.nombre || 'Donante'}!`;

    // Mostrar el panel y ocultar loader
    loader.style.display = "none";
    contenidoPrivado.style.display = "block";

  } catch (e) {
    loader.innerHTML = "<p>Error al cargar datos. Por favor, inicia sesión nuevamente.</p>";
    localStorage.removeItem('token');
    setTimeout(() => window.location.href = '../../index.html', 2000);
  }
}

// 3. Botón de logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = '../../index.html';
});

cargarPanel();
