"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type CategoriaRow = {
  id: number;
  nombre: string;
  parent_id: number | null;
};

type MarcaRow = {
  id: number;
  nombre: string;
};

type ProductoRow = {
  id: number;
  nombre: string;
  codigo: string | null;
  precio_costo: number | null;
  multiplicador_venta: number | null;
  imagen_url: string | null;
  disponible: boolean;
  categoria_id: number | null;
  marca_id: number | null;
  marcas: { nombre: string } | null;
};

function parseCommaIds(raw: string | null): number[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
}

function formatIds(ids: number[]): string {
  return [...new Set(ids)].sort((a, b) => a - b).join(",");
}

function buildChildrenByParent(cats: CategoriaRow[]): Map<number, number[]> {
  const m = new Map<number, number[]>();
  for (const c of cats) {
    if (c.parent_id == null) continue;
    const list = m.get(c.parent_id) ?? [];
    list.push(c.id);
    m.set(c.parent_id, list);
  }
  return m;
}

/** Incluye el id raíz y todos los descendientes (para filtrar por categoría padre). */
function collectSubtreeIds(
  rootId: number,
  childrenByParent: Map<number, number[]>,
): number[] {
  const out: number[] = [];
  const queue = [rootId];
  while (queue.length) {
    const id = queue.shift()!;
    out.push(id);
    const kids = childrenByParent.get(id) ?? [];
    queue.push(...kids);
  }
  return out;
}

function resolveCategoryFilterIds(
  selected: number[],
  allCats: CategoriaRow[],
): number[] {
  if (!selected.length || !allCats.length) return selected;
  const childrenByParent = buildChildrenByParent(allCats);
  const resolved = new Set<number>();
  for (const id of selected) {
    for (const x of collectSubtreeIds(id, childrenByParent)) {
      resolved.add(x);
    }
  }
  return [...resolved];
}

