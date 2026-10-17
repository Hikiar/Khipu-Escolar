import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Pruebas de integración smoke sobre una base temporal.
 *   npm run test:smoke
 *
 * Cubre el contrato crítico de la API: login, autorización, RBAC,
 * periodo activo, plan de estudios, ciclo de vida de un alumno
 * (incluido reactivación) y eliminación de secciones y clases.
 */

const dirTemporal = mkdtempSync(path.join(os.tmpdir(), 'colegio-smoke-'))
const dbPrueba = path.join(dirTemporal, 'smoke.db')

// IMPORTANTE: la ruta de BD se fija ANTES de importar el servidor (config se lee al importar).
process.env.DATABASE_PATH = dbPrueba

const { inicializarBaseDatos } = await import('../db/init.ts')
const { cerrarBase } = await import('../db/seed.ts')
const { crearApp } = await import('../api/app.ts')

inicializarBaseDatos()

const app = crearApp()
const server = app.listen(0)
const puerto = (server.address() as { port: number }).port
const base = `http://127.0.0.1:${puerto}`

let falladas = 0
function verificar(nombre: string, condicion: boolean, detalle?: unknown): void {
  if (condicion) {
    console.log(`✓ ${nombre}`)
  } else {
    falladas++
    console.error(`✗ ${nombre}${detalle ? ` — ${JSON.stringify(detalle)}` : ''}`)
  }
}

async function pedir(
  metodo: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  ruta: string,
  token?: string,
  cuerpo?: unknown,
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const respuesta = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  const json = await respuesta.json().catch(() => null)
  return { status: respuesta.status, json }
}

