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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function ExclusionModal({
  open,
  onOpenChange,
  secciones,
  conteoPorSeccion,
  initial,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  secciones: string[]
  conteoPorSeccion: Record<string, number>
  initial: Set<string>
  onConfirm: (excluidas: Set<string>) => void
}) {
  const [sel, setSel] = useState<Set<string>>(new Set(initial))

  useEffect(() => {
    if (open) setSel(new Set(initial))
  }, [open, initial])

  const todoSeleccionado = secciones.length > 0 && sel.size === secciones.length

  function toggle(s: string) {
    setSel((prev) => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  function seleccionarTodo(v: boolean) {
    if (v) {
      setSel(new Set(secciones))
    } else {
      setSel(new Set())
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccione las secciones que NO desea imprimir</DialogTitle>
          <DialogDescription>
            Las secciones marcadas se omitirán de la impresión. Puedes cambiarlas cada vez.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Label className="mb-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
            <span className="flex items-center gap-3">
              <Checkbox checked={todoSeleccionado} onCheckedChange={(v) => seleccionarTodo(!!v)} />
              <span className="font-semibold">Seleccionar todo</span>
            </span>

            <span className="text-xs text-muted-foreground">{secciones.length} secciones</span>
          </Label>

          <div className="flex flex-col gap-1">
            {secciones.map((s) => (
              <Label
                key={s}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 has-[:checked]:border-destructive/50 has-[:checked]:bg-destructive/5"
              >
                <span className="flex items-center gap-3">
                  <Checkbox checked={sel.has(s)} onCheckedChange={() => toggle(s)} />
                  <span className="font-medium">{s}</span>
                </span>

                <span className="text-xs text-muted-foreground">{conteoPorSeccion[s] ?? 0} prod.</span>
              </Label>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => setSel(new Set())}>
            Imprimir todas
          </Button>
          <Button onClick={() => onConfirm(sel)}>Continuar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}