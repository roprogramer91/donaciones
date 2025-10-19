// auth.js
import { AUTH_URL, API_BASE_URL } from './config.js';

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// --- Login con Google (ya implementado) ---
if (token) {
  localStorage.setItem('token', token);
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
}

// Si ya hay token guardado, verificarlo
const tokenGuardado = localStorage.getItem('token');
if (tokenGuardado) {
  verificarRolYRedirigir(tokenGuardado);
}

// -----------------------------------------------------------------
// Login con DNI
// -----------------------------------------------------------------
document.getElementById("dniLoginBtn").addEventListener("click", async () => {
  const dni = document.getElementById("dniInput").value.trim();

  if (!dni) {
    alert("Por favor, ingresá tu DNI");
    return;
  }

  try {
    const response = await fetch(`${AUTH_URL}/dni-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dni }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Error al iniciar sesión");
      return;
    }

    // Guardar token y redirigir
    localStorage.setItem("token", data.token);
    window.location.href = "./src/donante/dashboard-donante.html";
  } catch (err) {
    console.error("Error en login por DNI:", err);
    alert("No se pudo conectar con el servidor");
  }
});

// -----------------------------------------------------------------
// Verificar rol y redirigir
// -----------------------------------------------------------------
async function verificarRolYRedirigir(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/donantes/perfil`, {
      headers: {
        'Authorization': 'Bearer ' + token,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      alert('Sesión expirada. Por favor, volvé a ingresar.');
      return;
    }

    if (!response.ok) return;

    const user = await response.json();
    if (user) {
      window.location.href = "./src/donante/dashboard-donante.html";
    }
  } catch (error) {
    console.error('Error en la verificación:', error);
  }
}
