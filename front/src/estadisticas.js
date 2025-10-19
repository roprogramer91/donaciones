import { API_BASE_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [donantes, solicitantes] = await Promise.all([
      fetch(`${API_BASE_URL}/donantes`).then(r => r.json()),
      fetch(`${API_BASE_URL}/solicitudes`).then(r => r.json())
    ]);

    // grafico torta - Tipos de sangre
    const sangreContador = {};
    donantes.forEach(d => {
      sangreContador[d.grupo_sanguineo] = (sangreContador[d.grupo_sanguineo] || 0) + 1;
    });

    new Chart(document.getElementById("graficoTipoSangre"), {
      type: "pie",
      data: {
        labels: Object.keys(sangreContador),
        datasets: [{
          data: Object.values(sangreContador),
          backgroundColor: [
            "#FF6384", "#36A2EB", "#FFCE56",
            "#4BC0C0", "#9966FF", "#FF9F40",
            "#66bb6a", "#ef5350"
          ]
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "Distribución de Grupos Sanguíneos"
          }
        }
      }
    });

 // Histograma - Edades
const edades = donantes.map(d => d.edad);
const edadesAgrupadas = {};

// Agrupamos por decenas (ej: 30-39, 40-49, etc.)
edades.forEach(e => {
  const rangoInicio = Math.floor(e / 10) * 10;
  const rangoFin = rangoInicio + 9;
  const grupo = `${rangoInicio}-${rangoFin}`;
  edadesAgrupadas[grupo] = (edadesAgrupadas[grupo] || 0) + 1;
});

// Ordenamos las etiquetas por rango numérico (clave)
const etiquetasOrdenadas = Object.keys(edadesAgrupadas).sort((a, b) => {
  const [aStart] = a.split('-').map(Number);
  const [bStart] = b.split('-').map(Number);
  return aStart - bStart;
});

new Chart(document.getElementById("graficoEdades"), {
  type: "bar",
  data: {
    labels: etiquetasOrdenadas,
    datasets: [{
      label: "Cantidad de Donantes",
      data: etiquetasOrdenadas.map(grupo => edadesAgrupadas[grupo]),
      backgroundColor: "#42a5f5"
    }]
  },
  options: {
    plugins: {
      title: {
        display: true,
        text: "Distribución de Edad de Donantes"
      }
    }
  }
});


    // Grafico de barras - Donantes vs Solicitantes
    new Chart(document.getElementById("graficoTotales"), {
      type: "bar",
      data: {
        labels: ["Donantes", "Solicitantes"],
        datasets: [{
          label: "Cantidad total",
          data: [donantes.length, solicitantes.length],
          backgroundColor: ["#66bb6a", "#ef5350"]
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "Cantidad total de Donantes y Solicitantes"
          }
        }
      }
    });

  } catch (err) {
    console.error("Error al cargar estadísticas:", err);
  }
});
