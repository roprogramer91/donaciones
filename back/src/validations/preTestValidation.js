
const validarPreTest = (respuestas) => {
  const errores = {};

  // 1. Validar edad
  const edad = respuestas.edad;
  if (!edad || edad < 18 || edad > 65) {
    errores.edad = 'Debes tener entre 18 y 65 años para poder donar.';
  }

  // 2. Validar peso
  const peso = respuestas.peso;
  if (!peso || peso <= 50) {
    errores.peso = 'Debes pesar más de 50 kg para poder donar.';
  }

  // 3. Validar tatuajes/piercings
  const tatuajes = respuestas.tatuajes;
  if (tatuajes === true) {
    errores.tatuajes = 'No puedes donar si te has hecho un tatuaje o piercing en los últimos 12 meses.';
  }

  // 4. Validar enfermedades
  const enfermedades = respuestas.enfermedades;
  if (enfermedades === true) {
    errores.enfermedades = 'No puedes donar si tienes alguna enfermedad infecciosa.';
  }

  const esValido = Object.keys(errores).length === 0;

  return {
    esValido,
    errores,
  };
};

module.exports = {
  validarPreTest,
};