function FilterCheckbox({
  checked,
  onChange,
  id,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-gray-700"
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-gray-300 transition peer-checked:border-amber-500 peer-checked:bg-amber-500 peer-checked:[&>span]:opacity-100"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white opacity-0 transition" />
      </span>
      <span>{children}</span>
    </label>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden bg-white">
      <div className="aspect-square w-full animate-pulse bg-gray-100" />
      <div className="flex flex-1 flex-col gap-2 px-1 py-3">
        <div className="h-2 w-1/3 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-2 w-1/2 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-8 lg:px-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="space-y-6">
            <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-9 w-full animate-pulse border-b border-gray-200 bg-transparent" />
            <div className="h-24 w-full animate-pulse bg-gray-100" />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-8 h-10 w-56 animate-pulse rounded bg-gray-200" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductosCatalogoInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const spKey = searchParams.toString();

  const qFromUrl = searchParams.get("q") ?? "";
  const soloDisponibles = searchParams.get("disponible") === "1";
  const categoriaParam =
    searchParams.get("categoria_id") ?? searchParams.get("categorias");
  const marcaParam = searchParams.get("marca_id");
  const categoriaIds = useMemo(
    () => parseCommaIds(categoriaParam),
    [categoriaParam],
  );
  const marcaIds = useMemo(() => parseCommaIds(marcaParam), [marcaParam]);

  const [searchDraft, setSearchDraft] = useState(qFromUrl);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchDraft(qFromUrl);
  }, [qFromUrl, spKey]);

  const replaceQuery = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      mutate(p);
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setSearchDebounced = useCallback(
    (value: string) => {
      setSearchDraft(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        replaceQuery((p) => {
          const v = value.trim();
          if (v) p.set("q", v);
          else p.delete("q");
        });
      }, 400);
    },
    [replaceQuery],
  );

  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [marcas, setMarcas] = useState<MarcaRow[]>([]);
  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Set<number>>(
    () => new Set(),
  );
  const filterIdDesktop = useId();
  const filterIdMobile = useId();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [catRes, marRes] = await Promise.all([
        supabase
          .from("categorias")
          .select("id, nombre, parent_id")
          .order("nombre", { ascending: true }),
        supabase
          .from("marcas")
          .select("id, nombre")
          .order("nombre", { ascending: true }),
      ]);
      if (cancelled) return;
      if (catRes.error) {
        console.error(catRes.error.message);
      } else {
        setCategorias((catRes.data ?? []) as CategoriaRow[]);
      }
      if (marRes.error) {
        console.error(marRes.error.message);
      } else {
        setMarcas((marRes.data ?? []) as MarcaRow[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const childrenByParent = useMemo(
    () => buildChildrenByParent(categorias),
    [categorias],
  );

  const padres = useMemo(
    () => categorias.filter((c) => c.parent_id == null),
    [categorias],
  );

  const categoriaNombreById = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of categorias) m.set(c.id, c.nombre);
    return m;
  }, [categorias]);

  const marcaNombreById = useMemo(() => {
    const map = new Map<number, string>();
    for (const row of marcas) map.set(row.id, row.nombre);
    return map;
  }, [marcas]);

  const resolvedCategoriaIds = useMemo(
    () => resolveCategoryFilterIds(categoriaIds, categorias),
    [categoriaIds, categorias],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from("productos")
          .select(
            "id, nombre, codigo, precio_costo, multiplicador_venta, imagen_url, disponible, categoria_id, marca_id, marcas ( nombre )",
          )
          .order("nombre", { ascending: true });

        const qTrim = qFromUrl.trim();
        if (qTrim) {
          query = query.ilike("nombre", `%${qTrim}%`);
        }
        if (soloDisponibles) {
          query = query.eq("disponible", true);
        }
        if (resolvedCategoriaIds.length > 0) {
          query = query.in("categoria_id", resolvedCategoriaIds);
        }
        if (marcaIds.length > 0) {
          query = query.in("marca_id", marcaIds);
        }

        const { data, error: fetchError } = await query;

        if (cancelled) return;
        if (fetchError) {
          setError(fetchError.message);
          setProductos([]);
        } else {
          const rows = (data ?? []) as unknown as ProductoRow[];
          setProductos(rows);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar");
          setProductos([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    qFromUrl,
    soloDisponibles,
    formatIds(resolvedCategoriaIds),
    formatIds(marcaIds),
    spKey,
  ]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (qFromUrl.trim()) n += 1;
    if (soloDisponibles) n += 1;
    n += categoriaIds.length;
    n += marcaIds.length;
    return n;
  }, [qFromUrl, soloDisponibles, categoriaIds.length, marcaIds.length]);

  const toggleCategoria = (id: number, checked: boolean) => {
    const next = new Set(categoriaIds);
    if (checked) next.add(id);
    else next.delete(id);
    const arr = [...next];
    replaceQuery((p) => {
      if (arr.length) p.set("categoria_id", formatIds(arr));
      else p.delete("categoria_id");
    });
  };

  const toggleMarca = (id: number, checked: boolean) => {
    const next = new Set(marcaIds);
    if (checked) next.add(id);
    else next.delete(id);
    const arr = [...next];
    replaceQuery((p) => {
      if (arr.length) p.set("marca_id", formatIds(arr));
      else p.delete("marca_id");
    });
  };

  const toggleDisponibles = (checked: boolean) => {
    replaceQuery((p) => {
      if (checked) p.set("disponible", "1");
      else p.delete("disponible");
    });
  };

  const clearAllFilters = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchDraft("");
    router.replace(pathname, { scroll: false });
  };

  const removeChipSearch = () => {
    setSearchDraft("");
    replaceQuery((p) => p.delete("q"));
  };

  const removeChipDisponible = () => {
    replaceQuery((p) => p.delete("disponible"));
  };

  const removeChipCategoria = (id: number) => {
    const next = categoriaIds.filter((x) => x !== id);
    replaceQuery((p) => {
      if (next.length) p.set("categoria_id", formatIds(next));
      else p.delete("categoria_id");
    });
  };

  const removeChipMarca = (id: number) => {
    const next = marcaIds.filter((x) => x !== id);
    replaceQuery((p) => {
      if (next.length) p.set("marca_id", formatIds(next));
      else p.delete("marca_id");
    });
  };

  const toggleParentExpanded = (id: number) => {
    setExpandedParents((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const renderFilterSidebar = (idPrefix: string) => (
    <div className="flex h-full flex-col gap-6 overflow-y-auto">
      <div>
        <label
          htmlFor={`${idPrefix}-q`}
          className="mb-2 block text-xs font-light uppercase tracking-widest text-gray-400"
        >
          Buscar
        </label>
        <div className="relative flex items-center border-b border-gray-300 py-2">
          <input
            id={`${idPrefix}-q`}
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDebounced(e.target.value)}
            placeholder="Nombre del producto..."
            className="w-full border-0 bg-transparent pr-8 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
          />
          <Search
            className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
        </div>
      </div>

      <FilterCheckbox
        id={`${idPrefix}-solo`}
        checked={soloDisponibles}
        onChange={toggleDisponibles}
      >
        Solo disponibles
      </FilterCheckbox>

      <div className="border-b border-gray-200 pb-1 mb-3">
        <h3 className="mb-3 text-xs font-light uppercase tracking-widest text-gray-400">
          Categorías
        </h3>
        <ul className="space-y-0">
          {padres.map((padre) => {
            const hijos = childrenByParent.get(padre.id) ?? [];
            const hijoRows = hijos
              .map((hid) => categorias.find((c) => c.id === hid))
              .filter(Boolean) as CategoriaRow[];
            const expanded = expandedParents.has(padre.id);
            const tieneHijos = hijoRows.length > 0;
            return (
              <li key={padre.id}>
                {tieneHijos ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleParentExpanded(padre.id)}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 py-2.5 text-left text-xs font-normal uppercase tracking-widest text-gray-700 transition hover:text-gray-900"
                      aria-expanded={expanded}
                    >
                      <span className="leading-tight">{padre.nombre}</span>
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                      )}
                    </button>
                    {expanded && (
                      <ul className="ml-2 border-l border-gray-200 pl-3">
                        {hijoRows.map((h) => (
                          <li key={h.id}>
                            <FilterCheckbox
                              id={`${idPrefix}-cat-${h.id}`}
                              checked={categoriaIds.includes(h.id)}
                              onChange={(c) => toggleCategoria(h.id, c)}
                            >
                              {h.nombre}
                            </FilterCheckbox>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <FilterCheckbox
                    id={`${idPrefix}-cat-${padre.id}`}
                    checked={categoriaIds.includes(padre.id)}
                    onChange={(c) => toggleCategoria(padre.id, c)}
                  >
                    <span className="leading-tight">{padre.nombre}</span>
                  </FilterCheckbox>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-b border-gray-200 pb-1 mb-3">
        <h3 className="mb-3 text-xs font-light uppercase tracking-widest text-gray-400">
          Marcas
        </h3>
        <ul className="max-h-64 space-y-0 overflow-y-auto pr-1">
          {marcas.map((m) => (
            <li key={m.id}>
              <FilterCheckbox
                id={`${idPrefix}-marca-${m.id}`}
                checked={marcaIds.includes(m.id)}
                onChange={(c) => toggleMarca(m.id, c)}
              >
                {m.nombre}
              </FilterCheckbox>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      {drawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Cerrar filtros"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 lg:px-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:sticky lg:top-0 lg:block lg:h-[calc(100vh-1.5rem)] lg:self-start lg:overflow-hidden">
          <div className="flex h-full max-h-[calc(100vh-2rem)] flex-col">
            <h2 className="mb-6 font-light uppercase tracking-widest text-xs text-gray-400">
              Filtros
            </h2>
            {renderFilterSidebar(filterIdDesktop)}
          </div>
        </aside>

        {/* Mobile drawer */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-[min(100%,288px)] max-w-full transform border-r border-gray-200 bg-[#fafafa] shadow-xl transition-transform duration-200 ease-out lg:hidden ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col p-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-light uppercase tracking-widest text-xs text-gray-400">
                Filtros
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-gray-400 transition hover:text-gray-800"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {renderFilterSidebar(filterIdMobile)}
            </div>
          </div>
        </div>

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-4xl font-light tracking-tight text-gray-900">
              Productos
            </h1>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="relative inline-flex items-center gap-2 border border-gray-300 bg-white px-3 py-2 text-xs font-medium uppercase tracking-widest text-gray-700 transition hover:border-gray-400 lg:hidden"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center bg-gray-900 px-1 text-[10px] font-medium text-white">
                  {activeFilterCount > 99 ? "99+" : activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Chips */}
          {activeFilterCount > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {qFromUrl.trim() && (
                <span className="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700">
                  Búsqueda: {qFromUrl.trim()}
                  <button
                    type="button"
                    onClick={removeChipSearch}
                    className="p-0.5 text-gray-400 transition hover:text-gray-700"
                    aria-label="Quitar búsqueda"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {soloDisponibles && (
                <span className="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700">
                  Solo disponibles
                  <button
                    type="button"
                    onClick={removeChipDisponible}
                    className="p-0.5 text-gray-400 transition hover:text-gray-700"
                    aria-label="Quitar filtro disponibles"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {categoriaIds.map((id) => (
                <span
                  key={`c-${id}`}
                  className="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700"
                >
                  {categoriaNombreById.get(id) ?? `Categoría ${id}`}
                  <button
                    type="button"
                    onClick={() => removeChipCategoria(id)}
                    className="p-0.5 text-gray-400 transition hover:text-gray-700"
                    aria-label="Quitar categoría"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {marcaIds.map((id) => (
                <span
                  key={`m-${id}`}
                  className="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700"
                >
                  {marcaNombreById.get(id) ?? `Marca ${id}`}
                  <button
                    type="button"
                    onClick={() => removeChipMarca(id)}
                    className="p-0.5 text-gray-400 transition hover:text-gray-700"
                    aria-label="Quitar marca"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-1 text-xs text-gray-500 underline underline-offset-2 transition hover:text-gray-800"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="relative min-h-[200px]">
            {loading && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 md:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && productos.length === 0 && (
              <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                <p className="text-base font-light text-gray-900">
                  No hay productos con estos filtros
                </p>
                <p className="mt-2 max-w-md text-sm text-gray-500">
                  Probá ampliar la búsqueda o quitá algunos filtros para ver más
                  resultados.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-6 text-xs text-gray-500 underline underline-offset-2 transition hover:text-gray-800"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {!loading && productos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 md:gap-4">
                {productos.map((p) => {
                  const marcaNombre =
                    p.marcas?.nombre ?? marcaNombreById.get(p.marca_id ?? 0);
                  return (
                    <Link
                      key={p.id}
                      href={`/productos/${p.id}`}
                      className="group relative flex flex-col overflow-hidden border-b-2 border-transparent bg-white shadow-none transition duration-200 hover:border-amber-500 hover:shadow-sm"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
                        {p.imagen_url ? (
                          <img
                            src={p.imagen_url}
                            alt=""
                            className="h-full w-full object-contain transition duration-300 ease-out group-hover:scale-[1.01]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-normal text-gray-500">
                            Sin imagen
                          </div>
                        )}
                        {!p.disponible && (
                          <span className="absolute left-2 top-2 bg-black px-2 py-0.5 text-xs font-medium text-white">
                            SIN STOCK
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col px-1 py-3">
                        {marcaNombre ? (
                          <p className="text-xs font-normal uppercase tracking-widest text-gray-400">
                            {marcaNombre}
                          </p>
                        ) : (
                          <p className="text-xs font-normal uppercase tracking-widest text-gray-400">
                            Sin marca
                          </p>
                        )}
                        <h2 className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-gray-900">
                          {p.nombre}
                        </h2>
                        {p.codigo && (
                          <p className="mt-1 font-mono text-xs text-gray-400">
                            {p.codigo}
                          </p>
                        )}
                        {/* El precio no se muestra en la vista pública */}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default function ProductosPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <ProductosCatalogoInner />
    </Suspense>
  );
}
