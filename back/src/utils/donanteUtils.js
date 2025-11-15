// En este archivo calculo la aptitud y los dias restantes del donante
function calcularAptoYRestante(fechaUltimaDonacion, sexo, hoy = new Date()) {
  const espera = sexo === 'F' ? 90 : 60;
  if (!fechaUltimaDonacion) return { apto: true, dias_restantes: 0 };

  const fechaUltima = new Date(fechaUltimaDonacion);
  const diffDias = Math.floor((hoy - fechaUltima) / (1000 * 60 * 60 * 24));
  const faltan = espera - diffDias;
  return {
    apto: diffDias >= espera,
    dias_restantes: diffDias >= espera ? 0 : faltan
  };
}

module.exports = { calcularAptoYRestante };
