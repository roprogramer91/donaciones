// src/utils/api.js
import { API_BASE_URL, AUTH_URL } from "./config.js";

export async function apiFetch(endpoint, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Si el endpoint incluye '/auth/', usamos AUTH_URL
  const baseURL = endpoint.startsWith("/auth") ? AUTH_URL : API_BASE_URL;

  try {
    const res = await fetch(`${baseURL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (!res.ok) {
      console.error("❌ Error HTTP:", res.status, res.statusText);
    }

    return await res.json();
  } catch (error) {
    console.error("❌ Error de conexión con el backend:", error);
    throw new Error("Error de conexión con el servidor");
  }
}
