
// src/utils/config.js
import { instalarInterceptorFetch } from "./sessionManager.js";

const CONFIG = {
  development: {
    API_BASE_URL: "http://localhost:3000",
    AUTH_URL: "http://localhost:3000/api",
  },
  staging: {
    API_BASE_URL: "https://donaciones-back-dev-entorno.up.railway.app/api",
    AUTH_URL: "https://donaciones-back-dev-entorno.up.railway.app/api",
  },
  production: {
    API_BASE_URL: "https://donaciones-production.up.railway.app/api",
    AUTH_URL: "https://donaciones-auth-service-production.up.railway.app/api",
  },
};

const hostname = window.location.hostname;
const ENV_OVERRIDE_KEY = "DONACIONES_ENV"; // usar localStorage.setItem(..., "staging") para forzar

let ENV =
  hostname.includes("localhost") || hostname.includes("127.0.0.1")
    ? "development"
    : "production";

const forcedEnv = localStorage.getItem(ENV_OVERRIDE_KEY);
if (forcedEnv && CONFIG[forcedEnv]) {
  ENV = forcedEnv;
}

if (!CONFIG[ENV]) {
  ENV = "production";
}

export const API_BASE_URL = CONFIG[ENV].API_BASE_URL;
export const AUTH_URL = CONFIG[ENV].AUTH_URL;

instalarInterceptorFetch();
