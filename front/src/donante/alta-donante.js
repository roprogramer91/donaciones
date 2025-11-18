import { API_BASE_URL } from "../utils/config.js";

const provinciaSelect = document.getElementById("provincia_id");
const localidadSelect = document.getElementById("localidad_id");
const form = document.getElementById("altaDonanteForm");
const mensajeExito = document.getElementById("mensajeExito");
const fechaNacimientoInput = document.getElementById("fecha_nacimiento");
const fechaUltimaDonacionInput = document.getElementById(
  "fecha_ultima_donacion"
);
const nuncaDoneCheck = document.getElementById("nunca_done");

// ----------------------------
// 1) Cargar usuario_id guardado
// ----------------------------
const usuario_id = localStorage.getItem("usuario_id");
console.log("Usuario ID para donante:", usuario_id);
// Setear fecha máxima hoy
const today = new Date().toISOString().split("T")[0];
fechaNacimientoInput.setAttribute("max", today);
fechaUltimaDonacionInput.setAttribute("max", today);

// ----------------------------
// 2) Cargar provincias
// ----------------------------
document.addEventListener("DOMContentLoaded", cargarProvincias);

async function cargarProvincias() {
  provinciaSelect.innerHTML = `<option value="">Seleccioná...</option>`;
  try {
    const res = await fetch(`${API_BASE_URL}/api/provincias`);
    const provincias = await res.json();
    provincias.forEach((p) => {
      provinciaSelect.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });
  } catch {
    provinciaSelect.innerHTML = `<option value="">Error al cargar</option>`;
  }
}

// ----------------------------
// 3) Cargar localidades por provincia
// ----------------------------
provinciaSelect.addEventListener("change", async function () {
  const provinciaId = this.value;
  localidadSelect.innerHTML = `<option value="">Seleccioná...</option>`;
  if (!provinciaId) return;

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/localidades?provincia_id=${provinciaId}`
    );
    const localidades = await res.json();
    localidades.forEach((l) => {
      localidadSelect.innerHTML += `<option value="${l.id}">${l.nombre}</option>`;
    });
  } catch {
    localidadSelect.innerHTML = `<option value="">Error al cargar</option>`;
  }
});

// ----------------------------
// 5) Checkbox “Nunca doné”
// ----------------------------
nuncaDoneCheck.addEventListener("change", function () {
  if (this.checked) {
    fechaUltimaDonacionInput.value = "";
    fechaUltimaDonacionInput.disabled = true;
  } else {
    fechaUltimaDonacionInput.disabled = false;
  }
});

// ----------------------------
// 6) Envío del formulario
// ----------------------------
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const fechaNacimiento = fechaNacimientoInput.value;
  const hoy = new Date();
  const fechaNac = new Date(fechaNacimiento);

  if (fechaNac > hoy) {
    return alert("La fecha de nacimiento no puede ser futura.");
  }

  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mes = hoy.getMonth() - fechaNac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) edad--;

  if (edad < 18) {
    return alert("Debés ser mayor de 18 años.");
  }

  const fechaUltimaDonacion = fechaUltimaDonacionInput.value;
  if (!nuncaDoneCheck.checked && fechaUltimaDonacion) {
    const fechaUlt = new Date(fechaUltimaDonacion);
    if (fechaUlt > hoy)
      return alert("La fecha de última donación no puede ser futura.");
    if (fechaUlt < fechaNac)
      return alert("La fecha de donación no puede ser antes de nacer.");
  }

  if (
    !form.grupo_sanguineo.value ||
    !fechaNacimiento ||
    !form.sexo.value ||
    !form.provincia_id.value ||
    !form.localidad_id.value
  ) {
    return alert("Completá todos los campos correctamente.");
  }

  // ----------------------------
  // 7) Preparar datos
  // ----------------------------
  const datos = Object.fromEntries(new FormData(form).entries());
  datos.usuario_id = usuario_id;

  // Ya no enviamos dni ni telefono desde acá, porque están en la tabla de usuarios.
  delete datos.dni;
  delete datos.telefono;

  if (nuncaDoneCheck.checked) datos.fecha_ultima_donacion = "";

  // ----------------------------
  // 8) Guardar el donante en BD
  // ----------------------------
  try {
    const res = await fetch(`${API_BASE_URL}/api/donantes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    if (!res.ok) {
      const { error } = await res.json();
      return alert("Error: " + (error || "No se pudo registrar el donante."));
    }

    // ----------------------------
    // 9) LOGIN AUTOMÁTICO
    // ----------------------------
    const email = localStorage.getItem("email_temp");
    const password = localStorage.getItem("password_temp");

    if (!email || !password) {
      alert("Cuenta creada, pero no se pudo iniciar sesión automáticamente.");
      return (window.location.href = "./login.html");
    }

    const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, skip2FA: true }), // LOGIN POR EMAIL + CONTRASEÑA, salteando 2FA
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      alert("Registrado, pero error al iniciar sesión.");
      return (window.location.href = "./login.html");
    }

    // Guardar token + role
    localStorage.setItem("token", loginData.token);
    localStorage.setItem("tipo_usuario", loginData.tipo_usuario);
    localStorage.setItem("dni", loginData.dni);

    // Limpieza
    localStorage.removeItem("email_temp");
    localStorage.removeItem("password_temp");

    // ----------------------------
    // 10) Redirigir al dashboard
    // ----------------------------
    form.style.display = "none";
    mensajeExito.style.display = "block";
    mensajeExito.innerHTML = `
      <strong>¡Registro completado!</strong><br>
      Redirigiendo a tu panel...
    `;

    setTimeout(() => {
      window.location.href = "./dashboard-donante.html";
    }, 1500);
  } catch (err) {
    console.error("Error detallado al finalizar registro:", err);
    alert("Error al conectar con el servidor.");
  }
});
