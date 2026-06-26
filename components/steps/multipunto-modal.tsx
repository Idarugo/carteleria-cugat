"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const OPCIONES = [
  { label: "Mantener", mult: 1 },
  { label: "Duplicar", mult: 2 },
  { label: "Triplicar", mult: 3 },
  { label: "Cuadruplicar", mult: 4 },
]

export function MultipuntoModal({
  open,
  onOpenChange,
  secciones,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  secciones: string[]
  onConfirm: (multiplicadores: Record<string, number>) => void
}) {
  const [mults, setMults] = useState<Record<string, number>>({})

  useEffect(() => {
    if (open) setMults(Object.fromEntries(secciones.map((s) => [s, 1])))
  }, [open, secciones])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Secciones multipunto detectadas</DialogTitle>
          <DialogDescription>
            Estas secciones suelen necesitar carteles en varios puntos. ¿Deseas aumentar la cantidad?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {secciones.map((s) => (
            <div key={s} className="rounded-lg border p-3">
              <div className="mb-2 font-medium">{s}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {OPCIONES.map((o) => (
                  <Button
                    key={o.mult}
                    size="sm"
                    variant={mults[s] === o.mult ? "default" : "outline"}
                    onClick={() => setMults((prev) => ({ ...prev, [s]: o.mult }))}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={() => onConfirm(mults)}>Aplicar y continuar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
