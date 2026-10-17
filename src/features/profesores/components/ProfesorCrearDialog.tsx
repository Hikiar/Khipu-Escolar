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

export function ProfesorCrearDialog({
  dialogoCrearAbierto,
  setDialogoCrearAbierto,
  formError,
  formDni,
  setFormDni,
  formNombres,
  setFormNombres,
  formApellidos,
  setFormApellidos,
  formNiveles,
  setFormNiveles,
  formTitulos,
  setFormTitulos,
  formCorreo,
  setFormCorreo,
  formTelefono,
  setFormTelefono,
  formEspecialidad,
  setFormEspecialidad,
  formIngresoAt,
  setFormIngresoAt,
  formEnviando,
  enviarCrear,
}: {
  dialogoCrearAbierto: boolean
  setDialogoCrearAbierto: Dispatch<SetStateAction<boolean>>
  formError: string | null
  formDni: string
  setFormDni: Dispatch<SetStateAction<string>>
  formNombres: string
  setFormNombres: Dispatch<SetStateAction<string>>
  formApellidos: string
  setFormApellidos: Dispatch<SetStateAction<string>>
  formNiveles: NivelCurricular[]
  setFormNiveles: Dispatch<SetStateAction<NivelCurricular[]>>
  formTitulos: Record<NivelCurricular, string>
  setFormTitulos: Dispatch<SetStateAction<Record<NivelCurricular, string>>>
  formCorreo: string
  setFormCorreo: Dispatch<SetStateAction<string>>
  formTelefono: string
  setFormTelefono: Dispatch<SetStateAction<string>>
  formEspecialidad: string
  setFormEspecialidad: Dispatch<SetStateAction<string>>
  formIngresoAt: string
  setFormIngresoAt: Dispatch<SetStateAction<string>>
  formEnviando: boolean
  enviarCrear: () => void
}) {
  return (
    <Dialog open={dialogoCrearAbierto} onOpenChange={setDialogoCrearAbierto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar profesor</DialogTitle>
          <DialogDescription>
            Complete los datos para registrar un nuevo profesor.
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
            <Label htmlFor="dni">DNI *</Label>
            <Input
              id="dni"
              value={formDni}
              onChange={(e) => setFormDni(e.target.value)}
              placeholder="DNI"
              maxLength={8}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nombres">Nombres *</Label>
            <Input
              id="nombres"
              value={formNombres}
              onChange={(e) => setFormNombres(e.target.value)}
              placeholder="Nombres"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="apellidos">Apellidos *</Label>
            <Input
              id="apellidos"
              value={formApellidos}
              onChange={(e) => setFormApellidos(e.target.value)}
              placeholder="Apellidos"
            />
          </div>

          <SelectorNiveles seleccion={formNiveles} onChange={setFormNiveles} />

          <TitulosPorNivel
            seleccion={formNiveles}
            valores={formTitulos}
            onCambiar={(nivel, valor) =>
              setFormTitulos((prev) => ({ ...prev, [nivel]: valor }))
            }
            idBase="titulo-crear"
          />

          <div className="grid gap-2">
            <Label htmlFor="correo">Correo (opcional)</Label>
            <Input
              id="correo"
              type="email"
              value={formCorreo}
              onChange={(e) => setFormCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telefono">Teléfono (opcional)</Label>
            <Input
              id="telefono"
              value={formTelefono}
              onChange={(e) => setFormTelefono(e.target.value)}
              placeholder="Número de teléfono"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="especialidad">Especialidad (opcional)</Label>
            <Input
              id="especialidad"
              value={formEspecialidad}
              onChange={(e) => setFormEspecialidad(e.target.value)}
              placeholder="Especialidad"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ingresoAt">Fecha de ingreso (opcional)</Label>
            <Input
              id="ingresoAt"
              type="date"
              value={formIngresoAt}
              onChange={(e) => setFormIngresoAt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogoCrearAbierto(false)}
            disabled={formEnviando}
          >
            Cancelar
          </Button>
          <Button
            onClick={enviarCrear}
            disabled={
              !formDni || !formNombres || !formApellidos || formNiveles.length === 0 || formEnviando
            }
          >
            {formEnviando ? 'Registrando...' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
