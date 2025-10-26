
// Carga automática del CSS del navbar
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/src/navbar.css'; // Ruta relativa desde el HTML
document.head.appendChild(link);

// Inserción del navbar
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.createElement("nav");
  nav.innerHTML = `
    <h1>Donación de Sangre</h1>
    <button class="menu-toggle" aria-label="Abrir menú">&#9776;</button>    
    <ul>
      <li><a href="/">Inicio</a></li>
      <li><a href="registroDonante.html">Soy donante</a></li>
      <li><a href="registroSolicitante.html">Soy solicitante</a></li>
      <li><a href="educacion.html">Educación</a></li>
    </ul>
  `;
  document.body.prepend(nav);
});

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector("nav ul");

  toggle.addEventListener("click", () => {
    menu.classList.toggle("active");
  });
});
