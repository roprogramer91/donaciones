import { apiFetch } from "../utils/api.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const dni = document.getElementById("dni").value.trim();
  const password = document.getElementById("password").value.trim();
  message.textContent = "";

  try {
    const res = await apiFetch("/auth/login", "POST", { dni, password });
    console.log("🔍 Respuesta backend:", res); // para verificar qué devuelve

    // ✅ Guardar usuario_id sin importar el nombre de la clave
    const userId =
      res.usuario_id || res.user_id || (res.user && res.user.id) || null;

    if (userId) {
      sessionStorage.setItem("usuario_id", userId);
      console.log("✅ usuario_id guardado en sessionStorage:", userId);
    } else {
      console.warn("⚠️ No se recibió usuario_id del backend.");
    }

    // ✅ Flujo de 2FA
    if (res.message && res.message.includes("Código 2FA")) {
      sessionStorage.setItem("dni", dni);

      message.style.color = "green";
      message.textContent = "Código 2FA enviado a tu correo. Redirigiendo...";

      setTimeout(() => {
        window.location.href = "./verify.html";
      }, 1500);
    } else {
      message.style.color = "red";
      message.textContent = res.message || "Error en el inicio de sesión.";
    }
  } catch (error) {
    console.error("❌ Error al conectar con el servidor:", error);
    message.style.color = "red";
    message.textContent = "Error al conectar con el servidor.";
  }
});
