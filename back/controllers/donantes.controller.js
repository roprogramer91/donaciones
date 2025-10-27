// back/controllers/donantes.controller.js
// Controlador para gestionar donantes

// Importaciones necesarias
const Donante = require('../models/donantes.model');
const { validarDNI, validarFechaNacimiento, validarGrupo } = require('../validations/donanteValidations');
const { calcularAptoYRestante } = require('../utils/donanteUtils');

// Crear donante
const crearDonante = async (req, res) => {
  const usuarioId = req.user.id;
  const nuevoDonante = req.body;

  if (!validarDNI(nuevoDonante.dni)) {
    return res.status(400).json({ error: 'DNI inválido.' });
  }
  if (!validarGrupo(nuevoDonante.grupo_sanguineo)) {
    return res.status(400).json({ error: 'Grupo sanguíneo inválido.' });
  }
  if (!validarFechaNacimiento(nuevoDonante.fecha_nacimiento)) {
    return res.status(400).json({ error: 'Fecha de nacimiento inválida o menor de 18 años.' });
  }

  try {
    const existente = await Donante.findByDni(nuevoDonante.dni);
    if (existente) {
      return res.status(400).json({ error: 'Ya existe un donante con ese DNI.' });
    }

    nuevoDonante.usuario_id = usuarioId;
    if (!nuevoDonante.estado) nuevoDonante.estado = 'activo';

    const donanteCreado = await Donante.guardar(nuevoDonante);
    res.status(201).json({ mensaje: 'Donante agregado exitosamente', donante: donanteCreado });

  } catch (error) {
    console.error('Error al guardar donante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todos los donantes (con cálculo de aptitud)
const obtenerDonantes = async (req, res) => {
  try {
    const donantes = await Donante.obtenerTodos();
    const hoy = new Date();

    const resultado = donantes.map(d => {
      const sexo = d.sexo || 'M';
      const { apto, dias_restantes } = calcularAptoYRestante(d.fecha_ultima_donacion, sexo, hoy);
      return { ...d, apto_para_donar: apto, dias_restantes };
    });

    if (req.query.apto === 'true') {
      return res.json(resultado.filter(d => d.apto_para_donar));
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener donantes:', error);
    res.status(500).json({ error: 'Error al obtener donantes' });
  }
};

// Obtener perfil completo del donante autenticado
const getPerfilDonanteCompleto = async (req, res) => {
  const usuarioId = req.user.id;
  try {
    const perfil = await Donante.getPerfilCompletoByUsuarioId(usuarioId);
    if (!perfil) return res.status(404).json({ error: 'No sos donante registrado' });

    const { apto, dias_restantes } = calcularAptoYRestante(perfil.fecha_ultima_donacion, perfil.sexo);
    perfil.apto_para_donar = apto;
    perfil.dias_restantes = dias_restantes;

    res.json(perfil);
  } catch (err) {
    console.error('Error al traer perfil completo:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Buscar donante por email o usuario (usado en logins)
const getDonanteByEmail = async (req, res) => {
  const email = req.user && req.user.email;
  if (!email) return res.status(400).json({ mensaje: 'Email no proporcionado o no autenticado.' });

  try {
    const donante = await Donante.findByEmail(email);
    if (!donante) return res.status(404).json({ mensaje: 'No sos donante' });
    res.json(donante);
  } catch (err) {
    console.error('Error al buscar donante por email:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

// 🔍 Filtrar donantes (para el dashboard del centro)
const filtrarDonantes = async (req, res) => {
  try {
    const filtros = {
      localidad: req.query.localidad,
      barrio: req.query.barrio,
      provincia: req.query.provincia,
      grupo: req.query.grupo,
      estado: req.query.estado
    };

    const donantes = await Donante.filtrar(filtros);
    const hoy = new Date();

    const resultado = donantes.map(d => {
      const sexo = d.sexo || 'M';
      const { apto, dias_restantes } = calcularAptoYRestante(d.fecha_ultima_donacion, sexo, hoy);
      return { ...d, apto_para_donar: apto, dias_restantes };
    });

    // Filtros adicionales para campañas
    let salida = resultado;

    // Filtro opcional por aptitud (útil para campañas)
    const soloAptos = String(req.query.apto).toLowerCase() === 'true';
    if (soloAptos) {
      salida = salida.filter(d => d.apto_para_donar);
    }

    // Edad min/max
    const edadMin = req.query.edad_min ? parseInt(req.query.edad_min, 10) : null;
    const edadMax = req.query.edad_max ? parseInt(req.query.edad_max, 10) : null;
    if (edadMin !== null || edadMax !== null) {
      const calcEdad = (fecha_nac) => {
        if (!fecha_nac) return null;
        const fn = new Date(fecha_nac);
        let edad = hoy.getFullYear() - fn.getFullYear();
        const m = hoy.getMonth() - fn.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) edad--;
        return edad;
      };
      salida = salida.filter(d => {
        const edad = calcEdad(d.fecha_nacimiento);
        if (edad === null || isNaN(edad)) return false;
        if (edadMin !== null && edad < edadMin) return false;
        if (edadMax !== null && edad > edadMax) return false;
        return true;
      });
    }

    // Última donación antes de fecha (incluye nulos)
    if (req.query.ultima_donacion_antes) {
      const limite = new Date(req.query.ultima_donacion_antes);
      if (!isNaN(limite)) {
        salida = salida.filter(d => {
          if (!d.fecha_ultima_donacion) return true; // sin registro, incluir
          const f = new Date(d.fecha_ultima_donacion);
          return f <= limite;
        });
      }
    }

    // Días restantes máximo
    if (req.query.dias_restantes_max) {
      const max = parseInt(req.query.dias_restantes_max, 10);
      if (!isNaN(max)) {
        salida = salida.filter(d => {
          const dr = (d.dias_restantes ?? 0);
          return dr <= max;
        });
      }
    }

    res.json(salida);
  } catch (error) {
    console.error('Error al filtrar donantes:', error);
    res.status(500).json({ error: 'Error interno al filtrar donantes' });
  }
};


//EDITAR PERFIL DONANTE/////
async function editarPerfilDonante(req, res) {
  const usuarioId = req.user && req.user.id;
  if (!usuarioId) {
    return res.status(401).json({ mensaje: 'Token no proporcionado' });
  }
// Campos editables desde el perfil
const ALLOWED = [
  'grupo_sanguineo',
  'fecha_nacimiento',
  'telefono',
  'provincia_id',
  'localidad_id',
  'barrio_id'
];

const payload = req.body || {};
const data = {};

// Copiar solo campos permitidos si vienen definidos
for (const k of ALLOWED) {
  if (Object.prototype.hasOwnProperty.call(payload, k) && payload[k] !== undefined) {
    data[k] = payload[k];
  }
}

// Normalizar ids numéricos (si vienen como string)
['provincia_id', 'localidad_id', 'barrio_id'].forEach((k) => {
  if (data[k] !== undefined && data[k] !== null && data[k] !== '') {
    const n = parseInt(data[k], 10);
    if (!Number.isNaN(n)) data[k] = n;
    else delete data[k];
  }
});

if (Object.keys(data).length === 0) {
  return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
}

// Persistir
const actualizado = await Donante.updatePerfilByUsuarioId(usuarioId, data);
if (!actualizado) {
  return res.status(404).json({ error: 'No sos donante registrado' });
}

return res.json({
  mensaje: 'Perfil actualizado',
  perfil: actualizado
});

//FIN EDITAR PERFIL DONANTE/////
}


module.exports = {
  crearDonante,
  obtenerDonantes,
  getDonanteByEmail,
  getPerfilDonanteCompleto,
  filtrarDonantes,
  editarPerfilDonante
};
