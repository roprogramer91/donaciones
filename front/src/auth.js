// auth.js (solo para index.html)
import { API_BASE_URL } from './config.js';

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Si el usuario viene de Google con token en la URL
if (token) {
  localStorage.setItem('token', token);
  // Limpiá la URL
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
}

// Si YA hay token (usuario logueado), redirigilo automáticamente al dashboard
const tokenGuardado = localStorage.getItem('token');
if (tokenGuardado) {
  // Consultá el backend para saber a qué dashboard va
  verificarRolYRedirigir(tokenGuardado);
}

// NO pongas nada de window.location.href = "index.html" acá, así no hay loop

async function verificarRolYRedirigir(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/me`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      return; // Mostrar login
    }
    if (!response.ok) {
      return; // Error inesperado
    }

    const user = await response.json();
    // Supongamos que el backend responde: { esDonante: true/false }
    if (user.esDonante) {
      window.location.href = "./src/donante/dashboard-donante.html";
    } else {
      window.location.href = "./src/donante/test-donante.html";
    }
  } catch (error) {
    console.error('Error en la verificación:', error);
    // Mostrar login
  }
}

