// src/rol.js
import { API_BASE_URL } from '../config.js';
document.getElementById('btn-donante').onclick = () => elegirRol(['donante']);
document.getElementById('btn-solicitante').onclick = () => elegirRol(['solicitante']);
document.getElementById('btn-ambos').onclick = () => elegirRol(['donante', 'solicitante']);

console.log('Token guardado en localStorage:');
console.log(localStorage.getItem('token'))

async function elegirRol(roles) {
  const token = localStorage.getItem('token');
  const msg = document.getElementById('rol-msg');
  if (!token) {
    msg.textContent = 'No se encontró sesión. Por favor volvé a iniciar sesión.';
    return;
  }

  try {
 
    const res = await fetch(`${API_BASE_URL}/api/users/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ roles })
    });

    if (res.ok) {
      msg.textContent = '¡Rol guardado! Redirigiendo...';
      setTimeout(() => {
        // Cambiá las rutas si tu estructura es diferente
        if (roles.length > 1) {
          window.location.href = '../donante/dashboard-donante.html'; // o './dashboard.html'
        } else if (roles[0] === 'donante') {
          window.location.href = '../solicitante/dashboard-solicitante.html';
        } else {
          window.location.href = './registroDonante.html';
        }
      }, 1200);
    } else {
      msg.textContent = 'Error al asignar rol. Intentá de nuevo.';
    }
  } catch (e) {
    msg.textContent = 'Error de conexión. Intentá más tarde.';
  }
}
