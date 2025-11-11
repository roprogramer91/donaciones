// services/auth/utils/hashPassword.js
const bcrypt = require('bcrypt');

async function hashPassword(plainPassword) {
  const saltRounds = 10; // equilibrio entre seguridad y rendimiento
  const hashed = await bcrypt.hash(plainPassword, saltRounds);
  return hashed;
}

module.exports = { hashPassword };
