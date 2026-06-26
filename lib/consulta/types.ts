/**
 * Tipos del módulo Consulta de Precios.
 *
 * `Cugat*` describe la forma cruda de la WooCommerce Store API
 * (https://cugat.cl/wp-json/wc/store/v1/products). `Product` es el modelo
 * normalizado que consume toda la UI: precios ya resueltos a número (CLP),
 * imagen principal extraída y oferta calculada en un solo lugar.
 */

export interface CugatPrices {
  price: string
  regular_price: string
  sale_price: string
  price_range: unknown | null
  currency_code: string
  currency_symbol: string
  currency_minor_unit: number
  currency_decimal_separator: string
  currency_thousand_separator: string
  currency_prefix: string
  currency_suffix: string
}

export interface CugatImage {
  id: number
  src: string
  thumbnail: string
  srcset: string
  sizes: string
  name: string
  alt: string
}

export interface CugatTerm {
  id: number
  name: string
  slug: string
  link?: string
}

export interface CugatProduct {
  id: number
  name: string
  slug: string
  type: string
  permalink: string
  sku: string
  short_description: string
  description: string
  on_sale: boolean
  prices: CugatPrices
  images: CugatImage[]
  categories: CugatTerm[]
  brands?: CugatTerm[]
  is_in_stock: boolean
  is_purchasable: boolean
  low_stock_remaining: number | null
  stock_availability: { text: string; class: string }
}

/** Modelo normalizado que usa la aplicación. Todos los precios en CLP enteros. */
export interface Product {
  id: number
  /** Código de barras / EAN (== SKU en Cugat). */
  code: string
  name: string
  slug: string
  permalink: string
  brand: string | null
  category: string | null
  /** Precio vigente (el que paga el cliente hoy). */
  price: number
  /** Precio normal de lista. */
  regularPrice: number
  /** Precio de oferta cuando aplica (== price si on_sale). */
  salePrice: number | null
  onSale: boolean
  /** Ahorro absoluto en CLP (regular - vigente). 0 si no hay oferta. */
  savings: number
  /** Porcentaje de descuento redondeado (0–100). 0 si no hay oferta. */
  discountPercent: number
  inStock: boolean
  lowStock: number | null
  /** URL de imagen principal o null si el producto no tiene foto. */
  image: string | null
  imageAlt: string
  shortDescription: string
}

/** Entrada del historial / favoritos persistida en localStorage. */
export interface StoredProduct extends Product {
  /** Timestamp epoch ms de la última consulta. */
  viewedAt: number
}

export type LookupSource = 'scan' | 'manual' | 'history' | 'search'

/** Respuesta uniforme del proxy /api/cugat. */
export interface LookupResponse {
  product: Product | null
  /** Resultados de búsqueda por nombre (modo ?q=). */
  results?: Product[]
}
