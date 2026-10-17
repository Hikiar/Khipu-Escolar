import { crearApp } from './api/app.ts'
import { inicializarBaseDatos } from './db/init.ts'
import { cerrarBase } from './db/seed.ts'
import { leerConfig } from './config.ts'

const { port } = leerConfig()

// En el arranque aplica migraciones pendientes y siembra solo si la base está vacía.
inicializarBaseDatos()

const app = crearApp()

app.listen(port, () => {
  console.log(`[api] escuchando en http://localhost:${port}`)
})

process.on('SIGINT', () => {
  cerrarBase()
  process.exit(0)
})