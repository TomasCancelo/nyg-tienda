"use client";

import { createBrowserClient } from "@supabase/ssr";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type RelNombre = { nombre: string } | { nombre: string }[] | null | undefined;

type ProductoAdmin = {
  id: number;
  nombre: string;
  codigo: string | null;
  precio: number;
  imagen_url: string | null;
  disponible: boolean | null;
  destacado: boolean | null;
  categoria_id: number | null;
  marca_id: number | null;
  proveedor_id: number | null;
  categorias: RelNombre;
  marcas: RelNombre;
  proveedores: RelNombre;
};

type OpcionLista = { id: number; nombre: string };

function relNombre(rel: RelNombre): string {
  if (rel == null) return "-";
  if (Array.isArray(rel)) return rel[0]?.nombre ?? "-";
  return rel.nombre ?? "-";
}

function formatUYU(price: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(price);
}

const normalizar = (str: string) => str.toLowerCase().replace(/[-\s]/g, "");

const selectClase =
  "w-full min-w-0 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50";

const inputClase =
  "w-full min-w-[6rem] rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-amber-500/50";

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
  const [categoriasOpts, setCategoriasOpts] = useState<OpcionLista[]>([]);
  const [marcasOpts, setMarcasOpts] = useState<OpcionLista[]>([]);
  const [proveedoresOpts, setProveedoresOpts] = useState<OpcionLista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterMarca, setFilterMarca] = useState("");
  const [filterProveedor, setFilterProveedor] = useState("");
  const [filterDisponible, setFilterDisponible] = useState<
    "todos" | "disponibles" | "sin_stock"
  >("todos");
  const [filterDestacado, setFilterDestacado] = useState<
    "todos" | "destacados" | "no_destacados"
  >("todos");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const [prodRes, catRes, marRes, provRes] = await Promise.all([
      supabase
        .from("productos")
        .select(
          "*, categorias(nombre), marcas(nombre), proveedores(nombre)",
        )
        .order("id", { ascending: true }),
      supabase.from("categorias").select("id, nombre").order("nombre"),
      supabase.from("marcas").select("id, nombre").order("nombre"),
      supabase.from("proveedores").select("id, nombre").order("nombre"),
    ]);

    if (prodRes.error) {
      setError(prodRes.error.message);
      setProductos([]);
    } else {
      setProductos((prodRes.data ?? []) as ProductoAdmin[]);
    }
    if (catRes.error) setCategoriasOpts([]);
    else setCategoriasOpts((catRes.data ?? []) as OpcionLista[]);
    if (marRes.error) setMarcasOpts([]);
    else setMarcasOpts((marRes.data ?? []) as OpcionLista[]);
    if (provRes.error) setProveedoresOpts([]);
    else setProveedoresOpts((provRes.data ?? []) as OpcionLista[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const limpiarFiltros = () => {
    setSearch("");
    setFilterCategoria("");
    setFilterMarca("");
    setFilterProveedor("");
    setFilterDisponible("todos");
    setFilterDestacado("todos");
    setPrecioMin("");
    setPrecioMax("");
  };

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
    const minN =
      precioMin.trim() === "" ? null : Number.parseFloat(precioMin.replace(",", "."));
    const maxN =
      precioMax.trim() === "" ? null : Number.parseFloat(precioMax.replace(",", "."));

    return productos.filter((p) => {
      if (q) {
        const nombre = p.nombre.toLowerCase();
        const codigo = (p.codigo ?? "").toLowerCase();
        const codigoNormalizado = normalizar(p.codigo ?? "");
        const matchSearch =
          nombre.includes(q) ||
          codigo.includes(q) ||
          codigoNormalizado.includes(qNormalizado);
        if (!matchSearch) return false;
      }

      if (filterCategoria !== "") {
        if (p.categoria_id !== Number(filterCategoria)) return false;
      }

      if (filterMarca !== "") {
        if (p.marca_id !== Number(filterMarca)) return false;
      }

      if (filterProveedor !== "") {
        if (p.proveedor_id !== Number(filterProveedor)) return false;
      }

      if (filterDisponible === "disponibles" && !p.disponible) return false;
      if (filterDisponible === "sin_stock" && Boolean(p.disponible)) return false;

      if (filterDestacado === "destacados" && !p.destacado) return false;
      if (filterDestacado === "no_destacados" && Boolean(p.destacado)) return false;

      if (minN != null && !Number.isNaN(minN) && p.precio < minN) return false;
      if (maxN != null && !Number.isNaN(maxN) && p.precio > maxN) return false;

      return true;
    });
  }, [
    productos,
    search,
    filterCategoria,
    filterMarca,
    filterProveedor,
    filterDisponible,
    filterDestacado,
    precioMin,
    precioMax,
  ]);

  const colSpan = 10;

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Panel de administración
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/productos/nuevo"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
            >
              Agregar producto
            </Link>
            <Link
              href="/admin/proveedores"
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-500 hover:text-amber-400"
            >
              Proveedores
            </Link>
            <Link
              href="/admin/marcas"
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-500 hover:text-amber-400"
            >
              Marcas
            </Link>
            <Link
              href="/admin/categorias"
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-500 hover:text-amber-400"
            >
              Categorías
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

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-800 bg-zinc-950 px-3 py-2.5 md:min-w-[200px]">
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

          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className={`${selectClase} md:w-44`}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categoriasOpts.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre}
              </option>
            ))}
          </select>

          <select
            value={filterMarca}
            onChange={(e) => setFilterMarca(e.target.value)}
            className={`${selectClase} md:w-40`}
            aria-label="Filtrar por marca"
          >
            <option value="">Todas las marcas</option>
            {marcasOpts.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.nombre}
              </option>
            ))}
          </select>

          <select
            value={filterProveedor}
            onChange={(e) => setFilterProveedor(e.target.value)}
            className={`${selectClase} md:w-44`}
            aria-label="Filtrar por proveedor"
          >
            <option value="">Todos los proveedores</option>
            {proveedoresOpts.map((pr) => (
              <option key={pr.id} value={String(pr.id)}>
                {pr.nombre}
              </option>
            ))}
          </select>

          <select
            value={filterDisponible}
            onChange={(e) =>
              setFilterDisponible(
                e.target.value as "todos" | "disponibles" | "sin_stock",
              )
            }
            className={`${selectClase} md:w-44`}
            aria-label="Filtrar por disponibilidad"
          >
            <option value="todos">Disponible: Todos</option>
            <option value="disponibles">Solo disponibles</option>
            <option value="sin_stock">Sin stock</option>
          </select>

          <select
            value={filterDestacado}
            onChange={(e) =>
              setFilterDestacado(
                e.target.value as "todos" | "destacados" | "no_destacados",
              )
            }
            className={`${selectClase} md:w-48`}
            aria-label="Filtrar por destacado"
          >
            <option value="todos">Destacado: Todos</option>
            <option value="destacados">Solo destacados</option>
            <option value="no_destacados">No destacados</option>
          </select>

          <input
            type="number"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            placeholder="Precio min"
            className={`${inputClase} md:w-32`}
            min={0}
            step="any"
          />
          <input
            type="number"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            placeholder="Precio max"
            className={`${inputClase} md:w-32`}
            min={0}
            step="any"
          />

          <button
            type="button"
            onClick={limpiarFiltros}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-white transition hover:border-amber-500/50 hover:text-amber-400 md:self-end"
          >
            Limpiar filtros
          </button>
        </div>

        <p className="mb-2 text-sm text-gray-400">
          {loading
            ? "…"
            : `${filteredProductos.length} productos encontrados`}
        </p>

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
                  <th className="px-3 py-3">Marca</th>
                  <th className="px-3 py-3">Proveedor</th>
                  <th className="px-3 py-3">Disponible</th>
                  <th className="px-3 py-3">Destacado</th>
                  <th className="px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td
                      className="px-3 py-8 text-center text-gray-400"
                      colSpan={colSpan}
                    >
                      Cargando productos...
                    </td>
                  </tr>
                ) : productos.length === 0 ? (
                  <tr>
                    <td
                      className="px-3 py-8 text-center text-gray-400"
                      colSpan={colSpan}
                    >
                      No hay productos cargados.
                    </td>
                  </tr>
                ) : filteredProductos.length === 0 ? (
                  <tr>
                    <td
                      className="px-3 py-8 text-center text-gray-400"
                      colSpan={colSpan}
                    >
                      Ningún producto coincide con los filtros.
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
                      <td className="px-3 py-3 font-medium text-white">
                        {p.nombre}
                      </td>
                      <td className="px-3 py-3 text-gray-300">
                        {p.codigo ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-amber-400">
                        {formatUYU(p.precio)}
                      </td>
                      <td className="px-3 py-3 text-gray-300">
                        {relNombre(p.categorias) === "-"
                          ? "Sin categoría"
                          : relNombre(p.categorias)}
                      </td>
                      <td className="px-3 py-3 text-gray-300">
                        {relNombre(p.marcas)}
                      </td>
                      <td className="px-3 py-3 text-gray-300">
                        {relNombre(p.proveedores)}
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
