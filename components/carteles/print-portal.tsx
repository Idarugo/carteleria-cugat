"use client"

import type { Producto, Formato } from "@/lib/types"
import { Hojas } from "./hojas"

/**
 * Always-mounted, screen-hidden container that the browser print dialog
 * renders. Populate `batch` then call window.print().
 */
export function PrintPortal({
  batch,
}: {
  batch: { productos: Producto[]; formato: Formato } | null
}) {
  return (
    <div id="print-root">
      {batch && <Hojas productos={batch.productos} formato={batch.formato} />}
    </div>
  )
}
