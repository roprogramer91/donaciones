import { API_BASE_URL } from "../config.js";

// ---- Elementos base ----
const loader = document.getElementById('loader-centro');
const contenido = document.getElementById('contenido-centro');
const bienvenida = document.getElementById('bienvenida-centro');
const logoutBtn = document.getElementById('logoutBtn');

// ---- Loader inicial ----
setTimeout(() => {
  const centroNombre = localStorage.getItem("centroNombre") || "Centro de Hemoterapia";
  bienvenida.textContent = `¡Bienvenido, ${centroNombre}!`;
  loader.style.display = "none";
  contenido.style.display = "block";
}, 800);

// ---- Logout ----
logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '../../index.html';
});

// ------------------------------------------------------
// 🩸 SECCIÓN: VER DONANTES
// ------------------------------------------------------
const token = localStorage.getItem("token");
const btnVerDonantes = document.getElementById("btn-ver-donantes");
const seccionDonantes = document.getElementById("seccion-donantes");
const tablaBody = document.querySelector("#tabla-donantes tbody");
const filtroGrupo = document.getElementById("filtro-grupo");
const btnFiltro = document.getElementById("btn-aplicar-filtro");

// Mostrar la sección de donantes
btnVerDonantes.addEventListener("click", async () => {
  toggleSeccion("donantes");
  await cargarDonantes();
});

// Aplicar filtro
btnFiltro.addEventListener("click", async () => {
  await cargarDonantes();
});

// Cargar donantes desde backend
async function cargarDonantes() {
  const grupo = filtroGrupo.value;
  const params = new URLSearchParams();
  if (grupo) params.append("grupo", grupo);

  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes/filtro?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Error al obtener donantes");
    const data = await res.json();

    renderDonantes(data);
  } catch (err) {
    console.error("Error al cargar donantes:", err);
    tablaBody.innerHTML = `<tr><td colspan="7">Error al cargar donantes</td></tr>`;
  }
}

// Renderizar tabla
function renderDonantes(donantes) {
  tablaBody.innerHTML = "";

  if (!donantes || !donantes.length) {
    tablaBody.innerHTML = `<tr><td colspan="7">No se encontraron donantes</td></tr>`;
    return;
  }

  donantes.forEach((d) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.nombre || "—"} ${d.apellido || ""}</td>
      <td>${d.grupo_sanguineo || "—"}</td>
      <td>${d.provincia_nombre || d.provincia_id || "—"}</td>
      <td>${d.localidad_nombre || d.localidad_id || "—"}</td>
      <td>${d.telefono || "—"}</td>
      <td>${d.apto_para_donar ? "✅" : "❌"}</td>
      <td>${d.dias_restantes ?? "—"}</td>
    `;
    tablaBody.appendChild(tr);
  });
}

// ------------------------------------------------------
// 🔄 Utilidad: mostrar una sola sección a la vez
// ------------------------------------------------------
function toggleSeccion(nombre) {
  // Ocultá todas las secciones extra
  const secciones = document.querySelectorAll(".dashboard-centro-seccion");
  secciones.forEach((sec) => (sec.style.display = "none"));

  if (nombre === "donantes") {
    seccionDonantes.style.display = "block";
  }
}
