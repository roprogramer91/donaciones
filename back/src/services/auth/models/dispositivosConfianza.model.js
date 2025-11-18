// En este archivo manejo la lógica de los dispositivos de confianza para 2FA
const pool = require("../../../config/database");
const crypto = require("crypto");

const DispositivosConfianza = {
  async crear(usuarioId, userAgent, ip) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // El dispositivo será de confianza por 30 días

    const q = `
      INSERT INTO dispositivos_confianza (usuario_id, token_dispositivo, user_agent, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const { rows } = await pool.query(q, [
      usuarioId,
      token,
      userAgent,
      ip,
      expires,
    ]);
    return rows[0];
  },

  async findValidToken(token) {
    const q = `
      SELECT * FROM dispositivos_confianza
      WHERE token_dispositivo = $1 AND expires_at > NOW()
      LIMIT 1;
    `;
    const { rows } = await pool.query(q, [token]);
    return rows[0];
  },

  async eliminar(token) {
    await pool.query(
      "DELETE FROM dispositivos_confianza WHERE token_dispositivo = $1",
      [token]
    );
  },
};

module.exports = DispositivosConfianza;
