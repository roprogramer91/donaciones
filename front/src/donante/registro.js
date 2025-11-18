import { API_BASE_URL } from "../utils/config.js";

const form = document.getElementById("registroForm");
const mensaje = document.getElementById("mensaje");

// Solo números en DNI
const dniInput = document.getElementById("dni");
dniInput.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 9);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensaje.innerHTML = "";

  const nombre = form.nombre.value.trim();
  const apellido = form.apellido.value.trim();
  const email = form.email.value.trim();
  const dni = form.dni.value.trim();
  const telefono = form.telefono.value.trim(); // Capturo el teléfono
  const password = form.password.value;
  const password2 = form.password2.value;

  // Validar contraseñas
  if (password !== password2) {
    mensaje.style.color = "red";
    mensaje.textContent = "Las contraseñas no coinciden.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        apellido,
        email,
        dni,
        telefono,
        password,
      }), // Lo envío al backend
    });

    const data = await res.json();

    if (!res.ok) {
      mensaje.style.color = "red";
      mensaje.textContent = data.message || "Error al registrar usuario.";
      return;
    }

    // Guardar email y password TEMPORALMENTE para login automático
    localStorage.setItem("email_temp", email);
    localStorage.setItem("password_temp", password);
    // Guardar usuario_id para el siguiente paso
    localStorage.setItem("usuario_id", data.usuario_id);

    mensaje.style.color = "green";
    mensaje.innerHTML = "Cuenta creada. Redirigiendo...";

    setTimeout(() => {
      window.location.href = "./alta-donante.html";
    }, 1200);
  } catch (error) {
    mensaje.style.color = "red";
    mensaje.textContent = "Error al conectar con el servidor.";
  }
});
