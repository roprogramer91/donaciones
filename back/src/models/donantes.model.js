// En este archivo manejo todas las consultas de donantes
const db = require("../config/database");

// ----------------------------------------------------------
// Traigo todos los donantes
// ----------------------------------------------------------
const obtenerTodos = async () => {
  const q = `
    select d.*, u.nombre, u.apellido, u.email
    from donantes d
    join usuarios u on d.usuario_id = u.id
    order by d.id desc
  `;
  const { rows } = await db.query(q);
  return rows;
};

// ----------------------------------------------------------
// Guardo un donante nuevo
// ----------------------------------------------------------
const guardar = async (nuevo) => {
  const q = `
    insert into donantes (
      usuario_id, grupo_sanguineo, fecha_nacimiento,
      preferencias_notif, fecha_ultima_donacion, estado,
      provincia_id, localidad_id, barrio_id, sexo
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    returning *
  `;
  const params = [
    nuevo.usuario_id,
    nuevo.grupo_sanguineo,
    nuevo.fecha_nacimiento || null,
    nuevo.preferencias_notif || null,
    nuevo.fecha_ultima_donacion || null,
    nuevo.estado || "activo",
    nuevo.provincia_id || null,
    nuevo.localidad_id || null,
    nuevo.barrio_id || null,
    nuevo.sexo,
  ];

  const { rows } = await db.query(q, params);
  return rows[0];
};

// ----------------------------------------------------------
// Buscar donante por dni
// ----------------------------------------------------------
const findByDni = async (dni) => {
  const q = `select * from donantes where dni = $1 limit 1`;
  const { rows } = await db.query(q, [dni]);
  return rows[0] || null;
};

// ----------------------------------------------------------
// Buscar donante por usuario_id
// ----------------------------------------------------------
const findByUsuarioId = async (usuarioId) => {
  const q = `select * from donantes where usuario_id = $1 limit 1`;
  const { rows } = await db.query(q, [usuarioId]);
  return rows[0] || null;
};

// ----------------------------------------------------------
// Buscar donante por email
// ----------------------------------------------------------
const findByEmail = async (email) => {
  const q = `
    select d.*, u.nombre, u.apellido, u.email
    from donantes d
    join usuarios u on d.usuario_id = u.id
    where u.email = $1
    limit 1
  `;
  const { rows } = await db.query(q, [email]);
  return rows[0] || null;
};

// ----------------------------------------------------------
// Traigo el perfil completo del donante
// ----------------------------------------------------------
const getPerfilCompletoByUsuarioId = async (usuarioId) => {
  const q = `
    select 
      d.*,
      u.nombre,
      u.email,
      u.tipo_usuario,
      u.activo
    from donantes d
    join usuarios u on d.usuario_id = u.id
    where d.usuario_id = $1
  `;
  const { rows } = await db.query(q, [usuarioId]);
  return rows[0] || null;
};

// ----------------------------------------------------------
// Aplico filtros para el centro
// ----------------------------------------------------------
const filtrar = async (filtros) => {
  const condiciones = [];
  const valores = [];

  if (filtros?.provincia) {
    condiciones.push(`d.provincia_id = $${condiciones.length + 1}`);
    valores.push(filtros.provincia);
  }
  if (filtros?.localidad) {
    condiciones.push(`d.localidad_id = $${condiciones.length + 1}`);
    valores.push(filtros.localidad);
  }
  if (filtros?.barrio) {
    condiciones.push(`d.barrio_id = $${condiciones.length + 1}`);
    valores.push(filtros.barrio);
  }
  if (filtros?.grupo) {
    condiciones.push(`d.grupo_sanguineo = $${condiciones.length + 1}`);
    valores.push(filtros.grupo);
  }
  if (filtros?.estado) {
    condiciones.push(`d.estado = $${condiciones.length + 1}`);
    valores.push(filtros.estado);
  }

  let q = `
    select 
      d.*, 
      u.nombre, u.apellido, u.email,
      p.nombre as provincia_nombre,
      l.nombre as localidad_nombre,
      exists (
        select 1 from campanias_donantes cd where cd.usuario_id = d.usuario_id
      ) as inscripto_en_campania,
      (
        select c.nombre
        from campanias_donantes cd
        join campanias c on c.id = cd.campania_id
        where cd.usuario_id = d.usuario_id
        order by cd.created_at desc nulls last, c.fecha_inicio desc nulls last, c.id desc
        limit 1
      ) as campania_inscripta,
      (
        select c.id
        from campanias_donantes cd
        join campanias c on c.id = cd.campania_id
        where cd.usuario_id = d.usuario_id
        order by cd.created_at desc nulls last, c.fecha_inicio desc nulls last, c.id desc
        limit 1
      ) as campania_inscripta_id
    from donantes d
    join usuarios u on d.usuario_id = u.id
    left join provincias p on d.provincia_id = p.id
    left join localidades l on d.localidad_id = l.id
  `;

  if (condiciones.length > 0) {
    q += " where " + condiciones.join(" and ");
  }

  q += " order by d.id desc";

  const { rows } = await db.query(q, valores);
  return rows;
};

