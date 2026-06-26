"use client"

import { useMemo, useState } from "react"
import { Printer, ArrowRight, X, CheckCircle2, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Producto, Formato } from "@/lib/types"
import { agruparPorSeccion } from "@/lib/cartel-utils"
import { construirHojas } from "@/components/carteles/hojas"

type Phase = "ready" | "done" | "finished"

export function PrintFlow({
  productos,
  formato,
  excluidas,
  onPrintSection,
  onExit,
}: {
  productos: Producto[]
  formato: Formato
  excluidas: Set<string>
  onPrintSection: (productos: Producto[], formato: Formato) => Promise<void>
  onExit: () => void
}) {
  const grupos = useMemo(() => {
    const activos = productos.filter((p) => !excluidas.has(p.seccion))
    return Array.from(agruparPorSeccion(activos))
  }, [productos, excluidas])

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>("ready")
  const [printing, setPrinting] = useState(false)

  const totalSecciones = grupos.length
  const actual = grupos[index]
  const siguiente = grupos[index + 1]

  const totalPaginas = useMemo(
    () => grupos.reduce((s, [, arr]) => s + construirHojas(arr, formato).length, 0),
    [grupos, formato],
  )
  const paginasHechas = useMemo(
    () =>
      grupos
        .slice(0, index)
        .reduce((s, [, arr]) => s + construirHojas(arr, formato).length, 0),
    [grupos, formato, index],
  )

  if (totalSecciones === 0) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-muted-foreground">No hay secciones para imprimir.</p>
        <Button className="mt-4" onClick={onExit}>
          Volver
        </Button>
      </div>
    )
  }

  async function imprimirActual() {
    if (!actual) return
    setPrinting(true)
    await onPrintSection(actual[1], formato)
    setPrinting(false)
    setPhase("done")
  }

  function continuar() {
    if (index + 1 >= totalSecciones) {
      setPhase("finished")
    } else {
      setIndex((i) => i + 1)
      setPhase("ready")
    }
  }

  const progreso = Math.round(((phase === "finished" ? totalPaginas : paginasHechas) / totalPaginas) * 100)

  if (phase === "finished") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CheckCircle2 className="mx-auto mb-4 size-14 text-primary" />
        <h2 className="text-2xl font-semibold">Impresión completada</h2>
        <p className="mt-2 text-muted-foreground">
          Se procesaron {totalSecciones} secciones · {totalPaginas} páginas.
        </p>
        <Button className="mt-6" size="lg" onClick={onExit}>
          Finalizar
        </Button>
      </div>
    )
  }

  const hojasActual = construirHojas(actual[1], formato).length

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Cartelerista panel */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Layers className="size-4" />
            Modo Cartelerista
          </div>
          <Button variant="ghost" size="sm" onClick={onExit}>
            <X className="mr-1 size-4" />
            Salir
          </Button>
        </div>

        <div className="mb-2 flex items-end justify-between">
          <span className="text-sm text-muted-foreground">
            Sección {index + 1} de {totalSecciones}
          </span>
          <span className="text-sm font-medium">{progreso}%</span>
        </div>
        <Progress value={progreso} className="mb-6" />

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Sección actual" value={actual[0]} highlight />
          <Stat label="Próxima sección" value={siguiente ? siguiente[0] : "—"} />
          <Stat label="Productos" value={String(actual[1].length)} />
          <Stat label="Páginas de esta sección" value={String(hojasActual)} />
        </div>

        <div className="mt-6">
          {phase === "ready" && (
            <Button size="lg" className="w-full" onClick={imprimirActual} disabled={printing}>
              <Printer className="mr-2 size-4" />
              {printing ? "Abriendo impresión..." : `Imprimir ${actual[0]} (${hojasActual} hojas)`}
            </Button>
          )}

          {phase === "done" && (
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="mb-3 text-sm">
                <span className="font-semibold">{actual[0]}</span> finalizado.{" "}
                {siguiente ? (
                  <>
                    La siguiente sección será <span className="font-semibold">{siguiente[0]}</span>.
                  </>
                ) : (
                  "Es la última sección."
                )}
              </p>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={continuar}>
                  {siguiente ? "Continuar" : "Finalizar"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button variant="outline" onClick={onExit}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Total: {totalPaginas} páginas en {totalSecciones} secciones.
      </p>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-primary/40 bg-accent" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-semibold">{value}</div>
    </div>
  )
}
