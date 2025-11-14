// src/utils/tokenValidator.js
import { apiFetch } from "./api.js";

// ✅ Verifica con el backend si el token sigue siendo válido
export async function validateToken() {
  const token = localStorage.getItem("token");

  if (!token) return false;

  try {
    const response = await apiFetch("/auth/validate", "GET", null, token);

    // Si el backend confirma el token
    if (response && response.valid) return true;

    // Si responde algo inválido
    console.warn("⚠️ Token inválido o expirado:", response?.message);
    clearAuthData();
    return false;
  } catch (error) {
    console.error("❌ Error validando token:", error);
    clearAuthData();
    return false;
  }
}

// ✅ Limpia la sesión
export function clearAuthData() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("dni");
}
