import { API_BASE_URL } from "../utils/config.js";

const form = document.getElementById("verifyForm");
const codigoInput = document.getElementById("codigo");
const mensaje = document.getElementById("mensaje");

// Tomar usuario_id y token temporal
const usuario_id = localStorage.getItem("usuario_id");
const temp_token = localStorage.getItem("temp_token");

if (!usuario_id || !temp_token) {
  mensaje.textContent = "Error: sesión no iniciada.";
  mensaje.style.color = "red";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensaje.textContent = "";

  const codigo = codigoInput.value.trim();

  if (!codigo) {
    mensaje.textContent = "Ingresá el código.";
    mensaje.style.color = "red";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${temp_token}`,
      },
      body: JSON.stringify({
        usuario_id,
        codigo
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      mensaje.textContent = data.message || "Código incorrecto.";
      mensaje.style.color = "red";
      return;
    }

    // Guardar token final
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.tipo_usuario);

    // Limpiar temporales
    localStorage.removeItem("temp_token");

    mensaje.style.color = "green";
    mensaje.textContent = "Verificado. Redirigiendo...";

    setTimeout(() => {
      window.location.href = "../donante/dashboard-donante.html";
    }, 800);

  } catch (err) {
    mensaje.textContent = "Error al conectar.";
    mensaje.style.color = "red";
  }
});
