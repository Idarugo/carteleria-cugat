"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, Printer, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Producto, Formato } from "@/lib/types"
import { agruparPorSeccion } from "@/lib/cartel-utils"
import { Hojas, construirHojas } from "@/components/carteles/hojas"

export function PreviewStep({
  productos,
  formato,
  excluidas,
  onBack,
  onStartPrint,
  onPrintAll,
}: {
  productos: Producto[]
  formato: Formato
  excluidas: Set<string>
  onBack: () => void
  onStartPrint: () => void
  onPrintAll: () => void
}) {
  const activos = useMemo(
    () => productos.filter((p) => !excluidas.has(p.seccion)),
    [productos, excluidas],
  )
  const grupos = useMemo(() => agruparPorSeccion(activos), [activos])
  const secciones = Array.from(grupos.keys())
  const [sel, setSel] = useState(secciones[0] ?? "")

  const current = grupos.get(sel) ?? []
  const hojasCount = construirHojas(current, formato).length

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" />
          Volver a configuración
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPrintAll}>
            <Printer className="mr-2 size-4" />
            Imprimir todo de una vez
          </Button>
          <Button onClick={onStartPrint}>
            <Play className="mr-2 size-4" />
            Impresión continua por sección
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-lg font-semibold">Vista previa</h3>
        <p className="text-sm text-muted-foreground">
          Revisa los carteles por sección antes de imprimir. Las líneas punteadas indican el corte.
        </p>
      </div>

      {/* Section selector */}
      <div className="flex flex-wrap gap-2">
        {secciones.map((s) => {
          const count = construirHojas(grupos.get(s) ?? [], formato).length
          return (
            <button
              key={s}
              onClick={() => setSel(s)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                sel === s ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {s}
              <Badge
                variant={sel === s ? "secondary" : "outline"}
                className="px-1.5 py-0 text-[10px]"
              >
                {count} hoja{count !== 1 ? "s" : ""}
              </Badge>
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="mb-3 text-sm text-muted-foreground">
          {sel} · {current.length} productos · {hojasCount} hoja{hojasCount !== 1 ? "s" : ""}
        </div>
        <div className="flex justify-center">
          <Hojas productos={current} formato={formato} zoom={0.42} />
        </div>
      </div>
    </div>
  )
}