async function principal(): Promise<void> {
  // Login inválido
  const mal = await pedir('POST', '/api/auth/login', undefined, {
    codigo: 'D26000001',
    password: 'clave-incorrecta',
  })
  verificar('login con clave incorrecta → 401', mal.status === 401)

  // Sin token
  const sinToken = await pedir('GET', '/api/roles')
  verificar('sin token → 401', sinToken.status === 401)

  // Login director (por código institucional)
  const login = await pedir('POST', '/api/auth/login', undefined, {
    codigo: 'D26000001',
    password: 'director.123',
  })
  verificar('login director', login.status === 200 && login.json?.ok === true)
  const token = login.json?.sesion?.token
  verificar('login director devuelve token', typeof token === 'string' && token.length > 0)

  // Listados base
  const roles = await pedir('GET', '/api/roles', token)
  verificar('listar roles (director)', roles.status === 200 && Array.isArray(roles.json?.data))

  const periodo = await pedir('GET', '/api/periodos/activo', token)
  verificar('periodo activo', periodo.status === 200 && !!periodo.json?.data)

  const plan = await pedir('GET', '/api/cursos/cur-mate/grados', token)
  verificar('plan de estudios (grados del curso)', plan.status === 200 && !!plan.json?.data)

  // Ciclo de vida de alumno
  const dniPrueba = `8${String(Date.now()).slice(-7)}`
  const crear = await pedir('POST', '/api/alumnos', token, {
    dni: dniPrueba,
    nombres: 'Smoke',
    apellidos: 'Test',
  })
  verificar('crear alumno', crear.status === 200 && crear.json?.ok === true, crear.json)
  const alumnoId = crear.json?.data?.id
  verificar(
    'crear alumno genera código institucional E',
    typeof crear.json?.data?.codigoInstitucional === 'string' &&
      /^E\d{8}$/.test(crear.json?.data?.codigoInstitucional),
    crear.json,
  )

  const paginado = await pedir('GET', '/api/alumnos?pagina=1&limite=2', token)
  verificar(
    'listar alumnos paginado',
    paginado.status === 200 &&
      Array.isArray(paginado.json?.data?.items) &&
      typeof paginado.json?.data?.total === 'number',
    paginado.json,
  )

  if (alumnoId) {
    const desactivar = await pedir('POST', `/api/alumnos/${alumnoId}/desactivar`, token)
    verificar('desactivar alumno', desactivar.status === 200 && desactivar.json?.ok === true)
    const duplicado = await pedir('POST', '/api/alumnos', token, {
      dni: dniPrueba,
      nombres: 'Smoke',
      apellidos: 'Test',
    })
    verificar('alta duplicada rechazada → 400', duplicado.status === 400)

    const reactivarAlumno = await pedir('POST', `/api/alumnos/${alumnoId}/reactivar`, token)
    verificar('reactivar alumno', reactivarAlumno.status === 200 && reactivarAlumno.json?.ok === true)

    const alumnoActivo = await pedir('POST', '/api/alumnos', token, {
      dni: dniPrueba,
      nombres: 'Smoke',
      apellidos: 'Test',
    })
    verificar('alta tras reactivar vuelve a permitirse', alumnoActivo.status === 400)
  }

  // Eliminación de secciones y clases
  const gradosLista = await pedir('GET', '/api/grados', token)
  const gradosData = gradosLista.json?.data
  const gradoId = Array.isArray(gradosData) && gradosData.length > 0 ? gradosData[0].id : null
  if (gradoId) {
    const seccionRes = await pedir('POST', `/api/grados/${gradoId}/secciones`, token, {
      gradoId,
      nombre: `Smoke ${Date.now()}`,
    })
    verificar('crear sección', seccionRes.status === 200 && seccionRes.json?.ok === true, seccionRes.json)
    const seccionId = seccionRes.json?.data?.id

    if (seccionId) {
      const claseRes = await pedir('POST', '/api/clases', token, {
        periodoId: periodo.json?.data?.id,
        gradoId,
        seccionId,
      })
      verificar('crear clase', claseRes.status === 200 && claseRes.json?.ok === true, claseRes.json)
      const claseId = claseRes.json?.data?.id

      if (claseId) {
        const noEliminarSeccion = await pedir('DELETE', `/api/secciones/${seccionId}`, token)
        verificar(
          'no elimina sección con clase asociada',
          noEliminarSeccion.status === 400 && noEliminarSeccion.json?.ok === false,
          noEliminarSeccion.json,
        )
        const eliminarClase = await pedir('DELETE', `/api/clases/${claseId}`, token)
        verificar('eliminar clase', eliminarClase.status === 200 && eliminarClase.json?.ok === true, eliminarClase.json)
      }

      const eliminarSeccion = await pedir('DELETE', `/api/secciones/${seccionId}`, token)
      verificar('eliminar sección sin clases', eliminarSeccion.status === 200 && eliminarSeccion.json?.ok === true, eliminarSeccion.json)
    }
  }

  // RBAC: el docente no puede ver roles
  const loginDocente = await pedir('POST', '/api/auth/login', undefined, {
    codigo: 'P26000001',
    password: 'profesor.123',
  })
  verificar('login docente', loginDocente.status === 200 && loginDocente.json?.ok === true)
  const tokenDocente = loginDocente.json?.sesion?.token
  if (tokenDocente) {
    const rolesDocente = await pedir('GET', '/api/roles', tokenDocente)
    verificar('docente sin permiso de roles → 403', rolesDocente.status === 403)

    const alumnosDocente = await pedir('GET', '/api/alumnos', tokenDocente)
    verificar('docente sin listado global de alumnos → 403', alumnosDocente.status === 403)

    const clasesDocente = await pedir('GET', `/api/clases?docenteId=per-002`, tokenDocente)
    verificar(
      'docente lista sus salones',
      clasesDocente.status === 200 &&
        Array.isArray(clasesDocente.json?.data) &&
        clasesDocente.json.data.length > 0,
      clasesDocente.json,
    )

    const alumnosPropios = await pedir('GET', '/api/clases/cla-3b-2026/alumnos', tokenDocente)
    verificar(
      'docente ve alumnos de su salón',
      alumnosPropios.status === 200 && Array.isArray(alumnosPropios.json?.data),
      alumnosPropios.json,
    )

    const alumnoClaseAjena = await pedir('GET', '/api/clases/cla-4a-2026/alumnos', tokenDocente)
    verificar('docente sin acceso a alumnos de salón ajeno → 403', alumnoClaseAjena.status === 403)
  }

  // Auditoría visible solo con permiso total
  const audit = await pedir('GET', '/api/auditoria', token)
  verificar('leer auditoría (director)', audit.status === 200 && Array.isArray(audit.json?.registros))
  if (tokenDocente) {
    const auditDocente = await pedir('GET', '/api/auditoria', tokenDocente)
    verificar('docente sin acceso a auditoría → 403', auditDocente.status === 403)
  }

  // Conceptos de pago (P14) — CRUD + autorización
  const periodoIdSmoke = periodo.json?.data?.id
  const codigoConcepto = `SMOKE-${Date.now()}`
  const crearConcepto = await pedir('POST', '/api/pagos/conceptos', token, {
    periodoId: periodoIdSmoke,
    codigo: codigoConcepto,
    descripcion: 'Concepto smoke',
    tipo: 'OTRO',
    montoBase: 12.5,
  })
  verificar(
    'crear concepto de pago',
    crearConcepto.status === 200 && crearConcepto.json?.ok === true,
    crearConcepto.json,
  )
  const conceptoId = crearConcepto.json?.data?.id

  if (typeof conceptoId === 'string' && typeof periodoIdSmoke === 'string') {
    const duplicado = await pedir('POST', '/api/pagos/conceptos', token, {
      periodoId: periodoIdSmoke,
      codigo: codigoConcepto,
      descripcion: 'dup',
      tipo: 'OTRO',
      montoBase: 1,
    })
    verificar('código de concepto duplicado en el periodo → 400', duplicado.status === 400)

    const patch = await pedir('PATCH', `/api/pagos/conceptos/${conceptoId}`, token, {
      montoBase: 20,
    })
    verificar(
      'editar concepto de pago',
      patch.status === 200 && patch.json?.data?.montoBase === 20,
      patch.json,
    )

    const listar = await pedir('GET', `/api/pagos/conceptos?periodoId=${periodoIdSmoke}`, token)
    verificar(
      'listar conceptos incluye el nuevo',
      listar.status === 200 &&
        Array.isArray(listar.json?.data) &&
        listar.json.data.some((c: { id: string }) => c.id === conceptoId),
    )

    // Eliminar sin pagos asociados → OK
    const eliminar = await pedir('DELETE', `/api/pagos/conceptos/${conceptoId}`, token)
    verificar(
      'eliminar concepto sin pagos',
      eliminar.status === 200 && eliminar.json?.ok === true,
      eliminar.json,
    )

    if (tokenDocente) {
      const crearDocente = await pedir('POST', '/api/pagos/conceptos', tokenDocente, {
        periodoId: periodoIdSmoke,
        codigo: `X-${Date.now()}`,
        descripcion: 'x',
        tipo: 'OTRO',
        montoBase: 1,
      })
      verificar('docente sin conceptosPago.crear → 403', crearDocente.status === 403)
    }

    // Eliminar un concepto CON pagos → bloqueado por FK restrict / guardia N4.
    if (typeof alumnoId === 'string') {
      await pedir('POST', '/api/pagos', token, {
        alumnoId,
        conceptoId: 'con-matric',
        monto: 10,
        metodoPago: 'EFECTIVO',
        fecha: '2026-03-10',
      })
      const borrarConPagos = await pedir('DELETE', '/api/pagos/conceptos/con-matric', token)
      verificar(
        'eliminar concepto con pagos → 400',
        borrarConPagos.status === 400,
        borrarConPagos.json,
      )
    }
  }

  // Flujo de contraseña: alta con clave temporal → banner (flag) → cambio → limpieza del flag.
  const dniCuenta = `7${String(Date.now()).slice(-7)}`
  const rolSecretaria = (roles.json?.data ?? []).find((r: any) => r.codigo === 'secretaria')
  const altaCuenta = await pedir('POST', '/api/usuarios', token, {
    dni: dniCuenta,
    nombres: 'Clave',
    apellidos: 'Test',
    rolIds: rolSecretaria ? [rolSecretaria.id] : [],
  })
  verificar(
    'alta de cuenta genera contraseña temporal',
    altaCuenta.status === 200 && altaCuenta.json?.ok === true && typeof altaCuenta.json?.data?.passwordGenerada === 'string',
    altaCuenta.json,
  )
  verificar(
    'alta de cuenta marca debeCambiarPassword=true',
    altaCuenta.json?.data?.debeCambiarPassword === true,
    altaCuenta.json,
  )

  const usernameNuevo = altaCuenta.json?.data?.username
  const passwordTemporal = altaCuenta.json?.data?.passwordGenerada
  const userIdNuevo = altaCuenta.json?.data?.id
  if (typeof usernameNuevo === 'string' && typeof passwordTemporal === 'string') {
    const loginTemporal = await pedir('POST', '/api/auth/login', undefined, {
      codigo: usernameNuevo,
      password: passwordTemporal,
    })
    verificar(
      'login con contraseña temporal',
      loginTemporal.status === 200 && loginTemporal.json?.ok === true,
      loginTemporal.json,
    )
    verificar(
      'sesión temporal trae debeCambiarPassword=true',
      loginTemporal.json?.sesion?.usuario?.debeCambiarPassword === true,
      loginTemporal.json,
    )
    const tokenCuenta = loginTemporal.json?.sesion?.token

    if (typeof userIdNuevo === 'string') {
      // Mientras el flag esté activo la temporal cifrada puede re-exponerse.
      const verClaveInicio = await pedir('GET', `/api/usuarios/${userIdNuevo}/password-temporal`, token)
      verificar(
        're-exponer la clave temporal mientras sigue pendiente',
        verClaveInicio.status === 200 &&
          verClaveInicio.json?.ok === true &&
          verClaveInicio.json?.data?.passwordTemporal === passwordTemporal,
        verClaveInicio.json,
      )
    }

    const cambioClave = await pedir('POST', '/api/auth/cambiar-contrasena', tokenCuenta, {
      passwordActual: passwordTemporal,
      passwordNueva: 'TemporalNueva.123',
    })
    verificar(
      'cambio de contraseña exitoso',
      cambioClave.status === 200 && cambioClave.json?.ok === true,
      cambioClave.json,
    )

    const sesionTrasCambio = await pedir('POST', '/api/auth/validar', tokenCuenta, {
      token: tokenCuenta,
    })
    verificar(
      'tras el cambio el flag queda false',
      sesionTrasCambio.json?.ok === true && sesionTrasCambio.json?.sesion?.usuario?.debeCambiarPassword === false,
      sesionTrasCambio.json,
    )

    // La clave temporal cifrada se re-expone solo mientras esté pendiente
    // (flag=true); al cambiar la contraseña el valor cifrado se borra.
    if (typeof userIdNuevo === 'string') {
      const verClaveTrasCambio = await pedir('GET', `/api/usuarios/${userIdNuevo}/password-temporal`, token)
      verificar(
        'tras cambiar la clave ya no se puede re-exponer',
        verClaveTrasCambio.json?.ok === false,
        verClaveTrasCambio.json,
      )
    }

    // Restablecer contraseña (director): nueva temporal + sesiones invalidadas.
    if (typeof userIdNuevo === 'string') {
      const restablecer = await pedir('POST', `/api/usuarios/${userIdNuevo}/restablecer-password`, token)
      verificar(
        'restablecer contraseña devuelve nueva clave y flag=true',
        restablecer.status === 200 &&
          restablecer.json?.ok === true &&
          typeof restablecer.json?.data?.passwordGenerada === 'string' &&
          restablecer.json?.data?.usuario?.debeCambiarPassword === true,
        restablecer.json,
      )
      const loginTrasReset = await pedir('POST', '/api/auth/login', undefined, {
        codigo: usernameNuevo,
        password: restablecer.json?.data?.passwordGenerada,
      })
      verificar(
        'login con contraseña restablecida',
        loginTrasReset.status === 200 && loginTrasReset.json?.ok === true,
        loginTrasReset.json,
      )

      const verClaveTrasReset = await pedir('GET', `/api/usuarios/${userIdNuevo}/password-temporal`, token)
      verificar(
        'tras restablecer vuelve a poder re-exponerse la clave temporal',
        verClaveTrasReset.status === 200 &&
          verClaveTrasReset.json?.ok === true &&
          verClaveTrasReset.json?.data?.passwordTemporal === restablecer.json?.data?.passwordGenerada,
        verClaveTrasReset.json,
      )
    }

    // Lookup previo al alta: la persona ya existe por DNI → se reutiliza su código.
    const buscar = await pedir('GET', `/api/usuarios/buscar-persona?dni=${dniCuenta}`, token)
    verificar(
      'lookup persona por DNI la encuentra y marca tieneCuenta',
      buscar.status === 200 &&
        buscar.json?.ok === true &&
        buscar.json?.data?.tieneCuenta === true &&
        buscar.json?.data?.persona?.codigoInstitucional === usernameNuevo,
      buscar.json,
    )
  }

  // Búsqueda de persona con DNI inexistente → null.
  const buscarVacio = await pedir('GET', `/api/usuarios/buscar-persona?dni=${dniCuenta}99`, token)
  verificar('lookup persona con DNI inexistente → null', buscarVacio.json?.ok === true && buscarVacio.json?.data === null, buscarVacio.json)

  // P3: al dar cuenta a un profesor sin ficha docente, se crea su registro automáticamente.
  const rolProfesor = (roles.json?.data ?? []).find((r: any) => r.codigo === 'profesor')
  const dniDocenteAutomatico = `9${String(Date.now()).slice(-7)}`
  const altaProfesor = await pedir('POST', '/api/usuarios', token, {
    dni: dniDocenteAutomatico,
    nombres: 'Docente',
    apellidos: 'Automatico',
    rolIds: rolProfesor ? [rolProfesor.id] : [],
  })
  verificar(
    'alta de profesor genera cuenta',
    altaProfesor.status === 200 && altaProfesor.json?.ok === true,
    altaProfesor.json,
  )
  const buscarDocenteAutomatico = await pedir('GET', `/api/usuarios/buscar-persona?dni=${dniDocenteAutomatico}`, token)
  verificar(
    'P3: la persona queda marcada como docente tras el alta',
    buscarDocenteAutomatico.json?.ok === true &&
      buscarDocenteAutomatico.json?.data?.esDocente === true &&
      buscarDocenteAutomatico.json?.data?.tieneCuenta === true,
    buscarDocenteAutomatico.json,
  )

  // P2: la cuenta de acceso se puede crear desde la ficha del docente.
  const dniDocenteCuenta = `6${String(Date.now()).slice(-7)}`
  const crearDocenteCuenta = await pedir('POST', '/api/docentes', token, {
    dni: dniDocenteCuenta,
    nombres: 'Con',
    apellidos: 'Ficha',
    niveles: ['PRIMARIA'],
    titulos: [],
  })
  verificar('crear docente desde el módulo', crearDocenteCuenta.status === 200 && crearDocenteCuenta.json?.ok === true, crearDocenteCuenta.json)
  const idDocenteCuenta = crearDocenteCuenta.json?.data?.id
  if (idDocenteCuenta) {
    const crearCuenta = await pedir('POST', `/api/docentes/${idDocenteCuenta}/cuenta`, token)
    verificar(
      'P2: crear cuenta de acceso desde la ficha del docente',
      crearCuenta.status === 200 &&
        crearCuenta.json?.ok === true &&
        typeof crearCuenta.json?.data?.passwordGenerada === 'string' &&
        crearCuenta.json?.data?.debeCambiarPassword === true,
      crearCuenta.json,
    )
    verificar(
      'P2: la cuenta reutiliza su código institucional como usuario',
      crearCuenta.json?.data?.username === crearDocenteCuenta.json?.data?.codigoInstitucional,
      crearCuenta.json,
    )
    const crearCuentaRepetida = await pedir('POST', `/api/docentes/${idDocenteCuenta}/cuenta`, token)
    verificar('P2: no permite duplicar la cuenta del docente', crearCuentaRepetida.json?.ok === false, crearCuentaRepetida.json)
  }

  await new Promise<void>((resolver) => server.close(() => resolver()))
  cerrarBase()
  try {
    rmSync(dirTemporal, { recursive: true, force: true })
  } catch {
    // Windows puede retener el archivo brevemente; no es un fallo del test.
  }

  console.log(falladas === 0 ? '\nSMOKE OK' : `\nSMOKE: ${falladas} verificación(es) fallida(s)`)
  process.exit(falladas === 0 ? 0 : 1)
}

principal().catch((error) => {
  console.error('[smoke] error no controlado:', error)
  process.exit(1)
})