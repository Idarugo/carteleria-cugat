"use client"

import { useMemo, useState } from "react"
import { ChevronDown, FileSpreadsheet, RotateCcw, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { Producto, Formato } from "@/lib/types"
import { FORMATO_LABEL, FORMATO_POR_HOJA } from "@/lib/types"
import { agruparPorSeccion, esMultipunto } from "@/lib/cartel-utils"
import { ExclusionModal } from "./exclusion-modal"
import { MultipuntoModal } from "./multipunto-modal"

const FORMATOS: Formato[] = ["grande", "x2", "x4"]

export function ConfigStep({
  productos,
  setProductos,
  secciones,
  formato,
  setFormato,
  excluidas,
  setExcluidas,
  fileName,
  onContinue,
  onReset,
}: {
  productos: Producto[]
  setProductos: (p: Producto[]) => void
  secciones: string[]
  formato: Formato
  setFormato: (f: Formato) => void
  excluidas: Set<string>
  setExcluidas: (s: Set<string>) => void
  fileName: string
  onContinue: () => void
  onReset: () => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [exclusionOpen, setExclusionOpen] = useState(false)
  const [multipuntoOpen, setMultipuntoOpen] = useState(false)

  const grupos = useMemo(() => agruparPorSeccion(productos), [productos])
  const conteo = useMemo(
    () => Object.fromEntries(Array.from(grupos, ([s, arr]) => [s, arr.length])),
    [grupos],
  )

  function setCantidad(id: string, valor: number) {
    const n = Math.max(1, Math.min(99, Math.round(valor) || 1))
    setProductos(productos.map((p) => (p.id === id ? { ...p, cantidad: n, cantidadBase: n } : p)))
  }

  function totalCarteles(arr: Producto[]) {
    return arr.reduce((s, p) => s + p.cantidad, 0)
  }

  // step 1: open exclusion modal
  function handleContinue() {
    setExclusionOpen(true)
  }

  // step 2: after exclusion, decide if multipunto modal is needed
  function handleExclusionConfirm(sel: Set<string>) {
    setExcluidas(sel)
    setExclusionOpen(false)
    const multipuntoSecs = secciones.filter((s) => !sel.has(s) && esMultipunto(s))
    if (multipuntoSecs.length > 0) {
      setMultipuntoOpen(true)
    } else {
      onContinue()
    }
  }

  // step 3: apply multipliers and continue
  function handleMultipuntoConfirm(mults: Record<string, number>) {
    setProductos(
      productos.map((p) => {
        const m = mults[p.seccion]
        if (m && m > 0) return { ...p, cantidad: Math.max(1, p.cantidadBase * m) }
        return p
      }),
    )
    setMultipuntoOpen(false)
    onContinue()
  }

  const multipuntoSecs = secciones.filter((s) => !excluidas.has(s) && esMultipunto(s))
  const seccionesActivas = secciones.filter((s) => !excluidas.has(s))
  const totalGlobal = productos
    .filter((p) => !excluidas.has(p.seccion))
    .reduce((s, p) => s + p.cantidad, 0)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileSpreadsheet className="size-4" />
          <span className="font-medium text-foreground">{fileName}</span>
          <span>·</span>
          <span>{productos.length} productos</span>
          <span>·</span>
          <span>{secciones.length} secciones</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="mr-2 size-4" />
          Cargar otro archivo
        </Button>
      </div>

      {/* Format selection */}
      <section>
        <h3 className="mb-3 text-lg font-semibold">1. Formato de impresión</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {FORMATOS.map((f) => (
            <button
              key={f}
              onClick={() => setFormato(f)}
              className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-colors ${
                formato === f ? "border-primary bg-accent" : "border-border hover:border-primary/40"
              }`}
            >
              <FormatPreview formato={f} active={formato === f} />
              <div>
                <div className="font-medium">{FORMATO_LABEL[f]}</div>
                <div className="text-xs text-muted-foreground">
                  {FORMATO_POR_HOJA[f]} cartel{FORMATO_POR_HOJA[f] > 1 ? "es" : ""} por hoja
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Sections + quantities */}
      <section>
        <h3 className="mb-3 text-lg font-semibold">2. Secciones y cantidades</h3>
        <div className="flex flex-col gap-2">
          {Array.from(grupos, ([seccion, arr]) => {
            const isExpanded = expanded === seccion
            return (
              <div key={seccion} className="rounded-xl border">
                <button
                  onClick={() => setExpanded(isExpanded ? null : seccion)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{seccion}</span>
                    {esMultipunto(seccion) && <Badge variant="secondary">Multipunto</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{arr.length} prod.</span>
                    <span>{totalCarteles(arr)} carteles</span>
                    <ChevronDown
                      className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t">
                    {arr.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 border-b px-4 py-2 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{p.descripcion}</div>
                          <div className="text-xs text-muted-foreground">SKU: {p.codigo}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Carteles</span>
                          <Input
                            type="number"
                            min={1}
                            max={99}
                            value={p.cantidad}
                            onChange={(e) => setCantidad(p.id, Number(e.target.value))}
                            className="h-8 w-16"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur">
        <div className="text-sm">
          <span className="font-semibold">{seccionesActivas.length}</span> secciones a imprimir ·{" "}
          <span className="font-semibold">{totalGlobal}</span> carteles
          {excluidas.size > 0 && (
            <span className="text-muted-foreground"> · {excluidas.size} excluidas</span>
          )}
        </div>
        <Button size="lg" onClick={handleContinue}>
          Continuar
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>

      <ExclusionModal
        open={exclusionOpen}
        onOpenChange={setExclusionOpen}
        secciones={secciones}
        conteoPorSeccion={conteo}
        initial={excluidas}
        onConfirm={handleExclusionConfirm}
      />
      <MultipuntoModal
        open={multipuntoOpen}
        onOpenChange={setMultipuntoOpen}
        secciones={multipuntoSecs}
        onConfirm={handleMultipuntoConfirm}
      />
    </div>
  )
}

function FormatPreview({ formato, active }: { formato: Formato; active: boolean }) {
  const cls = active ? "bg-primary" : "bg-muted-foreground/40"
  return (
    <div className="flex aspect-[8.5/11] w-12 flex-col gap-0.5 rounded border bg-card p-1">
      {formato === "grande" && <div className={`flex-1 rounded-sm ${cls}`} />}
      {formato === "x2" && (
        <>
          <div className={`flex-1 rounded-sm ${cls}`} />
          <div className={`flex-1 rounded-sm ${cls}`} />
        </>
      )}
      {formato === "x4" && (
        <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-0.5">
          <div className={`rounded-sm ${cls}`} />
          <div className={`rounded-sm ${cls}`} />
          <div className={`rounded-sm ${cls}`} />
          <div className={`rounded-sm ${cls}`} />
        </div>
      )}
    </div>
  )
}
