// En este archivo manejo todas las validaciones especificas de los donantes.

/**
 * Valida las respuestas del pre-test para determinar si un potencial donante es apto.
 * Basado en requisitos comunes de donación de sangre.
 *
 * @param {object} respuestas - Un objeto con las respuestas del pre-test.
 * @param {number} respuestas.edad - Edad del donante.
 * @param {number} respuestas.peso - Peso en kg del donante.
 * @param {boolean} respuestas.tatuaje_piercing_ultimo_anio - ¿Se hizo tatuajes o piercings en el último año?
 * @param {boolean} respuestas.enfermedad_transmisible - ¿Padece alguna enfermedad transmisible por sangre?
 * @param {boolean} respuestas.relaciones_sexuales_riesgo - ¿Tuvo relaciones sexuales de riesgo en el último año?
 * @param {boolean} respuestas.viaje_zona_endemica - ¿Viajó a una zona endémica de enfermedades en el último año?
 *
 * @returns {{esApto: boolean, errores: string[]}} - Un objeto indicando si es apto y una lista de errores si no lo es.
 */
const validarPretest = (respuestas) => {
  const errores = [];

  // 1. Validar Edad (entre 18 y 65 años)
  if (respuestas.edad < 18) {
    errores.push("Debes ser mayor de 18 años para poder donar.");
  }
  if (respuestas.edad > 65) {
    errores.push("No podés donar si tenés más de 65 años.");
  }

  // 2. Validar Peso (mínimo 50 kg)
  if (respuestas.peso < 50) {
    errores.push("Debes pesar más de 50 kg para poder donar.");
  }

  // 3. Validar Tatuajes, piercings, etc. en el último año
  if (respuestas.tatuaje_piercing_ultimo_anio) {
    errores.push(
      "Debes esperar al menos 12 meses después de hacerte un tatuaje o piercing para poder donar."
    );
  }

  // 4. Validar enfermedades transmisibles
  if (respuestas.enfermedad_transmisible) {
    errores.push(
      "No podés donar si padecés enfermedades transmisibles por sangre."
    );
  }

  // 5. Validar comportamiento de riesgo
  if (respuestas.relaciones_sexuales_riesgo) {
    errores.push(
      "Por situaciones de riesgo, debes esperar un período antes de donar. Consultá con el centro de hemoterapia."
    );
  }

  // 6. Validar viajes a zonas endémicas
  if (respuestas.viaje_zona_endemica) {
    errores.push(
      "Si viajaste a una zona de riesgo endémico, debes esperar un período antes de donar."
    );
  }

  return {
    esApto: errores.length === 0,
    errores,
  };
};

module.exports = {
  validarPretest,
};
