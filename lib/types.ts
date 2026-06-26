export type Formato = "grande" | "x2" | "x4";

export type TipoOferta = "normal" | "multiplo" | "por_peso";

export interface FilaExcel {
  SECCION: string;
  CODIGO: string;
  DESCRIPCION: string;
  "P.VENTA": number | string;
  "P.OFERTA": number | string;
  DESDE: string;
  HASTA: string;
  CANTIDAD_CARTEL?: number;

  VARIEDAD?: string;
  NOMBRE_CARTEL?: string;
  SKU_CARTEL?: string;
}

export interface Producto {
  id: string;
  seccion: string;
  codigo: string;
  descripcion: string;
  precioVenta: number;
  precioOferta: number;
  ahorro: number;
  desde: string;
  hasta: string;

  ofertaOriginal: string;
  tipoOferta: TipoOferta;
  promoCantidad: string | null;

  cantidad: number;
  cantidadBase: number;
  precioUnidad: string | null;
  unidadLabel: string | null;

  esVariedad?: boolean;
  nombreCartel?: string;
  skuCartel?: string;
  cantidadAgrupada?: number;
  productosAgrupados?: string[];
}

export const FORMATO_LABEL: Record<Formato, string> = {
  grande: "Grande (1 por hoja)",
  x2: "X2 (2 por hoja)",
  x4: "X4 (4 por hoja)",
};

export const FORMATO_POR_HOJA: Record<Formato, number> = {
  grande: 1,
  x2: 2,
  x4: 4,
};

export const SECCIONES_MULTIPUNTO = [
  "BEBIDAS",
  "LACTEOS",
  "LÁCTEOS",
  "ABARROTES",
  "PROMOCIONES DESTACADAS",
  "PROMOCIONES",
];

export interface PrintSettings {
  escala: number;
  margenSuperior: number;
  margenInferior: number;
  margenIzquierdo: number;
  margenDerecho: number;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  escala: 100,
  margenSuperior: 0,
  margenInferior: 0,
  margenIzquierdo: 0,
  margenDerecho: 0,
};

export interface Plantilla {
  id: string;
  nombre: string;
  descripcion: string;
  fondo: string | null;
}

export const PLANTILLAS: Plantilla[] = [
  {
    id: "estandar",
    nombre: "Oferta estándar",
    descripcion: "Cartel blanco estándar de ofertas.",
    fondo: null,
  },
  {
    id: "alcohol",
    nombre: "Alcohol",
    descripcion: "Plantilla para bebidas alcohólicas y licores.",
    fondo: null,
  },
  {
    id: "super-ahorro",
    nombre: "Súper ahorro",
    descripcion: "Plantilla destacada para grandes rebajas.",
    fondo: null,
  },
];

export const PLANTILLA_DEFAULT = PLANTILLAS[0];
