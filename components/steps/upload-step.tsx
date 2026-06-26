"use client"

import { useMemo, useRef, useState } from "react"
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  PencilLine,
  CalendarDays,
  BadgePercent,
  Barcode,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { parseExcel, type ParseResult } from "@/lib/excel"
import type { Producto } from "@/lib/types"
import { calcularPrecioUnidad, parseOferta, parsePrecioChileno, formatPesos } from "@/lib/cartel-utils"

const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]

function fechaCorta(d = new Date()) {
  return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]}`
}

function finDeMes() {
  const d = new Date()
  return fechaCorta(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

function limpiarEAN(v: string) {
  return v.replace(/\D/g, "").slice(0, 13)
}

function calcularDigitoEAN13(base12: string) {
  const code = base12.replace(/\D/g, "").slice(0, 12)

  if (code.length !== 12) return ""

  let suma = 0

  for (let i = 0; i < 12; i++) {
    const n = Number(code[i])
    suma += i % 2 === 0 ? n : n * 3
  }

  return String((10 - (suma % 10)) % 10)
}

function generarEAN13(valor: string) {
  const limpio = valor.replace(/\D/g, "")

  if (limpio.length < 12) return limpio

  const base12 = limpio.substring(0, 12)
  const dv = calcularDigitoEAN13(base12)

  return base12 + dv
}

function validarEAN13(codigo: string) {
  const limpio = codigo.replace(/\D/g, "")

  if (limpio.length !== 13) return false

  const base12 = limpio.substring(0, 12)
  const dv = limpio.substring(12, 13)

  return calcularDigitoEAN13(base12) === dv
}

export function UploadStep({ onLoaded }: { onLoaded: (r: ParseResult, fileName: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [modoManual, setModoManual] = useState(false)

  const [seccion, setSeccion] = useState("MANUAL")
  const [codigo, setCodigo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [precioVenta, setPrecioVenta] = useState("")
  const [precioOferta, setPrecioOferta] = useState("")
  const [desde, setDesde] = useState(fechaCorta())
  const [hasta, setHasta] = useState(finDeMes())
  const [cantidad, setCantidad] = useState("1")

  const ofertaPreview = useMemo(() => parseOferta(precioOferta), [precioOferta])
  const ventaPreview = useMemo(() => parsePrecioChileno(precioVenta), [precioVenta])
  const ahorroPreview = Math.max(0, ventaPreview - ofertaPreview.precioOferta)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setLoading(true)

    try {
      const result = await parseExcel(file)

      if (result.productos.length === 0) {
        setError("No se encontraron productos válidos. Revisa que el Excel tenga las columnas requeridas.")
        setLoading(false)
        return
      }

      onLoaded(result, file.name)
    } catch (e) {
      console.error("Error al leer el Excel:", e)
      setError("No se pudo leer el archivo. Asegúrate de que sea un .xlsx válido.")
      setLoading(false)
    }
  }

  function aplicarPromo(tipo: "normal" | "2X" | "3X" | "4X" | "5X") {
    const precio = parsePrecioChileno(precioOferta)
    if (tipo === "normal") {
      setPrecioOferta(precio ? String(precio) : "")
      return
    }

    setPrecioOferta(`${tipo} $${precio ? precio.toLocaleString("es-CL") : ""}`)
  }

  function limpiarManual() {
    setCodigo("")
    setDescripcion("")
    setPrecioVenta("")
    setPrecioOferta("")
    setDesde(fechaCorta())
    setHasta(finDeMes())
    setCantidad("1")
  }

  function crearManual() {
    setError(null)

    if (!descripcion.trim()) {
      setError("Debes ingresar la descripción del producto.")
      return
    }

    if (!precioOferta.trim()) {
      setError("Debes ingresar el precio oferta.")
      return
    }

    if (codigo.trim() && limpiarEAN(codigo).length === 13 && !validarEAN13(codigo)) {
      setError("El código EAN-13 no es válido. Revisa el dígito verificador.")
      return
    }

    const oferta = parseOferta(precioOferta)
    const venta = parsePrecioChileno(precioVenta)
    const unidad = calcularPrecioUnidad(descripcion, oferta.precioOferta)
    const cant = Math.max(1, Math.round(Number(cantidad) || 1))

    const producto: Producto = {
      id: `manual-${Date.now()}`,
      seccion: seccion.trim().toUpperCase() || "MANUAL",
      codigo: codigo.trim() || "MANUAL",
      descripcion: descripcion.trim().toUpperCase(),
      precioVenta: venta,
      precioOferta: oferta.precioOferta,
      ahorro: Math.max(0, venta - oferta.precioOferta),
      desde: desde.trim().toUpperCase(),
      hasta: hasta.trim().toUpperCase(),

      ofertaOriginal: oferta.ofertaOriginal,
      tipoOferta: oferta.tipoOferta,
      promoCantidad: oferta.promoCantidad,

      cantidad: cant,
      cantidadBase: cant,
      precioUnidad: unidad?.valor ?? null,
      unidadLabel: unidad?.label ?? null,
    }

    onLoaded(
      {
        productos: [producto],
        secciones: [producto.seccion],
        warnings: [],
      },
      "Carga manual",
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 py-12">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Cargar archivo de ofertas</h2>
        <p className="mt-2 text-muted-foreground">
          Sube el Excel o crea un cartel manual si necesitas imprimir pocos productos.
        </p>
      </div>

      <div className="flex gap-2 rounded-lg bg-muted p-1">
        <Button variant={!modoManual ? "default" : "ghost"} onClick={() => setModoManual(false)}>
          <FileSpreadsheet className="mr-2 size-4" />
          Excel
        </Button>
        <Button variant={modoManual ? "default" : "ghost"} onClick={() => setModoManual(true)}>
          <PencilLine className="mr-2 size-4" />
          Manual
        </Button>
      </div>

      {!modoManual && (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              handleFile(e.dataTransfer.files?.[0])
            }}
            className={`flex w-full cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
              dragOver ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-accent/50"
            }`}
          >
            {loading ? (
              <Loader2 className="size-10 animate-spin text-primary" />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Upload className="size-7 text-primary" />
              </div>
            )}

            <div>
              <p className="font-medium">{loading ? "Procesando..." : "Arrastra el Excel aquí o haz clic"}</p>
              <p className="text-sm text-muted-foreground">Formato .xlsx · Carta</p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

                  <div className="w-full rounded-lg border bg-muted/40 p-4 text-sm">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <FileSpreadsheet className="size-4" />
              Columnas requeridas
            </div>

            <div className="flex flex-wrap gap-2">
              {["SECCION", "CODIGO", "DESCRIPCION", "P.VENTA", "P.OFERTA", "DESDE", "HASTA"].map((c) => (
                <code key={c} className="rounded bg-background px-2 py-0.5 text-xs">
                  {c}
                </code>
              ))}

              <code className="rounded bg-background px-2 py-0.5 text-xs text-muted-foreground">
                CANTIDAD_CARTEL
              </code>
              <code className="rounded bg-background px-2 py-0.5 text-xs text-muted-foreground">
                VARIEDAD
              </code>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={loading}>
              Seleccionar archivo
            </Button>
            <a
              href="/ejemplo-ofertas.xlsx"
              download
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Descargar Excel de ejemplo
            </a>
          </div>
        </>
      )}

      {modoManual && (
        <div className="w-full rounded-xl border bg-background p-5">
          <div className="mb-4">
            <h3 className="font-semibold">Crear cartel manual</h3>
            <p className="text-sm text-muted-foreground">
              Usa botones rápidos para precio, fecha y validación EAN-13.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Sección" value={seccion} onChange={setSeccion} placeholder="ABARROTES" />
              <label className="flex flex-col gap-1 text-sm">
                <span className="flex items-center gap-1 font-medium">
                  <Barcode className="size-4" />
                  Código / EAN13
                </span>

                <input
                  value={codigo}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, "")

                    if (valor.length <= 11) {
                      setCodigo(valor)
                      return
                    }

                    setCodigo(generarEAN13(valor))
                  }}
                  placeholder="780000000000"
                  className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                {codigo.length === 13 && (
                  <span
                    className={`text-xs ${
                      validarEAN13(codigo)
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {validarEAN13(codigo)
                      ? "EAN13 válido"
                      : "EAN13 inválido"}
                  </span>
                )}
              </label>

            <div className="sm:col-span-2">
              <Campo
                label="Descripción"
                value={descripcion}
                onChange={setDescripcion}
                placeholder="FIDEOS ROMANO VARIEDADES 400G"
              />
            </div>

            <Campo label="Precio venta / Antes" value={precioVenta} onChange={setPrecioVenta} placeholder="1490" />

            <div className="flex flex-col gap-1 text-sm">
              <span className="flex items-center gap-1 font-medium">
                <BadgePercent className="size-4" />
                Precio oferta
              </span>
              <input
                value={precioOferta}
                onChange={(e) => setPrecioOferta(e.target.value.toUpperCase())}
                placeholder="2 X $1.000"
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {(["normal", "2X", "3X", "4X", "5X"] as const).map((p) => (
                  <Button key={p} type="button" size="sm" variant="outline" onClick={() => aplicarPromo(p)}>
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <span className="flex items-center gap-1 font-medium">
                <CalendarDays className="size-4" />
                Desde
              </span>
              <input
                value={desde}
                onChange={(e) => setDesde(e.target.value.toUpperCase())}
                placeholder="20 JUN"
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="button" size="sm" variant="outline" onClick={() => setDesde(fechaCorta())}>
                Hoy
              </Button>
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <span className="flex items-center gap-1 font-medium">Hasta</span>
              <input
                value={hasta}
                onChange={(e) => setHasta(e.target.value.toUpperCase())}
                placeholder="30 JUN o AGOTAR STOCK"
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="outline" onClick={() => setHasta(finDeMes())}>
                  Fin mes
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setHasta("AGOTAR STOCK")}>
                  Agotar stock
                </Button>
              </div>
            </div>

            <Campo label="Cantidad carteles" value={cantidad} onChange={setCantidad} placeholder="1" />
          </div>

          <div className="mt-5 rounded-lg border bg-muted/40 p-4 text-sm">
            <div className="mb-2 font-medium">Resumen</div>
            <div className="grid gap-1 text-muted-foreground sm:grid-cols-2">
              <span>Oferta detectada: {precioOferta || "-"}</span>
              <span>Precio final: {ofertaPreview.precioOferta > 0 ? formatPesos(ofertaPreview.precioOferta) : "-"}</span>
              <span>Antes: {ventaPreview > 0 ? formatPesos(ventaPreview) : "-"}</span>
              <span>Ahorro: {ahorroPreview > 0 ? formatPesos(ahorroPreview) : "-"}</span>
              <span>Cantidad: {cantidad || "1"} cartel(es)</span>
              <span>Vigencia: {desde || "-"} al {hasta || "-"}</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button className="flex-1" size="lg" onClick={crearManual}>
              Generar cartel manual
            </Button>
            <Button variant="outline" size="lg" onClick={limpiarManual}>
              Limpiar
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex w-full items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  )
}