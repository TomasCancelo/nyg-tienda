"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Opcion = { id: number; nombre: string };

type FormState = {
  nombre: string;
  descripcion: string;
  moneda: "USD" | "UYU";
  precio_costo: string;
  multiplicador_venta: string;
  multiplicador_instalador: string;
  imagen_url: string;
  disponible: boolean;
  destacado: boolean;
  categoria_id: string;
  marca_id: string;
  proveedor_id: string;
  codigo: string;
};

const initialState: FormState = {
  nombre: "",
  descripcion: "",
  moneda: "USD",
  precio_costo: "",
  multiplicador_venta: "",
  multiplicador_instalador: "",
  imagen_url: "",
  disponible: true,
  destacado: false,
  categoria_id: "",
  marca_id: "",
  proveedor_id: "",
  codigo: "",
};

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [form, setForm] = useState<FormState>(initialState);
  const [categorias, setCategorias] = useState<Opcion[]>([]);
  const [marcas, setMarcas] = useState<Opcion[]>([]);
  const [proveedores, setProveedores] = useState<Opcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!Number.isFinite(productId)) {
        setError("ID inválido");
        setLoading(false);
        return;
      }

      const [pRes, c, m, p] = await Promise.all([
        supabase
          .from("productos")
          .select(
            "nombre, descripcion, moneda, precio_costo, multiplicador_venta, multiplicador_instalador, imagen_url, disponible, destacado, categoria_id, marca_id, proveedor_id, codigo",
          )
          .eq("id", productId)
          .maybeSingle(),
        supabase.from("categorias").select("id, nombre").order("nombre"),
        supabase.from("marcas").select("id, nombre").order("nombre"),
        supabase.from("proveedores").select("id, nombre").order("nombre"),
      ]);

      if (pRes.error || !pRes.data) {
        setError(pRes.error?.message ?? "Producto no encontrado");
      } else {
        const d = pRes.data;
        setForm({
          nombre: d.nombre ?? "",
          descripcion: d.descripcion ?? "",
          moneda: d.moneda === "UYU" ? "UYU" : "USD",
          precio_costo: d.precio_costo != null ? String(d.precio_costo) : "",
          multiplicador_venta:
            d.multiplicador_venta != null ? String(d.multiplicador_venta) : "",
          multiplicador_instalador:
            d.multiplicador_instalador != null
              ? String(d.multiplicador_instalador)
              : "",
          imagen_url: d.imagen_url ?? "",
          disponible: Boolean(d.disponible),
          destacado: Boolean(d.destacado),
          categoria_id: d.categoria_id != null ? String(d.categoria_id) : "",
          marca_id: d.marca_id != null ? String(d.marca_id) : "",
          proveedor_id: d.proveedor_id != null ? String(d.proveedor_id) : "",
          codigo: d.codigo ?? "",
        });
      }

      if (!c.error) setCategorias((c.data ?? []) as Opcion[]);
      if (!m.error) setMarcas((m.data ?? []) as Opcion[]);
      if (!p.error) setProveedores((p.data ?? []) as Opcion[]);
      setLoading(false);
    };
    load();
  }, [productId, supabase]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!Number.isFinite(productId)) return;

    setSaving(true);
    setError("");

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      moneda: form.moneda,
      precio_costo: form.precio_costo ? Number(form.precio_costo) : null,
      multiplicador_venta: form.multiplicador_venta
        ? Number(form.multiplicador_venta)
        : null,
      multiplicador_instalador: form.multiplicador_instalador
        ? Number(form.multiplicador_instalador)
        : null,
      imagen_url: form.imagen_url.trim() || null,
      disponible: form.disponible,
      destacado: form.destacado,
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      marca_id: form.marca_id ? Number(form.marca_id) : null,
      proveedor_id: form.proveedor_id ? Number(form.proveedor_id) : null,
      codigo: form.codigo.trim() || null,
    };

    const { error: updateError } = await supabase
      .from("productos")
      .update(payload)
      .eq("id", productId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Editar producto</h1>

        {loading ? (
          <div className="rounded-xl border border-gray-800 bg-zinc-900 p-5 text-gray-400">
            Cargando...
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-xl border border-gray-800 bg-zinc-900 p-5"
          >
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
              placeholder="Nombre"
              className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5"
            />
            <textarea
              value={form.descripcion}
              onChange={(e) =>
                setForm((s) => ({ ...s, descripcion: e.target.value }))
              }
              placeholder="Descripción"
              className="min-h-28 w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.moneda}
                onChange={(e) =>
                  setForm((s) => ({ ...s, moneda: e.target.value as "USD" | "UYU" }))
                }
                className="rounded-lg border border-gray-700 bg-black px-3 py-2.5"
              >
                <option value="USD">USD</option>
                <option value="UYU">UYU</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio_costo}
                onChange={(e) =>
                  setForm((s) => ({ ...s, precio_costo: e.target.value }))
                }
                placeholder="Precio costo"
                className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.multiplicador_venta}
                onChange={(e) =>
                  setForm((s) => ({ ...s, multiplicador_venta: e.target.value }))
                }
                placeholder="Multiplicador venta"
                className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.multiplicador_instalador}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    multiplicador_instalador: e.target.value,
                  }))
                }
                placeholder="Multiplicador instalador"
                className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5"
              />
            </div>
            <input
              value={form.imagen_url}
              onChange={(e) =>
                setForm((s) => ({ ...s, imagen_url: e.target.value }))
              }
              placeholder="URL de imagen"
              className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5"
            />
            <input
              value={form.codigo}
              onChange={(e) => setForm((s) => ({ ...s, codigo: e.target.value }))}
              placeholder="Código"
              className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={form.categoria_id}
                onChange={(e) =>
                  setForm((s) => ({ ...s, categoria_id: e.target.value }))
                }
                className="rounded-lg border border-gray-700 bg-black px-3 py-2.5"
              >
                <option value="">Categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <select
                value={form.marca_id}
                onChange={(e) =>
                  setForm((s) => ({ ...s, marca_id: e.target.value }))
                }
                className="rounded-lg border border-gray-700 bg-black px-3 py-2.5"
              >
                <option value="">Marca</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              <select
                value={form.proveedor_id}
                onChange={(e) =>
                  setForm((s) => ({ ...s, proveedor_id: e.target.value }))
                }
                className="rounded-lg border border-gray-700 bg-black px-3 py-2.5"
              >
                <option value="">Proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.disponible}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, disponible: e.target.checked }))
                  }
                />
                Disponible
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.destacado}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, destacado: e.target.checked }))
                  }
                />
                Destacado
              </label>
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Link
                href="/admin"
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
