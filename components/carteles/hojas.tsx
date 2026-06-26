import type { Producto, Formato } from "@/lib/types"
import { FORMATO_POR_HOJA } from "@/lib/types"
import { expandirCarteles, chunk } from "@/lib/cartel-utils"
import { Cartel } from "./cartel"

function Hoja({ items, formato }: { items: Producto[]; formato: Formato }) {
  if (formato === "grande") {
    return (
      <div className="hoja hoja-portrait shadow-sm">
        <Cartel producto={items[0]} formato={formato} />
      </div>
    )
  }

if (formato === "x2") {
  return (
    <div className="hoja hoja-portrait grid grid-cols-2 shadow-sm">
      {items.map((p, i) => (
        <div
          key={i}
          className="relative overflow-hidden border-r-2 border-dashed border-black/30 last:border-r-0"
        >
          <div className="absolute left-1/2 top-1/2 h-[107.95mm] w-[279.4mm] -translate-x-1/2 -translate-y-1/2 rotate-90">
            <Cartel producto={p} formato={formato} />
          </div>
        </div>
      ))}
    </div>
  )
}

  return (
    <div className="hoja hoja-portrait grid grid-cols-2 grid-rows-2 shadow-sm">
      {items.map((p, i) => (
        <div
          key={i}
          className="border-b-2 border-r-2 border-dashed border-black/30 [&:nth-child(2)]:border-r-0 [&:nth-child(4)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0"
        >
          <Cartel producto={p} formato={formato} />
        </div>
      ))}
    </div>
  )
}

export function construirHojas(productos: Producto[], formato: Formato): Producto[][] {
  const expandidos = expandirCarteles(productos)
  return chunk(expandidos, FORMATO_POR_HOJA[formato])
}

export function Hojas({
  productos,
  formato,
  zoom = 1,
  className,
}: {
  productos: Producto[]
  formato: Formato
  zoom?: number
  className?: string
}) {
  const hojas = construirHojas(productos, formato)

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: zoom < 1 ? 16 : 0 }}>
      {hojas.map((items, i) => (
        <div key={i} style={zoom !== 1 ? { zoom } : undefined}>
          <Hoja items={items} formato={formato} />
        </div>
      ))}
    </div>
  )
}