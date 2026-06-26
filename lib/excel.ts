import * as XLSX from "xlsx";
import type { Producto } from "./types";
import {
  calcularPrecioUnidad,
  parseOferta,
  parsePrecioChileno,
} from "./cartel-utils";

const MESES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

function normHeader(h: string): string {
  return h
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

const HEADER_MAP: Record<string, string> = {
  SECCION: "SECCION",
  SECCIÓN: "SECCION",
  CODIGO: "CODIGO",
  CÓDIGO: "CODIGO",
  SKU: "CODIGO",
  DESCRIPCION: "DESCRIPCION",
  DESCRIPCIÓN: "DESCRIPCION",

  "P.VENTA": "PVENTA",
  "P VENTA": "PVENTA",
  PVENTA: "PVENTA",
  "PRECIO VENTA": "PVENTA",

  "P.OFERTA": "POFERTA",
  "P OFERTA": "POFERTA",
  POFERTA: "POFERTA",
  "PRECIO OFERTA": "POFERTA",
  OFERTA: "POFERTA",

  DESDE: "DESDE",
  HASTA: "HASTA",

  CANTIDAD_CARTEL: "CANTIDAD",
  "CANTIDAD CARTEL": "CANTIDAD",
  "CANT. CARTEL": "CANTIDAD",
  "N° CARTELES": "CANTIDAD",
  NUMERO_CARTELES: "CANTIDAD",
  COPIAS: "CANTIDAD",
  CANTIDAD: "CANTIDAD",

  VARIEDAD: "VARIEDAD",
  "ES VARIEDAD": "VARIEDAD",
  "CARTEL VARIEDAD": "VARIEDAD",

  NOMBRE_CARTEL: "NOMBRE_CARTEL",
  "NOMBRE CARTEL": "NOMBRE_CARTEL",
  "DESCRIPCION CARTEL": "NOMBRE_CARTEL",
  "DESCRIPCIÓN CARTEL": "NOMBRE_CARTEL",

  SKU_CARTEL: "SKU_CARTEL",
  "SKU CARTEL": "SKU_CARTEL",
  "CODIGO CARTEL": "SKU_CARTEL",
  "CÓDIGO CARTEL": "SKU_CARTEL",
};

function formatFecha(v: unknown): string {
  if (v == null || v === "") return "";

  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${String(d.d).padStart(2, "0")} ${MESES[d.m - 1]}`;
  }

  if (v instanceof Date) {
    return `${String(v.getDate()).padStart(2, "0")} ${MESES[v.getMonth()]}`;
  }

  return v.toString().trim().toUpperCase();
}

function esSiVariedad(v: unknown): boolean {
  const s = (v ?? "").toString().trim().toUpperCase();
  return ["SI", "SÍ", "S", "X", "1", "TRUE", "VARIEDAD"].includes(s);
}

function limpiarTexto(v: unknown): string {
  return (v ?? "").toString().trim();
}

function agruparVariedades(productos: Producto[]): Producto[] {
  const normales: Producto[] = [];
  const grupos = new Map<string, Producto[]>();

  for (const p of productos) {
    if (!p.esVariedad || !p.nombreCartel) {
      normales.push(p);
      continue;
    }

    const key = [
      p.seccion,
      p.nombreCartel.trim().toUpperCase(),
      p.ofertaOriginal.trim().toUpperCase(),
      p.precioOferta,
    ].join("|");

    const arr = grupos.get(key) ?? [];
    arr.push(p);
    grupos.set(key, arr);
  }

  const variedades: Producto[] = [];

  Array.from(grupos.values()).forEach((grupo, idx) => {
    const base = grupo[0];

    variedades.push({
      ...base,
      id: `variedad-${idx}-${base.id}`,
      descripcion: base.nombreCartel || base.descripcion,
      codigo: base.skuCartel || "VARIOS SKU",
      cantidad: Math.max(1, base.cantidadBase || 1),
      cantidadBase: Math.max(1, base.cantidadBase || 1),
      esVariedad: true,
      cantidadAgrupada: grupo.length,
      productosAgrupados: grupo.map((p) => `${p.codigo} - ${p.descripcion}`),
    });
  });

  return [...normales, ...variedades];
}

export interface ParseResult {
  productos: Producto[];
  secciones: string[];
  warnings: string[];
}

export async function parseExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const warnings: string[] = [];
  const productos: Producto[] = [];

  rows.forEach((row, idx) => {
    const mapped: Record<string, unknown> = {};

    for (const key of Object.keys(row)) {
      const target = HEADER_MAP[normHeader(key)];
      if (target) mapped[target] = row[key];
    }

    const seccion = limpiarTexto(mapped.SECCION).toUpperCase();
    const descripcion = limpiarTexto(mapped.DESCRIPCION);
    const codigo = limpiarTexto(mapped.CODIGO);

    if (!descripcion && !codigo) return;

    if (!seccion) {
      warnings.push(
        `Fila ${idx + 2}: sin SECCION, se omitió "${descripcion || codigo}".`,
      );
      return;
    }

    const precioVenta = parsePrecioChileno(mapped.PVENTA);
    const oferta = parseOferta(mapped.POFERTA);
    const precioOferta = oferta.precioOferta;

    const cantidadRaw = parsePrecioChileno(mapped.CANTIDAD);
    const cantidad = cantidadRaw > 0 ? Math.round(cantidadRaw) : 1;

    const unidad = calcularPrecioUnidad(descripcion, precioOferta);

    const esVariedad = esSiVariedad(mapped.VARIEDAD);
    const nombreCartel = limpiarTexto(mapped.NOMBRE_CARTEL);
    const skuCartel = limpiarTexto(mapped.SKU_CARTEL);

    productos.push({
      id: `${codigo || "p"}-${idx}`,
      seccion,
      codigo,
      descripcion,
      precioVenta,
      precioOferta,
      ahorro: Math.max(0, precioVenta - precioOferta),
      desde: formatFecha(mapped.DESDE),
      hasta: formatFecha(mapped.HASTA),

      ofertaOriginal: oferta.ofertaOriginal,
      tipoOferta: oferta.tipoOferta,
      promoCantidad: oferta.promoCantidad,

      cantidad,
      cantidadBase: cantidad,
      precioUnidad: unidad?.valor ?? null,
      unidadLabel: unidad?.label ?? null,

      esVariedad,
      nombreCartel,
      skuCartel,
    });
  });

  const productosFinales = agruparVariedades(productos);

  const totalAgrupados = productos.filter((p) => p.esVariedad).length;
  const totalCartelesVariedad = productosFinales.filter(
    (p) => p.esVariedad,
  ).length;

  if (totalAgrupados > 0) {
    warnings.push(
      `Variedades: ${totalAgrupados} productos agrupados en ${totalCartelesVariedad} carteles. Ahorro estimado: ${totalAgrupados - totalCartelesVariedad} carteles.`,
    );
  }

  const secciones = Array.from(new Set(productosFinales.map((p) => p.seccion)));

  return {
    productos: productosFinales,
    secciones,
    warnings,
  };
}
