"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Tag, FileSpreadsheet, Search, Info } from "lucide-react"
import type { Producto, Formato } from "@/lib/types"
import type { ParseResult } from "@/lib/excel"
import { PrintPortal } from "@/components/carteles/print-portal"
import { UploadStep } from "@/components/steps/upload-step"
import { ConfigStep } from "@/components/steps/config-step"
import { PreviewStep } from "@/components/steps/preview-step"
import { PrintFlow } from "@/components/steps/print-flow"
import { ReprintStep } from "@/components/steps/reprint-step"

type Vista = "config" | "preview" | "print"
type Tab = "generar" | "reimpresion" | "acerca"

const STORAGE_KEY = "cartel-cugat:v1"

export function CartelApp() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [secciones, setSecciones] = useState<string[]>([])
  const [fileName, setFileName] = useState("")
  const [formato, setFormato] = useState<Formato>("grande")
  const [excluidas, setExcluidas] = useState<Set<string>>(new Set())

  const [tab, setTab] = useState<Tab>("generar")
  const [vista, setVista] = useState<Vista>("config")

  // ----- persistencia: sobrevive recargas y permite reimprimir entre sesiones -----
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        if (Array.isArray(s.productos) && s.productos.length > 0) {
          setProductos(s.productos)
          setSecciones(Array.isArray(s.secciones) ? s.secciones : [])
          setFileName(typeof s.fileName === "string" ? s.fileName : "")
          setFormato(s.formato ?? "grande")
          setExcluidas(new Set(Array.isArray(s.excluidas) ? s.excluidas : []))
        }
      }
    } catch {
      // estado corrupto: se ignora y se arranca limpio
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      if (productos.length === 0) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          productos,
          secciones,
          fileName,
          formato,
          excluidas: Array.from(excluidas),
        }),
      )
    } catch {
      // cuota excedida u otro error de almacenamiento: no romper la app
    }
  }, [loaded, productos, secciones, fileName, formato, excluidas])

  // ----- printing engine -----
  const [batch, setBatch] = useState<{ productos: Producto[]; formato: Formato } | null>(null)
  const resolveRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!batch) return
    let cancelled = false

    const after = () => {
      window.removeEventListener("afterprint", after)
      const r = resolveRef.current
      resolveRef.current = null
      setBatch(null)
      r?.()
    }

    // Esperar a que las fuentes (Anton) terminen de cargar antes de imprimir;
    // si no, los precios salen en la fuente de respaldo y se ven distintos.
    const fontsReady =
      typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve()

    fontsReady.then(() => {
      // Doble rAF: garantiza que #print-root ya pintó las hojas del batch.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return
          window.addEventListener("afterprint", after)
          window.print()
        })
      })
    })

    return () => {
      cancelled = true
      window.removeEventListener("afterprint", after)
    }
  }, [batch])

  const doPrint = useCallback((prods: Producto[], fmt: Formato) => {
    return new Promise<void>((resolve) => {
      resolveRef.current = resolve
      setBatch({ productos: prods, formato: fmt })
    })
  }, [])

  function handleLoaded(r: ParseResult, name: string) {
    setProductos(r.productos)
    setSecciones(r.secciones)
    setFileName(name)
    setExcluidas(new Set())
    setVista("config")
    setTab("generar")
  }

  function reset() {
    setProductos([])
    setSecciones([])
    setFileName("")
    setExcluidas(new Set())
    setVista("config")
  }

  const cargado = productos.length > 0

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background no-print">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Tag className="size-4" />
            </div>
            <div>
              <div className="font-semibold leading-tight">Cartelería Cugat</div>
              <div className="text-xs text-muted-foreground">Generación e impresión de ofertas</div>
            </div>
          </div>

          {cargado && (
            <nav className="flex items-center gap-1 rounded-lg bg-muted p-1">
              <TabButton active={tab === "generar"} onClick={() => setTab("generar")}>
                <FileSpreadsheet className="size-4" />
                Generar
              </TabButton>
              <TabButton active={tab === "reimpresion"} onClick={() => setTab("reimpresion")}>
                <Search className="size-4" />
                Reimpresión
              </TabButton>
              <TabButton active={tab === "acerca"} onClick={() => setTab("acerca")}>
                <Info className="size-4" />
                Acerca de
              </TabButton>
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 no-print">
        {!cargado && <UploadStep onLoaded={handleLoaded} />}

        {cargado && tab === "generar" && vista === "config" && (
          <ConfigStep
            productos={productos}
            setProductos={setProductos}
            secciones={secciones}
            formato={formato}
            setFormato={setFormato}
            excluidas={excluidas}
            setExcluidas={setExcluidas}
            fileName={fileName}
            onContinue={() => setVista("preview")}
            onReset={reset}
          />
        )}

        {cargado && tab === "generar" && vista === "preview" && (
          <PreviewStep
            productos={productos}
            formato={formato}
            excluidas={excluidas}
            onBack={() => setVista("config")}
            onStartPrint={() => setVista("print")}
            onPrintAll={() =>
              doPrint(
                productos.filter((p) => !excluidas.has(p.seccion)),
                formato,
              )
            }
          />
        )}

        {cargado && tab === "generar" && vista === "print" && (
          <PrintFlow
            productos={productos}
            formato={formato}
            excluidas={excluidas}
            onPrintSection={doPrint}
            onExit={() => setVista("preview")}
          />
        )}

        {cargado && tab === "reimpresion" && (
          <ReprintStep productos={productos} onPrint={doPrint} />
        )}

        {cargado && tab === "acerca" && <AcercaDe />}
      </main>

      <PrintPortal batch={batch} />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}

function AcercaDe() {
  return (
    <section className="mx-auto max-w-3xl py-10">
      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Sistema Cartelería Cugat
          </h2>
          <p className="mt-2 text-muted-foreground">
            Plataforma interna para generación e impresión de carteles de ofertas.
          </p>
        </div>

        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <InfoItem label="Versión" value="1.0" />
          <InfoItem label="Año" value="2026" />
          <InfoItem label="Desarrollado por" value="Marcelo Hidalgo" />
          <InfoItem label="Área" value="Informática" />
          <InfoItem label="Tecnologías" value="Next.js · React · TypeScript · Tailwind CSS" />
          <InfoItem label="Procesamiento" value="SheetJS · PDF · Cartelería automática" />
        </div>

        <div className="mt-6 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          Sistema desarrollado para optimizar el proceso operativo de cartelería,
          reducir trabajo manual y evitar errores en la impresión por sección.
        </div>
      </div>
    </section>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  )
}