// ----------------------------------------------------------
// Actualizo el perfil del donante
// ----------------------------------------------------------
const updatePerfilByUsuarioId = async (usuarioId, data) => {
  const payload = { ...data };

  if (payload.fecha_nacimiento === "") payload.fecha_nacimiento = null;
  if (payload.telefono === "") payload.telefono = null;

  const allowed = [
    "grupo_sanguineo",
    "fecha_nacimiento",
    "telefono",
    "provincia_id",
    "localidad_id",
    "barrio_id",
  ];

  const sets = [];
  const values = [];
  let i = 1;

  for (const k of allowed) {
    if (
      Object.prototype.hasOwnProperty.call(payload, k) &&
      payload[k] !== undefined
    ) {
      let val = payload[k];

      if (["provincia_id", "localidad_id", "barrio_id"].includes(k)) {
        if (val !== null && val !== "") {
          const n = parseInt(val, 10);
          if (!isNaN(n)) val = n;
          else continue;
        }
      }

      sets.push(`${k} = $${i++}`);
      values.push(val);
    }
  }

  if (sets.length === 0) {
    return await getPerfilCompletoByUsuarioId(usuarioId);
  }

  const q = `
    update donantes
    set ${sets.join(", ")}
    where usuario_id = $${i}
    returning *
  `;
  values.push(usuarioId);

  const { rows } = await db.query(q, values);
  if (!rows[0]) return null;

  return await getPerfilCompletoByUsuarioId(usuarioId);
};

// ----------------------------------------------------------
// Baja total del donante
// ----------------------------------------------------------
module.exports.bajaTotalByUsuarioId = async function (usuarioId) {
  await db.query("begin");
  try {
    await db.query("delete from campanias_donantes where usuario_id = $1", [
      usuarioId,
    ]);
    await db.query("delete from donantes where usuario_id = $1", [usuarioId]);
    await db.query("delete from usuarios where id = $1", [usuarioId]);

    await db.query("commit");
    return true;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
};

// ----------------------------------------------------------
// Traer donantes segun lista de usuarios_ids
// ----------------------------------------------------------
module.exports.obtenerPorUsuariosIds = async function (usuariosIds = []) {
  if (!Array.isArray(usuariosIds) || usuariosIds.length === 0) return [];

  const placeholders = usuariosIds.map((_, i) => `$${i + 1}`).join(",");

  const q = `
    select *
    from donantes
    where usuario_id in (${placeholders})
  `;

  const { rows } = await db.query(q, usuariosIds);
  return rows;
};

// ----------------------------------------------------------
// Traer donantes que cumplen años hoy
// ----------------------------------------------------------
const obtenerCumpleanerosDelDia = async () => {
  const q = `
    SELECT 
      d.usuario_id,
      u.nombre,
      u.email
    FROM donantes d
    JOIN usuarios u ON d.usuario_id = u.id
    WHERE 
      EXTRACT(MONTH FROM d.fecha_nacimiento) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM d.fecha_nacimiento) = EXTRACT(DAY FROM CURRENT_DATE);
  `;
  const { rows } = await db.query(q);
  return rows;
};
// ----------------------------------------------------------
// exporto todas las funciones
// ----------------------------------------------------------
module.exports = {
  obtenerTodos,
  guardar,
  findByDni,
  findByUsuarioId,
  findByEmail,
  getPerfilCompletoByUsuarioId,
  updatePerfilByUsuarioId,
  filtrar,
  obtenerPorUsuariosIds: module.exports.obtenerPorUsuariosIds,
  bajaTotalByUsuarioId: module.exports.bajaTotalByUsuarioId,
  obtenerCumpleanerosDelDia,
};
