import { API_BASE_URL } from "./config.js";
import {
  esTokenExpirado,
  manejarExpiracionSesion,
} from "./sessionManager.js";

export async function apiFetch(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("token");

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    // Ignorar si no hay body
  }

  if (!response.ok) {
    if (response.status === 401 && esTokenExpirado(data)) {
      manejarExpiracionSesion();
    }

    const mensaje =
      data?.message ||
      data?.error ||
      "Error en la petición a la API";
    throw new Error(mensaje);
  }

  return data;
}
