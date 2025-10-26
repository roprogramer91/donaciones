import { API_BASE_URL } from "../config.js";

const provinciaSelect = document.getElementById("provincia_id");
const localidadSelect = document.getElementById("localidad_id");
const form = document.getElementById("altaDonanteForm");
const mensajeExito = document.getElementById("mensajeExito");
const fechaNacimientoInput = document.getElementById("fecha_nacimiento");
const fechaUltimaDonacionInput = document.getElementById("fecha_ultima_donacion");
const nuncaDoneCheck = document.getElementById("nunca_done");
const dniInput = document.getElementById("dni");

// Setear fecha máxima hoy (para evitar fechas futuras)
const today = new Date().toISOString().split('T')[0];
fechaNacimientoInput.setAttribute('max', today);
fechaUltimaDonacionInput.setAttribute('max', today);

// Solo números para DNI (y hasta 9 dígitos)
dniInput.addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 9);
});

// 1. Cargar provincias al iniciar
document.addEventListener("DOMContentLoaded", cargarProvincias);

async function cargarProvincias() {
  provinciaSelect.innerHTML = `<option value="">Seleccioná...</option>`;
  try {
    const res = await fetch(`${API_BASE_URL}/api/provincias`);
    const provincias = await res.json();
    provincias.forEach(p => {
      provinciaSelect.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });
  } catch {
    provinciaSelect.innerHTML = `<option value="">Error al cargar</option>`;
  }
}

// 2. Al seleccionar provincia, cargar localidades
provinciaSelect.addEventListener("change", async function () {
  const provinciaId = this.value;
  localidadSelect.innerHTML = `<option value="">Seleccioná...</option>`;
  if (!provinciaId) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/localidades?provincia_id=${provinciaId}`);
    const localidades = await res.json();
    localidades.forEach(l => {
      localidadSelect.innerHTML += `<option value="${l.id}">${l.nombre}</option>`;
    });
  } catch {
    localidadSelect.innerHTML = `<option value="">Error al cargar</option>`;
  }
});

// 3. Validación de solo números en teléfono
form.telefono.addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '');
});

// 4. Checkbox "Nunca doné"
nuncaDoneCheck.addEventListener("change", function () {
  if (this.checked) {
    fechaUltimaDonacionInput.value = "";
    fechaUltimaDonacionInput.disabled = true;
  } else {
    fechaUltimaDonacionInput.disabled = false;
  }
});

// 5. Envío del formulario
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  // ---- VALIDACIONES DE DNI ----
  const dni = dniInput.value;
  if (!dni.match(/^\d{7,9}$/)) {
    alert("El DNI debe tener entre 7 y 9 dígitos numéricos.");
    dniInput.focus();
    return;
  }

  // ---- VALIDACIONES DE FECHA DE NACIMIENTO ----
  const fechaNacimiento = fechaNacimientoInput.value;
  const hoy = new Date();
  const fechaNac = new Date(fechaNacimiento);

  // Fecha de nacimiento no puede ser futura
  if (fechaNac > hoy) {
    alert('La fecha de nacimiento no puede ser en el futuro.');
    return;
  }
  // Tiene que tener al menos 18 años
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mes = hoy.getMonth() - fechaNac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }
  if (edad < 18) {
    alert('Debés ser mayor de 18 años para donar sangre.');
    return;
  }

  // ---- VALIDACIONES DE FECHA ÚLTIMA DONACIÓN ----
  const fechaUltimaDonacion = fechaUltimaDonacionInput.value;
  if (!nuncaDoneCheck.checked && fechaUltimaDonacion) {
    const fechaUltDon = new Date(fechaUltimaDonacion);
    if (fechaUltDon > hoy) {
      alert('La fecha de última donación no puede ser en el futuro.');
      return;
    }
    if (fechaUltDon < fechaNac) {
      alert('La fecha de última donación no puede ser anterior a tu nacimiento.');
      return;
    }
  }

  // ---- VALIDACIÓN SIMPLE DE CAMPOS ----
  if (!form.grupo_sanguineo.value || !fechaNacimiento ||
      !form.sexo.value ||
      !form.provincia_id.value || !form.localidad_id.value ||
      !form.telefono.value.match(/^\d{7,15}$/)) {
    alert("Completá todos los campos correctamente.");
    return;
  }

  // Preparar datos
  const datos = Object.fromEntries(new FormData(form).entries());
  if (nuncaDoneCheck.checked) {
    datos.fecha_ultima_donacion = "";
  }

  // Enviar datos al backend
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/donantes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(datos),
    });
    if (res.ok) {
      form.style.display = "none";
      mensajeExito.style.display = "block";
      mensajeExito.innerHTML = `
        <strong>¡Registro exitoso!</strong><br>
        Ya sos parte de la red de donantes.<br>
        <button onclick="window.location.href='./dashboard-donante.html'">Ir a mi panel</button>
      `;
    } else {
      const { error } = await res.json();
      alert("Error: " + (error || "No se pudo registrar."));
    }
  } catch (err) {
    alert("Error al conectar con el servidor.");
  }
});
