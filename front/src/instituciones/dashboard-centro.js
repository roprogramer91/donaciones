// dashboard-centro.js
// Mostrar loader y luego el panel
const loader = document.getElementById('loader-centro');
const contenido = document.getElementById('contenido-centro');
const bienvenida = document.getElementById('bienvenida-centro');
const logoutBtn = document.getElementById('logoutBtn');

// Demo: podés cambiar por fetch al backend más adelante
setTimeout(() => {
  bienvenida.textContent = "¡Bienvenido, Centro de Hemoterapia!";
  loader.style.display = "none";
  contenido.style.display = "block";
}, 800);

// Botón logout
logoutBtn.addEventListener('click', () => {
  // Limpiar tokens si los usás
  window.location.href = '../../index.html';
});
