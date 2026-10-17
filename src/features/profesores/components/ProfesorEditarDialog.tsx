import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { NivelCurricular } from '@/lib/nivelesCurso'
import { SelectorNiveles } from './SelectorNiveles'
import { TitulosPorNivel } from './TitulosPorNivel'

export function ProfesorEditarDialog({
  dialogoEditarAbierto,
  setDialogoEditarAbierto,
  formError,
  formDni,
  setFormDni,
  formNombres,
  setFormNombres,
  formApellidos,
  setFormApellidos,
  formNiveles,
  setFormNiveles,
  formCorreo,
  setFormCorreo,
  formTelefono,
  setFormTelefono,
  formEspecialidad,
  setFormEspecialidad,
  formTitulos,
  setFormTitulos,
  formEnviando,
  enviarEditar,
}: {
  dialogoEditarAbierto: boolean
  setDialogoEditarAbierto: Dispatch<SetStateAction<boolean>>
  formError: string | null
  formDni: string
  setFormDni: Dispatch<SetStateAction<string>>
  formNombres: string
  setFormNombres: Dispatch<SetStateAction<string>>
  formApellidos: string
  setFormApellidos: Dispatch<SetStateAction<string>>
  formNiveles: NivelCurricular[]
  setFormNiveles: Dispatch<SetStateAction<NivelCurricular[]>>
  formCorreo: string
  setFormCorreo: Dispatch<SetStateAction<string>>
  formTelefono: string
  setFormTelefono: Dispatch<SetStateAction<string>>
  formEspecialidad: string
  setFormEspecialidad: Dispatch<SetStateAction<string>>
  formTitulos: Record<NivelCurricular, string>
  setFormTitulos: Dispatch<SetStateAction<Record<NivelCurricular, string>>>
  formEnviando: boolean
  enviarEditar: () => void
}) {
  return (
    <Dialog open={dialogoEditarAbierto} onOpenChange={setDialogoEditarAbierto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar profesor</DialogTitle>
          <DialogDescription>
            Modifique los datos del profesor.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" aria-hidden />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="dni-editar">DNI *</Label>
            <Input
              id="dni-editar"
              value={formDni}
              onChange={(e) => setFormDni(e.target.value)}
              placeholder="DNI"
              maxLength={8}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nombres-editar">Nombres *</Label>
            <Input
              id="nombres-editar"
              value={formNombres}
              onChange={(e) => setFormNombres(e.target.value)}
              placeholder="Nombres"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="apellidos-editar">Apellidos *</Label>
            <Input
              id="apellidos-editar"
              value={formApellidos}
              onChange={(e) => setFormApellidos(e.target.value)}
              placeholder="Apellidos"
            />
          </div>

          <SelectorNiveles seleccion={formNiveles} onChange={setFormNiveles} />

          <div className="grid gap-2">
            <Label htmlFor="correo-editar">Correo (opcional)</Label>
            <Input
              id="correo-editar"
              type="email"
              value={formCorreo}
              onChange={(e) => setFormCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telefono-editar">Teléfono (opcional)</Label>
            <Input
              id="telefono-editar"
              value={formTelefono}
              onChange={(e) => setFormTelefono(e.target.value)}
              placeholder="Número de teléfono"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="especialidad-editar">Especialidad (opcional)</Label>
            <Input
              id="especialidad-editar"
              value={formEspecialidad}
              onChange={(e) => setFormEspecialidad(e.target.value)}
              placeholder="Especialidad"
            />
          </div>

          <TitulosPorNivel
            seleccion={formNiveles}
            valores={formTitulos}
            onCambiar={(nivel, valor) =>
              setFormTitulos((prev) => ({ ...prev, [nivel]: valor }))
            }
            idBase="titulo-editar"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogoEditarAbierto(false)} disabled={formEnviando}>
            Cancelar
          </Button>
          <Button
            onClick={enviarEditar}
            disabled={
              !formDni || !formNombres || !formApellidos || formNiveles.length === 0 || formEnviando
            }
          >
            {formEnviando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
