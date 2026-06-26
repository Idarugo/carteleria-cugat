/**
 * Formato de moneda chilena y utilidades de precio.
 * CLP no usa decimales: $1.234 (punto como separador de miles).
 */

const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

/** "$1.234". Devuelve "—" para valores no finitos. */
export function formatCLP(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return clpFormatter.format(Math.round(value))
}

/** Solo el número con separador de miles, sin símbolo: "1.234". */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(
    Math.round(value),
  )
}

/** Convierte un string de precio de la API a número entero CLP seguro. */
export function parsePrice(raw: string | number | null | undefined): number {
  if (raw == null) return 0
  const n = typeof raw === 'number' ? raw : Number.parseFloat(raw)
  return Number.isFinite(n) ? n : 0
}

/** Normaliza un código escaneado/tecleado: solo dígitos, sin espacios. */
export function normalizeCode(input: string): string {
  return input.replace(/\D+/g, '').trim()
}

/** Valida que un código tenga forma de EAN/UPC/PLU plausible (4–14 dígitos). */
export function isLikelyBarcode(code: string): boolean {
  const c = normalizeCode(code)
  return c.length >= 4 && c.length <= 14
}
