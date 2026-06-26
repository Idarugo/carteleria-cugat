import type { Producto, Formato } from "@/lib/types"
import { esAgotarStock, formatPrecio, formatPesos } from "@/lib/cartel-utils"

function separarFechaCartel(fecha: string) {
  const limpia = fecha.trim().toUpperCase()

  if (!limpia) return { dia: "", mes: "" }

  const partes = limpia.split(/\s+/)

  if (partes.length >= 2) {
    return {
      dia: partes[0],
      mes: partes.slice(1).join(" "),
    }
  }

  return {
    dia: limpia,
    mes: "",
  }
}

function Vigencia({
  desde,
  hasta,
  className,
  modo = "normal",
}: {
  desde: string
  hasta: string
  className?: string
  modo?: "normal" | "x4"
}) {
  if (!desde && !hasta) return null

  if (hasta && esAgotarStock(hasta)) {
    return <div className={className}>VÁLIDO HASTA AGOTAR STOCK</div>
  }

if (modo === "x4") {
  const desdeF = separarFechaCartel(desde)
  const hastaF = separarFechaCartel(hasta)

  return (
    <div className={`${className} relative h-[12px]`}>
      <span className="absolute left-[0px]">{desdeF.dia}</span>
      <span className="absolute left-[42px]">{desdeF.mes}</span>

      <span className="absolute left-[108px]">{hastaF.dia}</span>
      <span className="absolute left-[150px]">{hastaF.mes}</span>
    </div>
  )
}

  return (
    <div className={className}>
      {desde && hasta ? `VIGENCIA: ${desde} AL ${hasta}` : `VIGENCIA: ${desde || hasta}`}
    </div>
  )
}

function PrecioPrincipal({
  p,
  precioClassName,
  pesoClassName,
  promoClassName,
}: {
  p: Producto
  precioClassName: string
  pesoClassName: string
  promoClassName: string
}) {
  if (p.tipoOferta !== "normal" && p.promoCantidad) {
    return (
      <div className="flex flex-col items-center leading-none text-[#d50000]">
        <div className={`font-display -skew-x-6 uppercase ${promoClassName}`}>
          {p.promoCantidad}
        </div>

        <div className={`font-display -skew-x-6 ${precioClassName}`}>
          <span className={`align-top ${pesoClassName}`}>$</span>
          {formatPrecio(p.precioOferta)}
        </div>
      </div>
    )
  }

  return (
    <div className={`font-display -skew-x-6 leading-none text-[#d50000] ${precioClassName}`}>
      <span className={`align-top ${pesoClassName}`}>$</span>
      {formatPrecio(p.precioOferta)}
    </div>
  )
}

/* -------------------------- GRANDE (1 por hoja) -------------------------- */
function CartelGrande({ p }: { p: Producto }) {
  return (
    <div className="flex h-full flex-col px-16 pt-[150px] pb-[95px] text-black">
      <h2 className="font-display -skew-x-6 text-balance text-center text-[52px] uppercase leading-[1.02]">
        {p.descripcion}
      </h2>

      <div className="mt-5 text-right font-mono text-[20px] font-bold italic tracking-tight">
        SKU: {p.codigo}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center pb-[40px]">
        <PrecioPrincipal
          p={p}
          precioClassName="text-[190px]"
          pesoClassName="text-[100px]"
          promoClassName="text-[104px]"
        />

        {p.precioUnidad && (
          <div className="font-display mt-3 text-[34px] uppercase">
            {p.unidadLabel} {p.precioUnidad}
          </div>
        )}
      </div>

      <div className="mb-8 flex items-end justify-between font-display text-[30px] uppercase">
        {p.precioVenta > 0 && <span>Antes: {formatPesos(p.precioVenta)}</span>}
        {p.ahorro > 0 && <span>Ahorro: {formatPesos(p.ahorro)}</span>}
      </div>

      <Vigencia
        desde={p.desde}
        hasta={p.hasta}
        className="mb-4 text-center font-mono text-[18px] font-bold italic"
      />
    </div>
  )
}

/* ---------------------------- X2 (2 por hoja) ---------------------------- */
function CartelX2({ p }: { p: Producto }) {
  return (
    <div className="flex h-full items-center px-12 pt-[28px] pb-[24px] text-black">
      <div className="flex w-[42%] flex-col justify-center">
        <h2 className="font-display -skew-x-6 text-balance text-[36px] uppercase leading-[1.02]">
          {p.descripcion}
        </h2>

        <div className="mt-8 font-mono text-[15px] font-bold italic">
          SKU: {p.codigo}
        </div>
      </div>

      <div className="flex w-[18%] flex-col items-center justify-center">
        {p.precioUnidad && (
          <div className="text-center font-display text-[24px] uppercase leading-tight">
            {p.unidadLabel}
            <br />
            {p.precioUnidad}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col items-end justify-start pt-[58px]">
        <PrecioPrincipal
          p={p}
          precioClassName="text-[150px]"
          pesoClassName="text-[74px]"
          promoClassName="text-[82px]"
        />

        <div className="mt-3 flex gap-8 font-display text-[22px] uppercase">
          {p.precioVenta > 0 && <span>Antes: {formatPesos(p.precioVenta)}</span>}
          {p.ahorro > 0 && <span>Ahorro: {formatPesos(p.ahorro)}</span>}
        </div>

        <Vigencia
          desde={p.desde}
          hasta={p.hasta}
          className="mt-5 font-mono text-[14px] font-bold italic"
        />
      </div>
    </div>
  )
}

/* ---------------------------- X4 (4 por hoja) ---------------------------- */
function CartelX4({ p }: { p: Producto }) {
  return (
    <div className="flex h-full flex-col px-7 pt-[132px] pb-[18px] text-black">
      <h2 className="font-display -skew-x-6 text-balance text-center text-[22px] uppercase leading-[1.02]">
        {p.descripcion}
      </h2>

      <div className="mt-2 text-center font-mono text-[11px] font-bold italic">
        SKU: {p.codigo}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <PrecioPrincipal
          p={p}
          precioClassName="text-[108px]"
          pesoClassName="text-[58px]"
          promoClassName="text-[54px]"
        />
      </div>

      <div className="pb-[20px]">
        {p.precioUnidad && (
          <div className="font-display text-[16px] uppercase">
            {p.unidadLabel} {p.precioUnidad}
          </div>
        )}

        <div className="mt-1 flex items-end justify-between font-display text-[15px] uppercase">
          {p.precioVenta > 0 && <span>Antes: {formatPesos(p.precioVenta)}</span>}
          {p.ahorro > 0 && <span>Ahorro: {formatPesos(p.ahorro)}</span>}
        </div>

   <Vigencia
  desde={p.desde}
  hasta={p.hasta}
  modo="x4"
  className="mx-auto mt-[7px] w-[190px] font-mono text-[8px] font-bold italic leading-none"
/>
      </div>
    </div>
  )
}

export function Cartel({ producto, formato }: { producto: Producto; formato: Formato }) {
  if (formato === "grande") return <CartelGrande p={producto} />
  if (formato === "x2") return <CartelX2 p={producto} />
  return <CartelX4 p={producto} />
}