import type { CugatProduct, Product } from './types'
import { parsePrice } from './format'

/** Decodifica entidades HTML básicas que devuelve WooCommerce en los nombres. */
function decodeEntities(text: string): string {
  if (!text) return ''
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/** Quita tags HTML de la descripción corta y normaliza espacios. */
function stripHtml(html: string): string {
  if (!html) return ''
  return decodeEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Convierte un producto crudo de la Store API en el modelo `Product`.
 * Centraliza el cálculo de oferta, ahorro y porcentaje para que la UI
 * no tenga lógica de precios dispersa.
 */
export function normalizeProduct(raw: CugatProduct): Product {
  const regularPrice = parsePrice(raw.prices?.regular_price)
  const price = parsePrice(raw.prices?.price)
  const salePriceRaw = parsePrice(raw.prices?.sale_price)

  // Una oferta real exige flag on_sale y que el precio vigente sea menor.
  const onSale = Boolean(raw.on_sale) && regularPrice > price && price > 0
  const salePrice = onSale ? price : null
  const savings = onSale ? Math.max(0, regularPrice - price) : 0
  const discountPercent =
    onSale && regularPrice > 0 ? Math.round((savings / regularPrice) * 100) : 0

  const image = raw.images?.[0]

  return {
    id: raw.id,
    code: raw.sku?.trim() ?? '',
    name: decodeEntities(raw.name ?? '').trim(),
    slug: raw.slug ?? '',
    permalink: raw.permalink ?? '',
    brand: raw.brands?.[0]?.name ? decodeEntities(raw.brands[0].name) : null,
    category: raw.categories?.[0]?.name
      ? decodeEntities(raw.categories[0].name)
      : null,
    price,
    regularPrice: regularPrice || price,
    salePrice,
    onSale,
    savings,
    discountPercent,
    inStock: Boolean(raw.is_in_stock),
    lowStock: raw.low_stock_remaining ?? null,
    image: image?.src ?? null,
    imageAlt: image?.alt || decodeEntities(raw.name ?? ''),
    shortDescription: stripHtml(raw.short_description ?? ''),
  }
}
