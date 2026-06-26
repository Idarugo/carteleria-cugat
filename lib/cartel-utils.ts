import type { Formato, Producto, TipoOferta } from "./types";
import { FORMATO_POR_HOJA, SECCIONES_MULTIPUNTO } from "./types";

/** Format an integer as Chilean pesos: 14990 -> "14.990" */
export function formatPrecio(n: number): string {
  if (n == null || isNaN(n)) return "0";
  return Math.round(n).toLocaleString("es-CL", { useGrouping: true });
}

export function formatPesos(n: number): string {
  return `$${formatPrecio(n)}`;
}

export function parsePrecioChileno(v: unknown): number {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  const s = v.toString().replace(/[^0-9.,-]/g, "");
  if (!s) return 0;

  if (s.includes(".") && s.includes(",")) {
    return Number.parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
  }

  // In Chile, dots are usually thousands separators: 5.790 => 5790
  if (s.includes(".")) {
    return Number.parseFloat(s.replace(/\./g, "")) || 0;
  }

  return Number.parseFloat(s.replace(",", ".")) || 0;
}

export interface OfertaParseada {
  tipoOferta: TipoOferta;
  precioOferta: number;
  ofertaOriginal: string;
  promoCantidad: string | null;
}

/**
 * Detecta ofertas especiales desde Excel:
 * - "2 X $ 5.790" -> multiplo, promoCantidad "2X", precio 5790
 * - "3 X $ 7.990" -> multiplo, promoCantidad "3X", precio 7990
 * - "0,25 X $ 2.199" -> por_peso, promoCantidad "0,25X", precio 2199
 * - 2490 -> normal, precio 2490
 */
export function parseOferta(v: unknown): OfertaParseada {
  const raw = v == null ? "" : v.toString().trim();
  const texto = raw.toUpperCase().replace(/\s+/g, " ");

  const match = texto.match(/^(\d+(?:[.,]\d+)?)\s*X\s*\$?\s*([0-9.,]+)/i);

  if (match) {
    const cantidadTexto = match[1].replace(".", ",");
    const cantidadNum = Number.parseFloat(cantidadTexto.replace(",", "."));
    const precio = parsePrecioChileno(match[2]);
    return {
      tipoOferta: cantidadNum > 0 && cantidadNum < 1 ? "por_peso" : "multiplo",
      precioOferta: precio,
      ofertaOriginal: raw,
      promoCantidad: `${cantidadTexto}X`,
      // ojo: no convertir "0,25" a "250 gr"; se muestra tal cual viene del Excel
    };
  }

  return {
    tipoOferta: "normal",
    precioOferta: parsePrecioChileno(v),
    ofertaOriginal: raw,
    promoCantidad: null,
  };
}

/**
 * Try to detect weight / volume in a description and compute a per-unit price.
 * Supports KG, G/GR, L/LT, ML/CC. Returns null when not enough info.
 */
export function calcularPrecioUnidad(
  descripcion: string,
  precioOferta: number,
): { valor: string; label: string } | null {
  if (!descripcion || !precioOferta) return null;
  const texto = descripcion.toUpperCase();

  const regex =
    /(\d+(?:[.,]\d+)?)\s*(KG|KGS|KILO|KILOS|GR|GRS|G|ML|CC|LT|LTS|L)\b/;
  const match = texto.match(regex);
  if (!match) return null;

  const cantidad = Number.parseFloat(match[1].replace(",", "."));
  const unidad = match[2];
  if (!cantidad || cantidad <= 0) return null;

  let kilos = 0;
  let litros = 0;

  if (["KG", "KGS", "KILO", "KILOS"].includes(unidad)) kilos = cantidad;
  else if (["GR", "GRS", "G"].includes(unidad)) kilos = cantidad / 1000;
  else if (["L", "LT", "LTS"].includes(unidad)) litros = cantidad;
  else if (["ML", "CC"].includes(unidad)) litros = cantidad / 1000;

  if (kilos > 0)
    return { valor: formatPesos(precioOferta / kilos), label: "PRECIO KILO" };
  if (litros > 0)
    return { valor: formatPesos(precioOferta / litros), label: "PRECIO LITRO" };
  return null;
}

export function esAgotarStock(v: string): boolean {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .includes("AGOTAR STOCK");
}

export function esMultipunto(seccion: string): boolean {
  const s = seccion.trim().toUpperCase();
  return SECCIONES_MULTIPUNTO.some((m) => s === m || s.includes(m));
}

export function agruparPorSeccion(
  productos: Producto[],
): Map<string, Producto[]> {
  const mapa = new Map<string, Producto[]>();
  for (const p of productos) {
    const arr = mapa.get(p.seccion) ?? [];
    arr.push(p);
    mapa.set(p.seccion, arr);
  }
  return mapa;
}

export function expandirCarteles(productos: Producto[]): Producto[] {
  const out: Producto[] = [];
  for (const p of productos) {
    const n = Math.max(1, p.cantidad || 1);
    for (let i = 0; i < n; i++) out.push(p);
  }
  return out;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
