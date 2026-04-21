"use client";

import { createBrowserClient } from "@supabase/ssr";
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import { FileText, Plus, X } from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const LOGO_URL =
  process.env.NEXT_PUBLIC_NYG_LOGO_PDF_URL ??
  "https://thqmpndhlqknwactxcik.supabase.co/storage/v1/object/public/productos/logo.PNG";

const STORAGE_NUMERO_KEY = "nyg-presupuesto-consecutivo";
const PRESUPUESTO_PREFILL_KEY = "nyg_presupuesto_desde_consulta";

const inputClase =
  "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-amber-500/50";
const selectClase =
  "rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-500/50";

type OpcionLista = { id: number; nombre: string };

const nuevoProductoVacio = () => ({
  nombre: "",
  codigo: "",
  precio_costo: "",
  multiplicador_venta: "1.7",
  multiplicador_instalador: "1.5",
  categoria_id: "",
  marca_id: "",
  proveedor_id: "",
  moneda: "USD" as "USD" | "UYU",
});

type RelProveedor =
  | { nombre: string }
  | { nombre: string }[]
  | null
  | undefined;

type ProductoBusqueda = {
  id: number;
  nombre: string;
  codigo: string | null;
  precio_costo: number | null;
  multiplicador_venta: number | null;
  multiplicador_instalador: number | null;
  proveedores: RelProveedor;
};

type LineaPresupuesto = {
  productoId: number;
  nombre: string;
  codigo: string | null;
  cantidad: number;
  tipoPrecio: "venta" | "instalador";
  unitVenta: number;
  unitInstalador: number;
  /** null = usar precio según tipo (calculado) */
  precioUnitarioOverride: number | null;
};

function nombreProveedor(rel: RelProveedor): string {
  if (rel == null) return "—";
  if (Array.isArray(rel)) return rel[0]?.nombre ?? "—";
  return rel.nombre ?? "—";
}

function precioUnitarioEfectivo(l: LineaPresupuesto): number {
  if (
    l.precioUnitarioOverride != null &&
    Number.isFinite(l.precioUnitarioOverride)
  ) {
    return l.precioUnitarioOverride;
  }
  return l.tipoPrecio === "venta" ? l.unitVenta : l.unitInstalador;
}

function calcUnit(
  costo: number | null,
  mult: number | null,
): number {
  if (
    costo == null ||
    mult == null ||
    !Number.isFinite(costo) ||
    !Number.isFinite(mult)
  ) {
    return 0;
  }
  return costo * mult;
}

type MonedaPresupuesto = "USD" | "UYU";

function formatoUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatPrecioMoneda(moneda: MonedaPresupuesto, valor: number): string {
  if (moneda === "USD") return formatoUsd(valor);
  const num = valor.toLocaleString("es-UY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${num}`;
}

function parseCotizacion(str: string): number {
  const n = Number.parseFloat(str.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function siguienteNumeroPresupuesto(): string {
  if (typeof window === "undefined") return "NYG-001";
  const raw = window.localStorage.getItem(STORAGE_NUMERO_KEY);
  const last = raw ? Number.parseInt(raw, 10) : 0;
  const n = Number.isFinite(last) ? last : 0;
  return `NYG-${String(n + 1).padStart(3, "0")}`;
}

function persistirNumeroDespuesDePdf(numeroUsado: string) {
  const parsed = Number.parseInt(numeroUsado.replace(/^NYG-/i, ""), 10);
  if (!Number.isFinite(parsed)) return;
  window.localStorage.setItem(STORAGE_NUMERO_KEY, String(parsed));
}

async function imagenABase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function AdminPresupuestoPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);

  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [fecha, setFecha] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [numeroPresupuesto, setNumeroPresupuesto] = useState("NYG-001");
  const [notas, setNotas] = useState("");
  const [monedaPresupuesto, setMonedaPresupuesto] =
    useState<MonedaPresupuesto>("USD");
  const [cotizacion, setCotizacion] = useState("40");

  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [nuevoProductoForm, setNuevoProductoForm] = useState(nuevoProductoVacio);
  const [categoriasOpts, setCategoriasOpts] = useState<OpcionLista[]>([]);
  const [marcasOpts, setMarcasOpts] = useState<OpcionLista[]>([]);
  const [proveedoresOpts, setProveedoresOpts] = useState<OpcionLista[]>([]);
  const [guardandoNuevoProducto, setGuardandoNuevoProducto] = useState(false);
  const [errorNuevoProducto, setErrorNuevoProducto] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const cotizacionNum = useMemo(
    () => parseCotizacion(cotizacion),
    [cotizacion],
  );
  const factorMoneda =
    monedaPresupuesto === "UYU" ? cotizacionNum : 1;

  useEffect(() => {
    setNumeroPresupuesto(siguienteNumeroPresupuesto());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(PRESUPUESTO_PREFILL_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PRESUPUESTO_PREFILL_KEY);
    void (async () => {
      try {
        const items = JSON.parse(raw) as { id: number; cantidad: number }[];
        if (!Array.isArray(items) || items.length === 0) return;
        const ids = [...new Set(items.map((i) => i.id))];
        const { data, error } = await supabase
          .from("productos")
          .select(
            "id, nombre, codigo, precio_costo, multiplicador_venta, multiplicador_instalador, proveedores(nombre)",
          )
          .in("id", ids);
        if (error || !data?.length) return;
        const qtyById = new Map<number, number>();
        for (const it of items) {
          const add = it.cantidad > 0 ? Math.floor(it.cantidad) : 1;
          qtyById.set(it.id, (qtyById.get(it.id) ?? 0) + add);
        }
        const rows = data as ProductoBusqueda[];
        setLineas((prev) => {
          const merged = [...prev];
          for (const p of rows) {
            const cantidad = Math.max(1, qtyById.get(p.id) ?? 1);
            const unitVenta = calcUnit(p.precio_costo, p.multiplicador_venta);
            const unitInstalador = calcUnit(
              p.precio_costo,
              p.multiplicador_instalador,
            );
            const idx = merged.findIndex((l) => l.productoId === p.id);
            if (idx >= 0) {
              merged[idx] = {
                ...merged[idx],
                cantidad: merged[idx].cantidad + cantidad,
              };
            } else {
              merged.push({
                productoId: p.id,
                nombre: p.nombre,
                codigo: p.codigo,
                cantidad,
                tipoPrecio: "venta",
                unitVenta,
                unitInstalador,
                precioUnitarioOverride: null,
              });
            }
          }
          return merged;
        });
        setMensajeExito("Productos cargados desde la consulta.");
      } catch {
        // Ignorar JSON inválido
      }
    })();
  }, [supabase]);

  useEffect(() => {
    void (async () => {
      const [c, m, p] = await Promise.all([
        supabase.from("categorias").select("id, nombre").order("nombre"),
        supabase.from("marcas").select("id, nombre").order("nombre"),
        supabase.from("proveedores").select("id, nombre").order("nombre"),
      ]);
      if (!c.error) setCategoriasOpts((c.data ?? []) as OpcionLista[]);
      if (!m.error) setMarcasOpts((m.data ?? []) as OpcionLista[]);
      if (!p.error) setProveedoresOpts((p.data ?? []) as OpcionLista[]);
    })();
  }, [supabase]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResultados([]);
      setBuscando(false);
      return;
    }

    setBuscando(true);
    const term = q.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
    const pattern = `%${term}%`;

    const t = window.setTimeout(() => {
      void (async () => {
        const { data, error } = await supabase
          .from("productos")
          .select("*, proveedores(nombre)")
          .or(`nombre.ilike.${pattern},codigo.ilike.${pattern}`)
          .order("nombre", { ascending: true })
          .limit(25);

        if (error) {
          console.error(error);
          setResultados([]);
        } else {
          setResultados((data ?? []) as ProductoBusqueda[]);
        }
        setBuscando(false);
      })();
    }, 280);

    return () => window.clearTimeout(t);
  }, [query, supabase]);

  const agregarProducto = useCallback((p: ProductoBusqueda) => {
    const unitVenta = calcUnit(p.precio_costo, p.multiplicador_venta);
    const unitInstalador = calcUnit(
      p.precio_costo,
      p.multiplicador_instalador,
    );
    setLineas((prev) => {
      const idx = prev.findIndex((l) => l.productoId === p.id);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + 1 };
        return copia;
      }
      return [
        ...prev,
        {
          productoId: p.id,
          nombre: p.nombre,
          codigo: p.codigo,
          cantidad: 1,
          tipoPrecio: "venta",
          unitVenta,
          unitInstalador,
          precioUnitarioOverride: null,
        },
      ];
    });
    setDropdownAbierto(false);
    setQuery("");
    setResultados([]);
  }, []);

  const abrirModalNuevoProducto = () => {
    setNuevoProductoForm(nuevoProductoVacio());
    setErrorNuevoProducto("");
    setModalNuevoAbierto(true);
  };

  const cerrarModalNuevoProducto = () => {
    if (guardandoNuevoProducto) return;
    setModalNuevoAbierto(false);
    setErrorNuevoProducto("");
  };

  const onSubmitNuevoProducto = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorNuevoProducto("");
    const f = nuevoProductoForm;
    const nombre = f.nombre.trim();
    const codigo = f.codigo.trim();
    if (!nombre || !codigo) {
      setErrorNuevoProducto("Nombre y código son obligatorios.");
      return;
    }

    setGuardandoNuevoProducto(true);
    const pcRaw = f.precio_costo.trim();
    const pcNum =
      pcRaw === "" ? null : Number.parseFloat(pcRaw.replace(",", "."));
    const mvRaw = f.multiplicador_venta.trim();
    const mvNum =
      mvRaw === ""
        ? 1.7
        : Number.parseFloat(mvRaw.replace(",", "."));
    const miRaw = f.multiplicador_instalador.trim();
    const miNum =
      miRaw === ""
        ? 1.5
        : Number.parseFloat(miRaw.replace(",", "."));
    const payload = {
      nombre,
      codigo,
      precio_costo:
        pcNum != null && Number.isFinite(pcNum) ? pcNum : null,
      multiplicador_venta: Number.isFinite(mvNum) ? mvNum : 1.7,
      multiplicador_instalador: Number.isFinite(miNum) ? miNum : 1.5,
      moneda: f.moneda,
      categoria_id: f.categoria_id ? Number(f.categoria_id) : null,
      marca_id: f.marca_id ? Number(f.marca_id) : null,
      proveedor_id: f.proveedor_id ? Number(f.proveedor_id) : null,
      descripcion: null,
      imagen_url: null,
      disponible: true,
      destacado: false,
    };

    const { data, error } = await supabase
      .from("productos")
      .insert(payload)
      .select("*, proveedores(nombre)")
      .single();

    setGuardandoNuevoProducto(false);

    if (error) {
      setErrorNuevoProducto(error.message);
      return;
    }

    setModalNuevoAbierto(false);
    setNuevoProductoForm(nuevoProductoVacio());
    agregarProducto(data as ProductoBusqueda);
    setMensajeExito("Producto creado y agregado al presupuesto.");
    window.setTimeout(() => setMensajeExito(""), 4000);
  };

  const quitarLinea = (productoId: number) => {
    setLineas((prev) => prev.filter((l) => l.productoId !== productoId));
  };

  const limpiarTodo = () => {
    setLineas([]);
    setNombreCliente("");
    setTelefonoCliente("");
    setNotas("");
    const hoy = new Date().toISOString().slice(0, 10);
    setFecha(hoy);
    setNumeroPresupuesto(siguienteNumeroPresupuesto());
  };

  const totalGeneral = useMemo(() => {
    return lineas.reduce((acc, l) => {
      return (
        acc + precioUnitarioEfectivo(l) * l.cantidad * factorMoneda
      );
    }, 0);
  }, [lineas, factorMoneda]);

  const generarPdf = async () => {
    if (lineas.length === 0) return;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 12;

    const dataUrl = await imagenABase64(LOGO_URL);
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, "PNG", 14, y, 22, 22);
      } catch {
        /* sin logo */
      }
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("N&G Materiales Eléctricos", 40, y + 6);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Av. Aparicio Saravia casi Guyunusa, 20000, Maldonado, Uruguay",
      40,
      y + 12,
    );
    doc.text(
      "Teléfono: 42260541 | WhatsApp: +598 96 077 602",
      40,
      y + 17,
    );
    doc.text("Instagram: @nyg_iluminacionmaldonado", 40, y + 22);

    y += 32;
    doc.setDrawColor(180);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Presupuesto", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Número: ${numeroPresupuesto}`, 14, y);
    doc.text(`Fecha: ${fecha}`, 80, y);
    y += 6;
    doc.text(`Cliente: ${nombreCliente || "-"}`, 14, y);
    doc.text(`Telefono: ${telefonoCliente || "-"}`, 80, y);
    y += 10;

    if (notas.trim()) {
      doc.setFontSize(9);
      doc.text(`Notas: ${notas.trim()}`, 14, y);
      y += 8;
    }

    const factorPdf =
      monedaPresupuesto === "UYU" ? cotizacionNum : 1;
    const monedaPdf = monedaPresupuesto;

    const body = lineas.map((l) => {
      const pu = precioUnitarioEfectivo(l) * factorPdf;
      const sub = pu * l.cantidad;
      return [
        l.codigo ?? "-",
        l.nombre,
        String(l.cantidad),
        formatPrecioMoneda(monedaPdf, pu),
        formatPrecioMoneda(monedaPdf, sub),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [
        [
          "Código",
          "Descripción",
          "Cantidad",
          "Precio unit.",
          "Subtotal",
        ],
      ],
      body,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      foot: [
        [
          {
            colSpan: 4,
            content: `Total (${monedaPdf})`,
            styles: { halign: "right", fontStyle: "bold" },
          },
          {
            content: formatPrecioMoneda(monedaPdf, totalGeneral),
            styles: { fontStyle: "bold" },
          },
        ],
      ],
      showFoot: "lastPage",
    });

    const finalY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY;
    y = (finalY ?? y + 40) + 12;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    const pieMoneda =
      monedaPdf === "UYU"
        ? "Precios en pesos uruguayos (UYU)."
        : "Precios en dólares americanos (USD).";
    doc.text(pieMoneda, 14, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text("Gracias por contactarnos.", 14, y);

    const safeName = numeroPresupuesto.replace(/[^\w-]+/g, "_");
    doc.save(`presupuesto_${safeName}.pdf`);

    persistirNumeroDespuesDePdf(numeroPresupuesto);
    setNumeroPresupuesto(siguienteNumeroPresupuesto());
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/admin"
              className="text-sm text-amber-500 hover:text-amber-400"
            >
              ← Panel
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Presupuestos
            </h1>
          </div>
        </div>

        <section className="mb-8 rounded-xl border border-gray-800 bg-gray-900/40 p-4 shadow-lg">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-500">
            Datos del cliente
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-gray-400">
              Nombre del cliente
              <input
                type="text"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                className={`mt-1 ${inputClase}`}
                placeholder="Nombre"
              />
            </label>
            <label className="block text-xs text-gray-400">
              Teléfono
              <input
                type="text"
                value={telefonoCliente}
                onChange={(e) => setTelefonoCliente(e.target.value)}
                className={`mt-1 ${inputClase}`}
                placeholder="Teléfono"
              />
            </label>
            <label className="block text-xs text-gray-400">
              Fecha
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={`mt-1 ${inputClase}`}
              />
            </label>
            <label className="block text-xs text-gray-400">
              Número de presupuesto
              <input
                type="text"
                readOnly
                value={numeroPresupuesto}
                className={`mt-1 ${inputClase} cursor-not-allowed opacity-90`}
              />
            </label>
          </div>
          <label className="mt-3 block text-xs text-gray-400">
            Notas / observaciones (opcional)
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className={`mt-1 ${inputClase} resize-y`}
              placeholder="Observaciones..."
            />
          </label>
        </section>

        <section className="relative mb-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-500">
              Buscar producto
            </h2>
            <button
              type="button"
              onClick={abrirModalNuevoProducto}
              className="inline-flex shrink-0 items-center rounded-lg border border-amber-500/50 bg-gray-900 px-3 py-1.5 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/10 hover:text-amber-300"
            >
              + Producto nuevo
            </button>
          </div>
          {mensajeExito ? (
            <div className="mb-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {mensajeExito}
            </div>
          ) : null}
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropdownAbierto(true);
            }}
            onFocus={() => setDropdownAbierto(true)}
            className={inputClase}
            placeholder="Escribí al menos 2 caracteres (nombre o código)…"
            autoComplete="off"
          />
          {dropdownAbierto && query.trim().length >= 2 ? (
            <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
              {buscando ? (
                <div className="px-3 py-4 text-sm text-gray-400">
                  Buscando…
                </div>
              ) : resultados.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-400">
                  Sin resultados
                </div>
              ) : (
                <ul className="divide-y divide-gray-800">
                  {resultados.map((p) => {
                    const pv = calcUnit(
                      p.precio_costo,
                      p.multiplicador_venta,
                    );
                    const pi = calcUnit(
                      p.precio_costo,
                      p.multiplicador_instalador,
                    );
                    const prov = nombreProveedor(p.proveedores);
                    const costo = p.precio_costo;
                    const costoTxt =
                      costo != null && Number.isFinite(costo)
                        ? formatoUsd(costo)
                        : "—";
                    return (
                      <li
                        key={p.id}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-800/80"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-white">
                            {p.nombre}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-400">
                            <span>Cód: {p.codigo ?? "—"}</span>
                            <span>|</span>
                            <span>Proveedor: {prov}</span>
                            <span>|</span>
                            <span className="text-gray-500">Costo: {costoTxt}</span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                            <span className="text-amber-500/90">
                              Venta: {formatoUsd(pv)}
                            </span>
                            <span className="text-amber-500/70">
                              Inst.: {formatoUsd(pi)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => agregarProducto(p)}
                          className="shrink-0 rounded-lg bg-amber-500 p-2 text-black transition hover:bg-amber-400"
                          aria-label={`Agregar ${p.nombre}`}
                        >
                          <Plus className="size-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </section>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-500">
            Detalle del presupuesto
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={limpiarTodo}
              className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-300 hover:border-amber-500 hover:text-amber-400"
            >
              Limpiar todo
            </button>
            <button
              type="button"
              onClick={() => void generarPdf()}
              disabled={lineas.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileText className="size-4" />
              Generar PDF
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Moneda del presupuesto
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white">USD</span>
            <button
              type="button"
              role="switch"
              aria-checked={monedaPresupuesto === "UYU"}
              aria-label="Moneda: USD o UYU"
              onClick={() =>
                setMonedaPresupuesto((m) => (m === "USD" ? "UYU" : "USD"))
              }
              className="relative h-7 w-14 shrink-0 rounded-full bg-gray-800 p-0.5 outline-none ring-amber-500/30 focus-visible:ring-2"
            >
              <span
                className={`pointer-events-none absolute top-0.5 left-0.5 block h-6 w-6 rounded-full bg-amber-500 shadow-sm transition-all duration-300 ease-out ${
                  monedaPresupuesto === "UYU"
                    ? "translate-x-[1.75rem]"
                    : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-xs font-medium text-white">UYU</span>
          </div>
          <div
            className={`transition-all duration-300 ease-out ${
              monedaPresupuesto === "UYU"
                ? "mt-3 max-h-24 opacity-100"
                : "pointer-events-none mt-0 max-h-0 opacity-0"
            } overflow-hidden`}
          >
            <label className="block max-w-xs text-sm text-gray-300">
              Cotización del dólar: $
              <input
                type="number"
                min={0}
                step={0.01}
                value={cotizacion}
                onChange={(e) => setCotizacion(e.target.value)}
                className={`mt-1 block w-full ${inputClase}`}
                placeholder="Ej. 39,65"
              />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">P. unitario</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {lineas.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Agregá productos desde el buscador.
                  </td>
                </tr>
              ) : (
                lineas.map((l) => {
                  const puUsd = precioUnitarioEfectivo(l);
                  const sub =
                    puUsd * l.cantidad * factorMoneda;
                  const inputUnitValue = puUsd * factorMoneda;
                  return (
                    <tr
                      key={l.productoId}
                      className="border-b border-gray-800/80 hover:bg-gray-900/30"
                    >
                      <td className="px-4 py-3 font-medium">{l.nombre}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {l.codigo ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className={selectClase}
                          value={l.tipoPrecio}
                          onChange={(e) =>
                            setLineas((prev) =>
                              prev.map((row) =>
                                row.productoId === l.productoId
                                  ? {
                                      ...row,
                                      tipoPrecio:
                                        e.target.value === "instalador"
                                          ? "instalador"
                                          : "venta",
                                      precioUnitarioOverride: null,
                                    }
                                  : row,
                              ),
                            )
                          }
                        >
                          <option value="venta">Venta</option>
                          <option value="instalador">Instalador</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={l.cantidad}
                          onChange={(e) => {
                            const n = Number.parseInt(
                              e.target.value,
                              10,
                            );
                            const cant =
                              Number.isFinite(n) && n >= 1 ? n : 1;
                            setLineas((prev) =>
                              prev.map((row) =>
                                row.productoId === l.productoId
                                  ? { ...row, cantidad: cant }
                                  : row,
                              ),
                            );
                          }}
                          className={`w-20 ${inputClase}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={inputUnitValue}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setLineas((prev) =>
                              prev.map((row) => {
                                if (row.productoId !== l.productoId) return row;
                                if (raw.trim() === "") {
                                  return {
                                    ...row,
                                    precioUnitarioOverride: null,
                                  };
                                }
                                const n = Number.parseFloat(raw);
                                if (!Number.isFinite(n) || n < 0) return row;
                                if (monedaPresupuesto === "UYU") {
                                  if (factorMoneda <= 0) return row;
                                  return {
                                    ...row,
                                    precioUnitarioOverride: n / factorMoneda,
                                  };
                                }
                                return {
                                  ...row,
                                  precioUnitarioOverride: n,
                                };
                              }),
                            );
                          }}
                          onBlur={(e) => {
                            if (e.target.value.trim() === "") {
                              setLineas((prev) =>
                                prev.map((row) =>
                                  row.productoId === l.productoId
                                    ? {
                                        ...row,
                                        precioUnitarioOverride: null,
                                      }
                                    : row,
                                ),
                              );
                            }
                          }}
                          className="w-full min-w-[6rem] rounded border-0 bg-gray-800 px-2 py-1.5 text-sm tabular-nums text-amber-400 outline-none ring-0 focus:border-0 focus:ring-0"
                        />
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium">
                        {formatPrecioMoneda(monedaPresupuesto, sub)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => quitarLinea(l.productoId)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-red-500/20 hover:text-red-400"
                          aria-label="Quitar"
                        >
                          <X className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {lineas.length > 0 ? (
          <div className="mt-6 flex justify-end border-t border-gray-800 pt-4">
            <p className="text-2xl font-bold tracking-tight text-white">
              Total:{" "}
              <span className="text-amber-500">
                {formatPrecioMoneda(monedaPresupuesto, totalGeneral)}
              </span>{" "}
              <span className="text-base font-normal text-gray-500">
                {monedaPresupuesto}
              </span>
            </p>
          </div>
        ) : null}

        {dropdownAbierto && query.trim().length >= 2 ? (
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Cerrar buscador"
            onClick={() => setDropdownAbierto(false)}
          />
        ) : null}

        {modalNuevoAbierto ? (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            role="presentation"
            onClick={cerrarModalNuevoProducto}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-nuevo-producto-titulo"
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-700 bg-gray-950/95 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2
                  id="modal-nuevo-producto-titulo"
                  className="text-lg font-bold text-white"
                >
                  Nuevo producto
                </h2>
                <button
                  type="button"
                  onClick={cerrarModalNuevoProducto}
                  disabled={guardandoNuevoProducto}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white disabled:opacity-50"
                  aria-label="Cerrar"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={onSubmitNuevoProducto} className="space-y-3">
                <label className="block text-xs text-gray-400">
                  Nombre <span className="text-red-400">*</span>
                  <input
                    required
                    value={nuevoProductoForm.nombre}
                    onChange={(e) =>
                      setNuevoProductoForm((s) => ({
                        ...s,
                        nombre: e.target.value,
                      }))
                    }
                    className={`mt-1 ${inputClase}`}
                    placeholder="Nombre del producto"
                  />
                </label>
                <label className="block text-xs text-gray-400">
                  Código <span className="text-red-400">*</span>
                  <input
                    required
                    value={nuevoProductoForm.codigo}
                    onChange={(e) =>
                      setNuevoProductoForm((s) => ({
                        ...s,
                        codigo: e.target.value,
                      }))
                    }
                    className={`mt-1 ${inputClase}`}
                    placeholder="Código"
                  />
                </label>
                <label className="block text-xs text-gray-400">
                  Precio costo
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={nuevoProductoForm.precio_costo}
                    onChange={(e) =>
                      setNuevoProductoForm((s) => ({
                        ...s,
                        precio_costo: e.target.value,
                      }))
                    }
                    className={`mt-1 ${inputClase}`}
                    placeholder="0"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-gray-400">
                    Multiplicador venta
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={nuevoProductoForm.multiplicador_venta}
                      onChange={(e) =>
                        setNuevoProductoForm((s) => ({
                          ...s,
                          multiplicador_venta: e.target.value,
                        }))
                      }
                      className={`mt-1 ${inputClase}`}
                    />
                  </label>
                  <label className="block text-xs text-gray-400">
                    Multiplicador instalador
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={nuevoProductoForm.multiplicador_instalador}
                      onChange={(e) =>
                        setNuevoProductoForm((s) => ({
                          ...s,
                          multiplicador_instalador: e.target.value,
                        }))
                      }
                      className={`mt-1 ${inputClase}`}
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-gray-400">
                    Categoría
                    <select
                      value={nuevoProductoForm.categoria_id}
                      onChange={(e) =>
                        setNuevoProductoForm((s) => ({
                          ...s,
                          categoria_id: e.target.value,
                        }))
                      }
                      className={`mt-1 w-full ${selectClase}`}
                    >
                      <option value="">—</option>
                      {categoriasOpts.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs text-gray-400">
                    Marca
                    <select
                      value={nuevoProductoForm.marca_id}
                      onChange={(e) =>
                        setNuevoProductoForm((s) => ({
                          ...s,
                          marca_id: e.target.value,
                        }))
                      }
                      className={`mt-1 w-full ${selectClase}`}
                    >
                      <option value="">—</option>
                      {marcasOpts.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block text-xs text-gray-400">
                  Proveedor
                  <select
                    value={nuevoProductoForm.proveedor_id}
                    onChange={(e) =>
                      setNuevoProductoForm((s) => ({
                        ...s,
                        proveedor_id: e.target.value,
                      }))
                    }
                    className={`mt-1 w-full ${selectClase}`}
                  >
                    <option value="">—</option>
                    {proveedoresOpts.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-gray-400">
                  Moneda
                  <select
                    value={nuevoProductoForm.moneda}
                    onChange={(e) =>
                      setNuevoProductoForm((s) => ({
                        ...s,
                        moneda: e.target.value as "USD" | "UYU",
                      }))
                    }
                    className={`mt-1 w-full ${selectClase}`}
                  >
                    <option value="USD">USD</option>
                    <option value="UYU">UYU</option>
                  </select>
                </label>

                {errorNuevoProducto ? (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {errorNuevoProducto}
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={cerrarModalNuevoProducto}
                    disabled={guardandoNuevoProducto}
                    className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-300 hover:border-gray-500 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoNuevoProducto}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
                  >
                    {guardandoNuevoProducto ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
