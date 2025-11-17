// En este archivo manejo la tarea programada para enviar saludos de cumpleaños.
const cron = require("node-cron");
const DonantesModel = require("../models/donantes.model");
const NotificacionesModel = require("./models/notificaciones.model"); // Corrijo la importación para que apunte al modelo real

console.log("Worker de cumpleaños inicializado.");

/**
 * Tarea programada (cron job) que se ejecuta todos los días a las 9:00 AM.
 * Busca donantes que cumplen años y les envía una notificación y un email.
 */
const tareaCumpleanios = cron.schedule(
  "0 9 * * *",
  async () => {
    console.log("Ejecutando tarea de cumpleaños...");

    try {
      const cumpleaneros = await DonantesModel.obtenerCumpleanerosDelDia();

      if (cumpleaneros.length === 0) {
        console.log("No hay donantes que cumplan años hoy.");
        return;
      }

      console.log(
        `Se encontraron ${cumpleaneros.length} cumpleañeros hoy. Enviando notificaciones...`
      );

      for (const donante of cumpleaneros) {
        const mensaje = `¡Feliz cumpleaños, ${donante.nombre}! El equipo de DonacionSangre te desea un día genial. Gracias por tu compromiso.`;

        await NotificacionesModel.enviarNotificacionIndividual({
          usuario_id: donante.usuario_id,
          tipo: "cumpleanios",
          mensaje: mensaje,
          email_destinatario: donante.email,
          email_asunto: "¡Feliz Cumpleaños!",
        });
      }
    } catch (error) {
      console.error("Error en la tarea programada de cumpleaños:", error);
    }
  },
  {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires",
  }
);

module.exports = tareaCumpleanios;
