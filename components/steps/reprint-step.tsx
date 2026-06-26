"use client"

import { useMemo, useState } from "react"
import { Search, Printer, CheckSquare, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { Producto, Formato } from "@/lib/types"
import { FORMATO_LABEL } from "@/lib/types"
import { formatPesos } from "@/lib/cartel-utils"

const FORMATOS: Formato[] = ["grande", "x2", "x4"]

export function ReprintStep({
  productos,
  onPrint,
}: {
  productos: Producto[]
  onPrint: (productos: Producto[], formato: Formato) => Promise<void>
}) {
  const [query, setQuery] = useState("")
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [formato, setFormato] = useState<Formato>("grande")

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return productos

    return productos.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q) ||
        p.seccion.toLowerCase().includes(q),
    )
  }, [productos, query])

  const seleccionados = productos.filter((p) => sel.has(p.id))

  const idsResultados = resultados.map((p) => p.id)
  const todosResultadosSeleccionados =
    resultados.length > 0 && idsResultados.every((id) => sel.has(id))

  function toggle(id: string) {
    setSel((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function seleccionarResultados() {
    setSel((prev) => {
      const next = new Set(prev)

      if (todosResultadosSeleccionados) {
        idsResultados.forEach((id) => next.delete(id))
      } else {
        idsResultados.forEach((id) => next.add(id))
      }

      return next
    })
  }

  function limpiarSeleccion() {
    setSel(new Set())
  }

  async function imprimir() {
    if (seleccionados.length === 0) return

    const productosReimpresion = seleccionados.map((p) => ({
      ...p,
      cantidad: 1,
      cantidadBase: 1,
    }))

    await onPrint(productosReimpresion, formato)
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 py-6">
      <div>
        <h3 className="text-lg font-semibold">Reimpresión rápida</h3>
        <p className="text-sm text-muted-foreground">
          Busca por código, descripción o sección y reimprime solo lo que necesites.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por código, descripción o sección..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Formato:</span>

          {FORMATOS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={formato === f ? "default" : "outline"}
              onClick={() => setFormato(f)}
            >
              {FORMATO_LABEL[f]}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={seleccionarResultados}
            disabled={resultados.length === 0}
          >
            <CheckSquare className="mr-2 size-4" />
            {todosResultadosSeleccionados ? "Quitar filtrados" : "Seleccionar filtrados"}
          </Button>

          <Button size="sm" variant="ghost" onClick={limpiarSeleccion} disabled={sel.size === 0}>
            <X className="mr-2 size-4" />
            Limpiar
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {resultados.length} resultados encontrados · {seleccionados.length} seleccionados
      </div>

      <div className="rounded-xl border">
        <div className="max-h-[55vh] overflow-y-auto">
          {resultados.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Sin resultados.</p>
          ) : (
            resultados.map((p) => (
              <Label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0 has-[:checked]:bg-accent"
              >
                <Checkbox checked={sel.has(p.id)} onCheckedChange={() => toggle(p.id)} />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.descripcion}</div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>SKU: {p.codigo}</span>

                    <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                      {p.seccion}
                    </Badge>
                  </div>
                </div>

                <div className="font-display text-xl text-[#d50000]">
                  {p.tipoOferta !== "normal" && p.promoCantidad ? (
                    <span>
                      {p.promoCantidad} X {formatPesos(p.precioOferta)}
                    </span>
                  ) : (
                    formatPesos(p.precioOferta)
                  )}
                </div>
              </Label>
            ))
          )}
        </div>
      </div>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur">
        <div className="text-sm">
          <div>
            <span className="font-semibold">{seleccionados.length}</span> seleccionados
          </div>
          <div className="text-xs text-muted-foreground">
            Formato: {FORMATO_LABEL[formato]}
          </div>
        </div>

        <Button onClick={imprimir} disabled={seleccionados.length === 0}>
          <Printer className="mr-2 size-4" />
          Imprimir seleccionados
        </Button>
      </div>
    </div>
  )
}