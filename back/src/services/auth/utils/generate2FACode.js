// En este archivo genero codigos simples de 2FA
function generate2FACode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { generate2FACode };
