"use client";

import { supabase } from "@/lib/supabase";
import { ExternalLink, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const PRESUPUESTO_PREFILL_KEY = "nyg_presupuesto_desde_consulta";

type EstadoConsulta = "pendiente" | "en proceso" | "completado" | "cancelado";

type ProductoConsulta = {
  id: number;
  nombre: string;
  codigo: string;
  cantidad: number;
};

type ConsultaRow = {
  id: string | number;
  created_at: string;
  nombre: string;
  telefono: string;
  mensaje: string | null;
  estado: string;
  productos: string | unknown;
};

function parseProductos(raw: string | unknown): ProductoConsulta[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (p): p is ProductoConsulta =>
          p != null &&
          typeof p === "object" &&
          typeof (p as ProductoConsulta).id === "number" &&
          typeof (p as ProductoConsulta).nombre === "string",
      )
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        codigo: typeof p.codigo === "string" ? p.codigo : "Sin código",
        cantidad:
          typeof p.cantidad === "number" && p.cantidad > 0
            ? Math.floor(p.cantidad)
            : 1,
      }));
  } catch {
    return [];
  }
}

function telefonoParaWa(tel: string): string {
  const d = tel.replace(/\D/g, "");
  if (d.length === 9 && d.startsWith("0")) return `598${d.slice(1)}`;
  if (d.length === 8) return `598${d}`;
  return d;
}

function badgeEstado(estado: string): string {
  switch (estado) {
    case "pendiente":
      return "bg-amber-500/20 text-amber-300 ring-amber-500/40";
    case "en proceso":
      return "bg-blue-500/20 text-blue-300 ring-blue-500/40";
    case "completado":
      return "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40";
    case "cancelado":
      return "bg-red-500/20 text-red-300 ring-red-500/40";
    default:
      return "bg-zinc-500/20 text-zinc-300 ring-zinc-500/40";
  }
}

const selectClase =
  "rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-500/50";

export default function AdminConsultasPage() {
  const router = useRouter();
  const [consultas, setConsultas] = useState<ConsultaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [detalleId, setDetalleId] = useState<string | number | null>(null);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  const fetchConsultas = useCallback(async () => {
    setLoading(true);
    setError("");
    let q = supabase
      .from("consultas")
      .select("*")
      .order("created_at", { ascending: false });

    if (filtroEstado) {
      q = q.eq("estado", filtroEstado);
    }

    const { data, error: err } = await q;
    if (err) {
      setError(err.message);
      setConsultas([]);
    } else {
      setConsultas((data ?? []) as ConsultaRow[]);
    }
    setLoading(false);
  }, [filtroEstado]);

  useEffect(() => {
    void fetchConsultas();
  }, [fetchConsultas]);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const cambiarEstado = async (id: string | number, estado: EstadoConsulta) => {
    setUpdatingId(id);
    const { error: upErr } = await supabase
      .from("consultas")
      .update({ estado })
      .eq("id", id);
    setUpdatingId(null);
    if (upErr) {
      alert(upErr.message);
      return;
    }
    setConsultas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado } : c)),
    );
  };

  const consultaDetalle = useMemo(
    () => consultas.find((c) => String(c.id) === String(detalleId)) ?? null,
    [consultas, detalleId],
  );

  const productosDetalle = useMemo(
    () => (consultaDetalle ? parseProductos(consultaDetalle.productos) : []),
    [consultaDetalle],
  );

  const abrirPresupuestoConProductos = () => {
    if (!productosDetalle.length) return;
    const payload = productosDetalle.map((p) => ({
      id: p.id,
      cantidad: p.cantidad,
    }));
    sessionStorage.setItem(PRESUPUESTO_PREFILL_KEY, JSON.stringify(payload));
    router.push("/admin/presupuesto");
    setDetalleId(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Consultas</h1>
            <p className="mt-1 text-sm text-gray-400">
              Consultas enviadas desde la tienda web
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-500 hover:text-amber-400"
            >
              Volver al panel
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-500 hover:text-amber-400"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-400">
            Estado
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={`${selectClase} ml-2`}
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en proceso">En proceso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </label>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-gray-800 bg-zinc-950">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 text-sm">
              <thead className="bg-black/60 text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3">Teléfono</th>
                  <th className="px-3 py-3">Productos</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-gray-400" colSpan={6}>
                      Cargando…
                    </td>
                  </tr>
                ) : consultas.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-gray-400" colSpan={6}>
                      No hay consultas.
                    </td>
                  </tr>
                ) : (
                  consultas.map((c) => {
                    const lista = parseProductos(c.productos);
                    return (
                      <tr key={c.id} className="hover:bg-zinc-900/70">
                        <td className="whitespace-nowrap px-3 py-3 text-gray-300">
                          {new Date(c.created_at).toLocaleString("es-UY")}
                        </td>
                        <td className="px-3 py-3 font-medium text-white">{c.nombre}</td>
                        <td className="px-3 py-3 text-gray-300">{c.telefono}</td>
                        <td className="px-3 py-3 text-gray-300">{lista.length}</td>
                        <td className="px-3 py-3">
                          <select
                            value={c.estado}
                            disabled={updatingId === c.id}
                            onChange={(e) =>
                              cambiarEstado(c.id, e.target.value as EstadoConsulta)
                            }
                            className={`${selectClase} max-w-[11rem]`}
                            aria-label="Cambiar estado"
                          >
                            <option value="pendiente">pendiente</option>
                            <option value="en proceso">en proceso</option>
                            <option value="completado">completado</option>
                            <option value="cancelado">cancelado</option>
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => setDetalleId(c.id)}
                            className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/10"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {consultaDetalle ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setDetalleId(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-700 bg-zinc-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Detalle de consulta</h2>
              <button
                type="button"
                onClick={() => setDetalleId(null)}
                className="rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-zinc-800 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Fecha</dt>
                <dd className="text-gray-200">
                  {new Date(consultaDetalle.created_at).toLocaleString("es-UY")}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Cliente</dt>
                <dd className="text-gray-200">{consultaDetalle.nombre}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Teléfono</dt>
                <dd className="text-gray-200">{consultaDetalle.telefono}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ${badgeEstado(consultaDetalle.estado)}`}
                  >
                    {consultaDetalle.estado}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-amber-500/90">Productos</h3>
              <ul className="mt-2 space-y-2 text-sm text-gray-300">
                {productosDetalle.length === 0 ? (
                  <li className="text-gray-500">Sin datos de productos.</li>
                ) : (
                  productosDetalle.map((p, idx) => (
                    <li key={`${p.id}-${idx}`} className="border-b border-zinc-800 pb-2">
                      <span className="font-medium text-white">{p.nombre}</span>
                      <span className="text-gray-500"> — Cód: {p.codigo}</span>
                      <span className="block text-gray-400">Cantidad: {p.cantidad}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-amber-500/90">
                Mensaje adicional
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-300">
                {(consultaDetalle.mensaje ?? "").trim() || "—"}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={abrirPresupuestoConProductos}
                disabled={productosDetalle.length === 0}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ExternalLink className="h-4 w-4" />
                Armar presupuesto
              </button>
              <a
                href={`https://wa.me/${telefonoParaWa(consultaDetalle.telefono)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <MessageCircle className="h-4 w-4" />
                Contactar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
