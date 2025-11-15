// En este archivo manejo la logica completa de donantes
const Donante = require('../models/donantes.model');
const CampaniasModel = require('../models/campanias.model');
const { validarDNI, validarFechaNacimiento, validarGrupo } = require('../validations/donanteValidations');
const { calcularAptoYRestante } = require('../utils/donanteUtils');

// Aqui creo un donante nuevo
const crearDonante = async (req, res) => {
  const usuarioId = Number(req.body.usuario_id); // Aqui tomo el id que llega en el body

  if (!usuarioId) {
    return res.status(400).json({ error: "usuario_id faltante o inválido" });
  }

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
    res.status(201).json({
      mensaje: 'Donante agregado exitosamente',
      donante: donanteCreado
    });

  } catch (error) {
    console.error('Error al guardar donante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


// Aqui obtengo todos los donantes y calculo su aptitud
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

// Aqui armo el perfil completo del donante autenticado
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

// Aqui busco al donante por email para los flujos de login
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

// Aqui aplico los filtros del dashboard de centros
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

    // Aqui preparo los filtros adicionales para campanias
    let salida = resultado;

    // Aqui aplico el filtro opcional de aptitud
    const soloAptos = String(req.query.apto).toLowerCase() === 'true';
    if (soloAptos) {
      salida = salida.filter(d => d.apto_para_donar);
    }

    // Aqui valido los rangos de edad
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

    // Aqui filtro por la fecha de ultima donacion
    if (req.query.ultima_donacion_antes) {
      const limite = new Date(req.query.ultima_donacion_antes);
      if (!isNaN(limite)) {
        salida = salida.filter(d => {
          if (!d.fecha_ultima_donacion) return true; // Aqui incluyo los casos sin fecha
          const f = new Date(d.fecha_ultima_donacion);
          return f <= limite;
        });
      }
    }

    // Aqui aplico el maximo de dias restantes
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


async function editarPerfilDonante(req, res) {
  const usuarioId = req.user && req.user.id;
  if (!usuarioId) {
    return res.status(401).json({ mensaje: 'Token no proporcionado' });
  }
// Aqui defino que campos se pueden editar
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

// Aqui solo copio los campos permitidos
for (const k of ALLOWED) {
  if (Object.prototype.hasOwnProperty.call(payload, k) && payload[k] !== undefined) {
    data[k] = payload[k];
  }
}

// Aqui normalizo los ids numericos recibidos como string
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

// Aqui guardo los datos actualizados
const actualizado = await Donante.updatePerfilByUsuarioId(usuarioId, data);
if (!actualizado) {
  return res.status(404).json({ error: 'No sos donante registrado' });
}

return res.json({
  mensaje: 'Perfil actualizado',
  perfil: actualizado
});

}


module.exports = {
  crearDonante,
  obtenerDonantes,
  getDonanteByEmail,
  getPerfilDonanteCompleto,
  filtrarDonantes,
  editarPerfilDonante
};

// Aqui preparo los handlers relacionados a campanias
async function campaniasParaDonante(req, res) {
  try {
    const usuarioId = req.user && req.user.id;
    if (!usuarioId) return res.status(401).json({ mensaje: 'Token no proporcionado' });

    const perfil = await Donante.getPerfilCompletoByUsuarioId(usuarioId);
    if (!perfil || !perfil.localidad_id) {
      return res.status(404).json({ error: 'No se encontró localidad del donante' });
    }

    // Aqui comparo fechas sin considerar la zona horaria
    const today = new Date();
    const hoy = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const campanias = await CampaniasModel.obtenerPorLocalidad(perfil.localidad_id);
    // Aqui marco las campanias donde el usuario esta inscripto
    const inscripciones = await CampaniasModel.listarInscripcionesPorUsuario(usuarioId);
    const inscSet = new Set(inscripciones.map(c => c.id));
    const mapEstado = (c) => {
      const fi0 = c.fecha_inicio ? new Date(c.fecha_inicio) : null;
      const ff0 = c.fecha_fin ? new Date(c.fecha_fin) : null;
      const fi = fi0 ? new Date(fi0.getFullYear(), fi0.getMonth(), fi0.getDate()) : null;
      const ff = ff0 ? new Date(ff0.getFullYear(), ff0.getMonth(), ff0.getDate()) : null;
      if (fi && ff) {
        if (fi <= hoy && hoy <= ff) return 'activa';
        if (ff < hoy) return 'finalizada';
        if (fi > hoy) return 'futura';
      } else if (fi && !ff) {
        return fi <= hoy ? 'activa' : 'futura';
      } else if (!fi && ff) {
        return hoy <= ff ? 'activa' : 'finalizada';
      }
      const est = (c.estado || '').toLowerCase();
      if (est.includes('cancel')) return 'cancelada';
      if (est.includes('final')) return 'finalizada';
      if (est.includes('act')) return 'activa';
      if (est.includes('fut')) return 'futura';
      return 'desconocido';
    };

    // Aqui incluyo campanias activas y futuras para preinscripciones
    const enriquecidas = campanias.map(c => {
      const estado_calculado = mapEstado(c);
      let dias_para_inicio = null;
      if (c.fecha_inicio) {
        const fi0 = new Date(c.fecha_inicio);
        const fi = new Date(fi0.getFullYear(), fi0.getMonth(), fi0.getDate());
        dias_para_inicio = Math.ceil((fi - hoy) / (1000*60*60*24));
      }
      const ya_inscripto = inscSet.has(c.id);
      const inscribible = !ya_inscripto && ['activa','futura'].includes(estado_calculado);
      return { ...c, estado_calculado, dias_para_inicio, inscribible, ya_inscripto };
    });

    // Aqui ordeno priorizando activas y luego futuras por fecha
    const visibles = enriquecidas
      .filter(c => c.estado_calculado === 'activa' || c.estado_calculado === 'futura')
      .sort((a,b) => {
        const rank = s => (s==='activa'?0:(s==='futura'?1:2));
        const ra = rank(a.estado_calculado), rb = rank(b.estado_calculado);
        if (ra !== rb) return ra - rb;
        const da = a.fecha_inicio ? new Date(a.fecha_inicio) : null;
        const db = b.fecha_inicio ? new Date(b.fecha_inicio) : null;
        if (da && db) return da - db;
        if (da && !db) return -1;
        if (!da && db) return 1;
        return 0;
      });

    res.json({ localidad_id: perfil.localidad_id, localidad_nombre: perfil.localidad_nombre, campanias: visibles });
  } catch (error) {
    console.error('Error al obtener campañas para donante:', error);
    res.status(500).json({ error: 'Error al obtener campañas' });
  }
}

async function asistirCampania(req, res) {
  try {
    const usuarioId = req.user && req.user.id;
    if (!usuarioId) return res.status(401).json({ mensaje: 'Token no proporcionado' });

    const { id } = req.params; // Aqui guardo el id de la campania
    const campaniaId = parseInt(id, 10);
    if (!campaniaId) return res.status(400).json({ error: 'campania_id inválido' });

    const camp = await CampaniasModel.obtenerPorId(campaniaId);
    if (!camp) return res.status(404).json({ error: 'Campaña no encontrada' });

    // Aqui valido que la campania permita inscripcion
    const today = new Date();
    const hoy = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const fi0 = camp.fecha_inicio ? new Date(camp.fecha_inicio) : null;
    const ff0 = camp.fecha_fin ? new Date(camp.fecha_fin) : null;
    const fi = fi0 ? new Date(fi0.getFullYear(), fi0.getMonth(), fi0.getDate()) : null;
    const ff = ff0 ? new Date(ff0.getFullYear(), ff0.getMonth(), ff0.getDate()) : null;
    const estado = (() => {
      if (fi && ff) {
        if (fi <= hoy && hoy <= ff) return 'activa';
        if (ff < hoy) return 'finalizada';
        if (fi > hoy) return 'futura';
      } else if (fi && !ff) {
        return fi <= hoy ? 'activa' : 'futura';
      } else if (!fi && ff) {
        return hoy <= ff ? 'activa' : 'finalizada';
      }
      return (camp.estado || '').toLowerCase();
    })();
    if (estado && ['finalizada','cancelada'].includes(estado)) {
      return res.status(400).json({ error: 'La campaña no admite nuevas inscripciones' });
    }

    const rel = await CampaniasModel.inscribirDonante(campaniaId, usuarioId);
    res.json({ mensaje: 'Inscripción registrada', inscripcion: rel });
  } catch (error) {
    console.error('Error al inscribir donante en campaña:', error);
    res.status(500).json({ error: 'Error al inscribirse a la campaña', detalle: String(error && error.message || error) });
  }
}

async function cancelarAsistencia(req, res) {
  try {
    const usuarioId = req.user && req.user.id;
    if (!usuarioId) return res.status(401).json({ mensaje: 'Token no proporcionado' });
    const { id } = req.params;
    const campaniaId = parseInt(id, 10);
    if (!campaniaId) return res.status(400).json({ error: 'campania_id inválido' });

    const deleted = await CampaniasModel.cancelarInscripcion(campaniaId, usuarioId);
    if (!deleted) return res.status(404).json({ error: 'No estabas inscripto en esta campaña' });
    res.json({ mensaje: 'Inscripción cancelada' });
  } catch (error) {
    console.error('Error al cancelar inscripción:', error);
    res.status(500).json({ error: 'Error al cancelar inscripción', detalle: String(error && error.message || error) });
  }
}

// Aqui exporto las funciones de forma clara
module.exports.campaniasParaDonante = campaniasParaDonante;
module.exports.asistirCampania = asistirCampania;
module.exports.cancelarAsistencia = cancelarAsistencia;

// Aqui ejecuto la baja definitiva del donante
module.exports.darBajaDonante = async function(req, res) {
  try {
    const usuarioId = req.user && req.user.id;
    if (!usuarioId) return res.status(401).json({ mensaje: 'Token no proporcionado' });
    const { dni } = req.body || {};
    if (!dni) return res.status(400).json({ error: 'Debe ingresar DNI para confirmar' });

    const perfil = await Donante.findByUsuarioId(usuarioId);
    if (!perfil) return res.status(404).json({ error: 'No sos donante registrado' });
    const normalizar = (s) => String(s || '').replace(/\D/g,'');
    if (normalizar(perfil.dni) !== normalizar(dni)) {
      return res.status(400).json({ error: 'DNI no coincide' });
    }

    await Donante.bajaTotalByUsuarioId(usuarioId);
    return res.json({ mensaje: 'Baja realizada' });
  } catch (e) {
    console.error('Error en darBajaDonante:', e);
    res.status(500).json({ error: 'Error al dar de baja', detalle: String(e && e.message || e) });
  }
};

// Aqui administro las notificaciones del donante
const Notificaciones = require('../models/notificaciones.model');
module.exports.getMisNotificaciones = async function(req, res) {
  try {
    const usuarioId = req.user && req.user.id;
    if (!usuarioId) return res.status(401).json({ mensaje: 'Token no proporcionado' });
    const lista = await Notificaciones.getForUsuario(usuarioId, 30);
    res.json(lista);
  } catch (e) {
    console.error('Error al traer notificaciones:', e);
    res.status(500).json({ error: 'Error al traer notificaciones' });
  }
};

module.exports.marcarNotificacionLeida = async function(req, res) {
  try {
    const usuarioId = req.user && req.user.id;
    if (!usuarioId) return res.status(401).json({ mensaje: 'Token no proporcionado' });
    const { id } = req.params;
    const n = await Notificaciones.marcarLeida(id, usuarioId);
    if (!n) return res.status(404).json({ error: 'No encontrada' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Error al marcar notificación:', e);
    res.status(500).json({ error: 'Error al marcar notificación' });
  }
};


