"use client";

import { createBrowserClient } from "@supabase/ssr";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type ProductoAdmin = {
  id: number;
  nombre: string;
  codigo: string | null;
  precio: number;
  imagen_url: string | null;
  disponible: boolean | null;
  destacado: boolean | null;
  categoria_id: number | null;
  categorias: { nombre: string }[] | null;
};

function formatUYU(price: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(price);
}

const normalizar = (str: string) => str.toLowerCase().replace(/[-\s]/g, "");

export default function AdminPage() {
  const router = useRouter();
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("productos")
      .select(
        "id, nombre, codigo, precio, imagen_url, disponible, destacado, categoria_id, categorias ( nombre )",
      )
      .order("id", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setProductos([]);
    } else {
      setProductos((data ?? []) as ProductoAdmin[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const updateToggle = async (
    id: number,
    key: "disponible" | "destacado",
    value: boolean,
  ) => {
    setUpdatingId(id);
    const { error: updateError } = await supabase
      .from("productos")
      .update({ [key]: value })
      .eq("id", id);

    if (updateError) {
      alert("No se pudo actualizar el producto.");
    } else {
      setProductos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)),
      );
    }
    setUpdatingId(null);
  };

  const deleteProducto = async (id: number) => {
    const ok = window.confirm("¿Seguro que querés eliminar este producto?");
    if (!ok) return;

    setUpdatingId(id);
    const { error: deleteError } = await supabase
      .from("productos")
      .delete()
      .eq("id", id);

    if (deleteError) {
      alert("No se pudo eliminar el producto.");
    } else {
      setProductos((prev) => prev.filter((p) => p.id !== id));
    }
    setUpdatingId(null);
  };

  const filteredProductos = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qNormalizado = normalizar(search.trim());
    if (!q) return productos;
    return productos.filter((p) => {
      const nombre = p.nombre.toLowerCase();
      const codigo = (p.codigo ?? "").toLowerCase();
      const codigoNormalizado = normalizar(p.codigo ?? "");
      return (
        nombre.includes(q) ||
        codigo.includes(q) ||
        codigoNormalizado.includes(qNormalizado)
      );
    });
  }, [productos, search]);

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Panel de administración
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/productos/nuevo"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
            >
              Agregar producto
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

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-800 bg-zinc-950 px-3 py-2.5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="rounded p-1 text-gray-400 transition hover:bg-zinc-800 hover:text-white"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-800 bg-zinc-950">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 text-sm">
              <thead className="bg-black/60 text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-3 py-3">Imagen</th>
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3">Código</th>
                  <th className="px-3 py-3">Precio</th>
                  <th className="px-3 py-3">Categoría</th>
                  <th className="px-3 py-3">Disponible</th>
                  <th className="px-3 py-3">Destacado</th>
                  <th className="px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-gray-400" colSpan={8}>
                      Cargando productos...
                    </td>
                  </tr>
                ) : filteredProductos.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-gray-400" colSpan={8}>
                      No hay productos cargados.
                    </td>
                  </tr>
                ) : (
                  filteredProductos.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-900/70">
                      <td className="px-3 py-3">
                        <div className="h-10 w-10 overflow-hidden rounded border border-gray-800 bg-black">
                          {p.imagen_url ? (
                            <img
                              src={p.imagen_url}
                              alt={p.nombre}
                              className="h-full w-full object-contain"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-white">{p.nombre}</td>
                      <td className="px-3 py-3 text-gray-300">{p.codigo ?? "-"}</td>
                      <td className="px-3 py-3 text-amber-400">{formatUYU(p.precio)}</td>
                      <td className="px-3 py-3 text-gray-300">
                        {p.categorias?.[0]?.nombre ?? "Sin categoría"}
                      </td>
                      <td className="px-3 py-3">
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(p.disponible)}
                            disabled={updatingId === p.id}
                            onChange={(e) =>
                              updateToggle(p.id, "disponible", e.target.checked)
                            }
                          />
                          <span className="text-xs text-gray-300">
                            {p.disponible ? "Sí" : "No"}
                          </span>
                        </label>
                      </td>
                      <td className="px-3 py-3">
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(p.destacado)}
                            disabled={updatingId === p.id}
                            onChange={(e) =>
                              updateToggle(p.id, "destacado", e.target.checked)
                            }
                          />
                          <span className="text-xs text-gray-300">
                            {p.destacado ? "Sí" : "No"}
                          </span>
                        </label>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/productos/${p.id}/editar`}
                            className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/10"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            disabled={updatingId === p.id}
                            onClick={() => deleteProducto(p.id)}
                            className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
