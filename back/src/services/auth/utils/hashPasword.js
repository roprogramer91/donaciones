// En este archivo hasheo las contrasenias de manera consistente
const bcrypt = require('bcrypt');

async function hashPassword(plainPassword) {
  const saltRounds = 10; // Aqui busco un equilibrio entre seguridad y rendimiento
  const hashed = await bcrypt.hash(plainPassword, saltRounds);
  return hashed;
}

module.exports = { hashPassword };
