"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Plug,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import AgregarConsultaButton from "../components/AgregarConsultaButton";
import { productoUrl } from "../../lib/slug";

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
  imagen_url: string | null;
  disponible: boolean;
  destacado: boolean | null;
  categoria_id: number | null;
  marca_id: number | null;
};

type Orden = "relevancia" | "az" | "za";

const ORDENES: { id: Orden; nombre: string }[] = [
  { id: "relevancia", nombre: "Destacados" },
  { id: "az", nombre: "Nombre A-Z" },
  { id: "za", nombre: "Nombre Z-A" },
];

// Cuántos productos se muestran de entrada y cuántos suma "Ver más"
const POR_PAGINA = 24;

// La marca "Generica" no le dice nada al cliente; no la mostramos en las tarjetas
const MARCAS_OCULTAS = new Set(["generica", "genérica"]);

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

/** Minúsculas y sin tildes, para que "lampara" encuentre "Lámpara". */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function FilterCheckbox({
  checked,
  onChange,
  count,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  count?: number;
  children: ReactNode;
}) {
  const vacio = count === 0 && !checked;
  return (
    <label
      className={`group/check flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition hover:bg-zinc-100 ${
        vacio ? "text-zinc-600" : "text-zinc-700"
      }`}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-300 transition group-hover/check:border-orange-400/60 peer-checked:border-[#F97316] peer-checked:bg-[#F97316] peer-focus-visible:ring-2 peer-focus-visible:ring-[#F97316] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
      >
        <Check className="h-3 w-3 text-black" strokeWidth={3} />
      </span>
      <span className="min-w-0 flex-1 leading-tight peer-checked:text-zinc-900">
        {children}
      </span>
      {count != null && (
        <span className="text-xs tabular-nums text-zinc-500">{count}</span>
      )}
    </label>
  );
}

function FiltroSeccion({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-zinc-200 pt-5">
      <h3 className="mb-3 px-2 text-sm font-semibold text-zinc-900">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

function ProductCard({
  producto,
  marca,
  orden,
}: {
  producto: ProductoRow;
  marca: string | null;
  orden: number;
}) {
  return (
    <article
      className="catalogo-card group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-2"
      style={{ "--i": orden } as CSSProperties}
    >
      <Link
        href={productoUrl(producto)}
        className="flex flex-1 flex-col rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white">
          {producto.imagen_url ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              loading="lazy"
              className="catalogo-card__img h-full w-full object-contain p-3"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-100 text-zinc-600">
              <Plug className="h-8 w-8" strokeWidth={1.25} aria-hidden />
              <span className="text-xs">Foto próximamente</span>
            </div>
          )}
          {!producto.disponible && (
            <span className="absolute left-2 top-2 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-white">
              Sin stock
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col px-2 pt-3">
          {marca && (
            <p className="text-xs font-medium text-orange-700">{marca}</p>
          )}
          <h2 className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-zinc-900 transition group-hover:text-orange-700">
            {producto.nombre}
          </h2>
          {producto.codigo && (
            <p className="mt-1 text-xs tabular-nums text-zinc-500">
              Cód. {producto.codigo}
            </p>
          )}
        </div>
      </Link>
      <div className="px-1 pb-1 pt-3">
        <AgregarConsultaButton
          compact
          className="w-full"
          producto={{
            id: producto.id,
            nombre: producto.nombre,
            codigo: producto.codigo,
            imagen_url: producto.imagen_url,
          }}
        />
      </div>
    </article>
  );
}

export type CatalogoClienteProps = {
  productos: ProductoRow[];
  categorias: CategoriaRow[];
  marcas: MarcaRow[];
  /** Título grande de la página ("Catálogo", el nombre de la categoría o de la marca). */
  titulo?: string;
  /** En las páginas de categoría o marca, el filtro que define la página. */
  fijo?: { tipo: "categoria" | "marca"; id: number };
  /**
   * Filtros extra que vienen en la dirección (?q=, ?marca_id=...). En /productos los
   * manda el servidor; en las páginas guardadas (categoría y marca) se leen al abrir.
   */
  queryInicial?: string;
  error?: string | null;
};

export default function CatalogoCliente({
  productos: todosLosProductos,
  categorias,
  marcas,
  titulo = "Catálogo",
  fijo,
  queryInicial,
  error = null,
}: CatalogoClienteProps) {
  // Los filtros viven en la dirección (para poder compartir el link), pero se
  // actualizan sin volver a pedirle la página al servidor.
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(queryInicial ?? ""),
  );
  useEffect(() => {
    if (queryInicial !== undefined) {
      setSearchParams(new URLSearchParams(queryInicial));
    } else if (window.location.search) {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, [queryInicial]);

  const qFromUrl = searchParams.get("q") ?? "";
  const soloDisponibles = searchParams.get("disponible") === "1";
  const orden: Orden =
    (ORDENES.find((o) => o.id === searchParams.get("orden"))?.id) ??
    "relevancia";
  // El menú del sitio manda "categorias"; los filtros de esta página escriben "categoria_id"
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
  }, [qFromUrl]);

  const replaceQuery = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      mutate(p);
      setSearchParams(p);
      const qs = p.toString();
      window.history.replaceState(
        null,
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
      );
    },
    [searchParams],
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
      }, 250);
    },
    [replaceQuery],
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Set<number>>(
    () => new Set(),
  );
  const [visibles, setVisibles] = useState(POR_PAGINA);

  const childrenByParent = useMemo(
    () => buildChildrenByParent(categorias),
    [categorias],
  );

  // En una página de categoría, los filtros de categoría muestran sus subcategorías
  const padres = useMemo(
    () =>
      categorias.filter((c) =>
        fijo?.tipo === "categoria" ? c.parent_id === fijo.id : c.parent_id == null,
      ),
    [categorias, fijo],
  );

  // Productos que corresponden a la página antes de cualquier filtro
  const productos = useMemo(() => {
    if (!fijo) return todosLosProductos;
    if (fijo.tipo === "marca") {
      return todosLosProductos.filter((p) => p.marca_id === fijo.id);
    }
    const ids = new Set(collectSubtreeIds(fijo.id, childrenByParent));
    return todosLosProductos.filter(
      (p) => p.categoria_id != null && ids.has(p.categoria_id),
    );
  }, [todosLosProductos, fijo, childrenByParent]);

  const categoriaById = useMemo(() => {
    const m = new Map<number, CategoriaRow>();
    for (const c of categorias) m.set(c.id, c);
    return m;
  }, [categorias]);

  const marcaNombreById = useMemo(() => {
    const map = new Map<number, string>();
    for (const row of marcas) map.set(row.id, row.nombre);
    return map;
  }, [marcas]);

  const marcaVisible = useCallback(
    (marcaId: number | null) => {
      if (marcaId == null) return null;
      const nombre = marcaNombreById.get(marcaId);
      if (!nombre || MARCAS_OCULTAS.has(normalizar(nombre))) return null;
      return nombre;
    },
    [marcaNombreById],
  );

  const resolvedCategoriaIds = useMemo(() => {
    const resolved = new Set<number>();
    for (const id of categoriaIds) {
      for (const x of collectSubtreeIds(id, childrenByParent)) resolved.add(x);
    }
    return resolved;
  }, [categoriaIds, childrenByParent]);

  // Texto buscable de cada producto (nombre, código y marca, sin tildes)
  const textoBuscable = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of productos) {
      m.set(
        p.id,
        normalizar(
          `${p.nombre} ${p.codigo ?? ""} ${marcaNombreById.get(p.marca_id ?? -1) ?? ""}`,
        ),
      );
    }
    return m;
  }, [productos, marcaNombreById]);

  const palabras = useMemo(
    () => normalizar(qFromUrl).split(/\s+/).filter(Boolean),
    [qFromUrl],
  );

  const pasaBusqueda = useCallback(
    (p: ProductoRow) => {
      if (!palabras.length) return true;
      const t = textoBuscable.get(p.id) ?? "";
      return palabras.every((w) => t.includes(w));
    },
    [palabras, textoBuscable],
  );
  const pasaDisponible = useCallback(
    (p: ProductoRow) => !soloDisponibles || p.disponible,
    [soloDisponibles],
  );
  const pasaCategoria = useCallback(
    (p: ProductoRow) =>
      resolvedCategoriaIds.size === 0 ||
      (p.categoria_id != null && resolvedCategoriaIds.has(p.categoria_id)),
    [resolvedCategoriaIds],
  );
  const pasaMarca = useCallback(
    (p: ProductoRow) =>
      marcaIds.length === 0 ||
      (p.marca_id != null && marcaIds.includes(p.marca_id)),
    [marcaIds],
  );

  const filtrados = useMemo(() => {
    const out = productos.filter(
      (p) =>
        pasaBusqueda(p) && pasaDisponible(p) && pasaCategoria(p) && pasaMarca(p),
    );
    const porNombre = (a: ProductoRow, b: ProductoRow) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
    if (orden === "az") out.sort(porNombre);
    else if (orden === "za") out.sort((a, b) => porNombre(b, a));
    else {
      // Destacados, después los que tienen foto, después el resto
      const peso = (p: ProductoRow) =>
        (p.destacado ? 0 : 2) + (p.imagen_url ? 0 : 1);
      out.sort((a, b) => peso(a) - peso(b) || porNombre(a, b));
    }
    return out;
  }, [productos, pasaBusqueda, pasaDisponible, pasaCategoria, pasaMarca, orden]);

  // Cantidades de cada filtro, teniendo en cuenta los demás filtros activos
  const conteoCategoria = useMemo(() => {
    const porCategoria = new Map<number, number>();
    for (const p of productos) {
      if (p.categoria_id == null) continue;
      if (!pasaBusqueda(p) || !pasaDisponible(p) || !pasaMarca(p)) continue;
      porCategoria.set(p.categoria_id, (porCategoria.get(p.categoria_id) ?? 0) + 1);
    }
    const total = (id: number) =>
      collectSubtreeIds(id, childrenByParent).reduce(
        (n, x) => n + (porCategoria.get(x) ?? 0),
        0,
      );
    const m = new Map<number, number>();
    for (const c of categorias) m.set(c.id, total(c.id));
    return m;
  }, [productos, categorias, childrenByParent, pasaBusqueda, pasaDisponible, pasaMarca]);

  const conteoMarca = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of productos) {
      if (p.marca_id == null) continue;
      if (!pasaBusqueda(p) || !pasaDisponible(p) || !pasaCategoria(p)) continue;
      m.set(p.marca_id, (m.get(p.marca_id) ?? 0) + 1);
    }
    return m;
  }, [productos, pasaBusqueda, pasaDisponible, pasaCategoria]);

  // Categorías y marcas que tienen al menos un producto cargado (las vacías no se listan)
  const conProductos = useMemo(() => {
    const cats = new Set<number>();
    const mars = new Set<number>();
    const porCategoria = new Set(productos.map((p) => p.categoria_id));
    for (const c of categorias) {
      if (collectSubtreeIds(c.id, childrenByParent).some((x) => porCategoria.has(x)))
        cats.add(c.id);
    }
    for (const p of productos) if (p.marca_id != null) mars.add(p.marca_id);
    return { cats, mars };
  }, [productos, categorias, childrenByParent]);

  const hayNoDisponibles = useMemo(
    () => productos.some((p) => !p.disponible),
    [productos],
  );

  // Al cambiar cualquier filtro se vuelve a la primera tanda
  const firmaFiltros = `${qFromUrl}|${soloDisponibles}|${formatIds(categoriaIds)}|${formatIds(marcaIds)}|${orden}`;
  useEffect(() => {
    setVisibles(POR_PAGINA);
  }, [firmaFiltros]);

  // Abre la categoría padre de lo que viene seleccionado desde el menú
  useEffect(() => {
    if (!categorias.length || !categoriaIds.length) return;
    setExpandedParents((prev) => {
      const n = new Set(prev);
      for (const id of categoriaIds) {
        const parent = categoriaById.get(id)?.parent_id;
        n.add(parent ?? id);
      }
      return n;
    });
  }, [categorias.length, categoriaIds, categoriaById]);

  const activeFilterCount =
    (qFromUrl.trim() ? 1 : 0) +
    (soloDisponibles ? 1 : 0) +
    categoriaIds.length +
    marcaIds.length;

  const setCategorias_ = (ids: number[]) => {
    replaceQuery((p) => {
      p.delete("categorias");
      if (ids.length) p.set("categoria_id", formatIds(ids));
      else p.delete("categoria_id");
    });
  };

  const toggleCategoria = (id: number, checked: boolean) => {
    const cat = categoriaById.get(id);
    let next = categoriaIds.filter((x) => x !== id);
    if (checked) {
      // Elegir un padre reemplaza a sus hijos, y elegir un hijo reemplaza al padre
      const hijos = childrenByParent.get(id) ?? [];
      next = next.filter((x) => !hijos.includes(x) && x !== cat?.parent_id);
      next.push(id);
    }
    setCategorias_(next);
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

  const setOrden = (o: Orden) => {
    replaceQuery((p) => {
      if (o === "relevancia") p.delete("orden");
      else p.set("orden", o);
    });
  };

  const clearAllFilters = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchDraft("");
    replaceQuery((p) => {
      for (const k of ["q", "disponible", "categoria_id", "categorias", "marca_id"])
        p.delete(k);
    });
  };

  const removeChipSearch = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchDraft("");
    replaceQuery((p) => p.delete("q"));
  };

  const toggleParentExpanded = (id: number) => {
    setExpandedParents((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  // Cerrar el panel de filtros del celular con Escape y bloquear el scroll de fondo
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const marcasListadas = marcas.filter(
    (m) => conProductos.mars.has(m.id) || marcaIds.includes(m.id),
  );

  const padresVisibles = padres.filter(
    (p) => conProductos.cats.has(p.id) || categoriaIds.includes(p.id),
  );

  const renderFiltros = () => (
    <div className="flex flex-col gap-5">
      {padresVisibles.length > 0 && (
      <FiltroSeccion titulo="Categorías">
        <ul className="flex flex-col gap-0.5">
          {padresVisibles.map((padre) => {
              const hijos = (childrenByParent.get(padre.id) ?? [])
                .map((hid) => categoriaById.get(hid))
                .filter(
                  (c): c is CategoriaRow =>
                    !!c && (conProductos.cats.has(c.id) || categoriaIds.includes(c.id)),
                );
              const expanded = expandedParents.has(padre.id);
              const algunHijoActivo = hijos.some((h) => categoriaIds.includes(h.id));
              return (
                <li key={padre.id}>
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                      <FilterCheckbox
                        checked={categoriaIds.includes(padre.id)}
                        onChange={(c) => toggleCategoria(padre.id, c)}
                        count={conteoCategoria.get(padre.id)}
                      >
                        <span className={algunHijoActivo ? "text-zinc-900" : undefined}>
                          {padre.nombre}
                        </span>
                      </FilterCheckbox>
                    </div>
                    {hijos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleParentExpanded(padre.id)}
                        aria-expanded={expanded}
                        aria-label={`${expanded ? "Ocultar" : "Ver"} subcategorías de ${padre.nombre}`}
                        className="ml-1 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                  {hijos.length > 0 && (
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <ul
                        className="ml-4 overflow-hidden border-l border-zinc-200 pl-2"
                        inert={!expanded}
                      >
                        {hijos.map((h) => (
                          <li key={h.id}>
                            <FilterCheckbox
                              checked={categoriaIds.includes(h.id)}
                              onChange={(c) => toggleCategoria(h.id, c)}
                              count={conteoCategoria.get(h.id)}
                            >
                              {h.nombre}
                            </FilterCheckbox>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      </FiltroSeccion>
      )}

      {fijo?.tipo !== "marca" && (
      <FiltroSeccion titulo="Marcas">
        <ul className="flex flex-col gap-0.5">
          {marcasListadas.map((m) => (
            <li key={m.id}>
              <FilterCheckbox
                checked={marcaIds.includes(m.id)}
                onChange={(c) => toggleMarca(m.id, c)}
                count={conteoMarca.get(m.id) ?? 0}
              >
                {m.nombre}
              </FilterCheckbox>
            </li>
          ))}
        </ul>
      </FiltroSeccion>
      )}

      {(hayNoDisponibles || soloDisponibles) && (
        <FiltroSeccion titulo="Stock">
          <FilterCheckbox checked={soloDisponibles} onChange={toggleDisponibles}>
            Solo disponibles
          </FilterCheckbox>
        </FiltroSeccion>
      )}
    </div>
  );

  type Chip = { tipo: "q" | "cat" | "marca" | "disp"; id: number; label: string };
  const chips: Chip[] = [
    ...(qFromUrl.trim()
      ? [{ tipo: "q" as const, id: 0, label: `“${qFromUrl.trim()}”` }]
      : []),
    ...categoriaIds.map((id) => ({
      tipo: "cat" as const,
      id,
      label: categoriaById.get(id)?.nombre ?? `Categoría ${id}`,
    })),
    ...marcaIds.map((id) => ({
      tipo: "marca" as const,
      id,
      label: marcaNombreById.get(id) ?? `Marca ${id}`,
    })),
    ...(soloDisponibles
      ? [{ tipo: "disp" as const, id: 0, label: "Solo disponibles" }]
      : []),
  ];

  const quitarChip = (c: Chip) => {
    if (c.tipo === "q") removeChipSearch();
    else if (c.tipo === "cat") toggleCategoria(c.id, false);
    else if (c.tipo === "marca") toggleMarca(c.id, false);
    else toggleDisponibles(false);
  };

  const mostrados = filtrados.slice(0, visibles);
  const restantes = filtrados.length - mostrados.length;

  return (
    <div className="min-h-screen bg-[#faf9f7] text-zinc-900">
      <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-8 lg:px-6 lg:pt-10">
        {/* Encabezado: título, búsqueda y orden */}
        <header className="mb-6 flex flex-col gap-5 lg:mb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {titulo}
              </h1>
              <p className="mt-1 text-sm text-zinc-600" aria-live="polite">
                {`${filtrados.length} ${filtrados.length === 1 ? "producto" : "productos"}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                aria-hidden
              />
              <input
                type="search"
                value={searchDraft}
                onChange={(e) => setSearchDebounced(e.target.value)}
                placeholder="Buscá por nombre, código o marca"
                aria-label="Buscar productos"
                className="h-12 w-full rounded-full border border-zinc-200 bg-white pl-11 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-500 hover:border-zinc-300 focus:border-[#F97316]/70 focus:ring-2 focus:ring-[#F97316]/20 [&::-webkit-search-cancel-button]:hidden"
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={removeChipSearch}
                  aria-label="Borrar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="relative inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F97316] px-1.5 text-[11px] font-semibold tabular-nums text-black">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <label className="relative flex-1 sm:flex-none">
                <span className="sr-only">Ordenar por</span>
                <ArrowUpDown
                  className="pointer-events-none absolute left-4 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-zinc-500 sm:block"
                  aria-hidden
                />
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value as Orden)}
                  className="h-12 w-full cursor-pointer appearance-none rounded-full border border-zinc-200 bg-white pl-5 pr-9 text-sm sm:pl-11 sm:pr-10 text-zinc-800 outline-none transition hover:border-zinc-300 focus:border-[#F97316]/70 focus:ring-2 focus:ring-[#F97316]/20"
                >
                  {ORDENES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                  aria-hidden
                />
              </label>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button
                  key={`${c.tipo}-${c.id}`}
                  type="button"
                  onClick={() => quitarChip(c)}
                  className="group/chip inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 py-1.5 pl-3 pr-2 text-xs font-medium text-orange-700 transition hover:border-orange-400 hover:bg-orange-100"
                  aria-label={`Quitar filtro ${c.label}`}
                >
                  {c.label}
                  <X className="h-3.5 w-3.5 text-orange-700 transition group-hover/chip:text-zinc-900" aria-hidden />
                </button>
              ))}
              {chips.length > 1 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="ml-1 rounded px-1 text-xs text-zinc-600 underline underline-offset-4 transition hover:text-zinc-900"
                >
                  Limpiar todo
                </button>
              )}
            </div>
          )}
        </header>

        <div className="flex gap-8">
          {/* Filtros en compu */}
          <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filtros">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-6 pr-2 [scrollbar-color:#3f3f46_transparent] [scrollbar-width:thin]">
              {renderFiltros()}
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {!error && filtrados.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 px-6 py-20 text-center">
                <Search className="h-8 w-8 text-zinc-400" strokeWidth={1.5} aria-hidden />
                <p className="mt-4 text-base font-medium text-zinc-900">
                  No encontramos productos con esos filtros
                </p>
                <p className="mt-2 max-w-sm text-sm text-zinc-600">
                  Probá con otra palabra o quitá algún filtro. Si no lo ves,
                  escribinos y te decimos si lo tenemos.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-6 rounded-full bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-orange-400"
                >
                  Ver todos los productos
                </button>
              </div>
            )}

            {filtrados.length > 0 && (
              <>
                <div
                  key={firmaFiltros}
                  className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
                >
                  {mostrados.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      producto={p}
                      marca={marcaVisible(p.marca_id)}
                      // Escalonado de entrada solo dentro de cada tanda de 24
                      orden={Math.min(i % POR_PAGINA, 12)}
                    />
                  ))}
                </div>

                <div className="mt-10 flex flex-col items-center gap-4">
                  <p className="text-xs tabular-nums text-zinc-500">
                    Mostrando {mostrados.length} de {filtrados.length}
                  </p>
                  <div className="h-1 w-48 overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full rounded-full bg-[#F97316] transition-[width] duration-500 ease-out"
                      style={{ width: `${(mostrados.length / filtrados.length) * 100}%` }}
                    />
                  </div>
                  {restantes > 0 && (
                    <button
                      type="button"
                      onClick={() => setVisibles((v) => v + POR_PAGINA)}
                      className="mt-2 inline-flex items-center gap-2 rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[#F97316] hover:bg-[#F97316] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                    >
                      Ver más productos
                      <ChevronDown className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Filtros en celular: panel que sube desde abajo */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${drawerOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          tabIndex={drawerOpen ? 0 : -1}
          aria-label="Cerrar filtros"
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
          inert={!drawerOpen}
          className={`absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl border-t border-zinc-200 bg-white shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.35)] transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            drawerOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-zinc-300" aria-hidden />
          <div className="flex items-center justify-between px-5 pb-2 pt-3">
            <h2 className="text-lg font-semibold">Filtros</h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-full p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            {renderFiltros()}
          </div>
          <div className="flex gap-3 border-t border-zinc-200 p-4">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-800"
              >
                Limpiar
              </button>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="flex-1 rounded-full bg-[#F97316] px-5 py-3 text-sm font-semibold text-black"
            >
              Ver {filtrados.length} {filtrados.length === 1 ? "producto" : "productos"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
