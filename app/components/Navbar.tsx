 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Buscador from "./Buscador";
import { ChevronDown, ChevronRight, Menu as MenuIcon } from "lucide-react";

type Categoria = {
  id: number;
  nombre: string;
};

type CategoriaSub = {
  id: number;
  nombre: string;
  parent_id: number;
};

export default function Navbar() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isProductosOpen, setIsProductosOpen] = useState(false);
  const [isBuscadorOpen, setIsBuscadorOpen] = useState(false);
  const [categoriaHoverId, setCategoriaHoverId] = useState<number | null>(null);
  const [subcategoriasByParent, setSubcategoriasByParent] = useState<
    Record<number, CategoriaSub[]>
  >({});
  const [subFadeIn, setSubFadeIn] = useState(true);
  const [mobileExpandedId, setMobileExpandedId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: mainData, error: mainError } = await supabase
        .from("categorias")
        .select("id, nombre")
        .is("parent_id", null)
        .order("nombre", { ascending: true });

      if (cancelled) return;
      if (mainError) {
        console.error("Error al cargar categorias principales:", mainError.message);
        return;
      }

      const mainCats = (mainData ?? []) as Categoria[];
      setCategorias(mainCats);

      const ids = mainCats.map((c) => c.id);
      if (ids.length === 0) {
        setSubcategoriasByParent({});
        return;
      }

      const { data: subData, error: subError } = await supabase
        .from("categorias")
        .select("id, nombre, parent_id")
        .in("parent_id", ids)
        .order("nombre", { ascending: true });

      if (cancelled) return;
      if (subError) {
        console.error("Error al cargar subcategorias:", subError.message);
        setSubcategoriasByParent({});
        return;
      }

      const map: Record<number, CategoriaSub[]> = {};
      for (const row of (subData ?? []) as CategoriaSub[]) {
        if (!map[row.parent_id]) map[row.parent_id] = [];
        map[row.parent_id].push(row);
      }
      setSubcategoriasByParent(map);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoriaActiva = useMemo(
    () => categorias.find((c) => c.id === categoriaHoverId) ?? null,
    [categorias, categoriaHoverId],
  );

  const subcategoriasActivas = useMemo(() => {
    if (!categoriaHoverId) return [];
    return subcategoriasByParent[categoriaHoverId] ?? [];
  }, [categoriaHoverId, subcategoriasByParent]);

  useEffect(() => {
    if (!isProductosOpen) return;

    if (categoriaHoverId == null && categorias.length > 0) {
      setCategoriaHoverId(categorias[0].id);
    }
    if (mobileExpandedId == null && categorias.length > 0) {
      setMobileExpandedId(categorias[0].id);
    }
  }, [isProductosOpen, categoriaHoverId, mobileExpandedId, categorias]);

  useEffect(() => {
    if (!isProductosOpen) return;
    if (categoriaHoverId == null) return;

    setSubFadeIn(false);
    const t = window.setTimeout(() => setSubFadeIn(true), 150);
    return () => window.clearTimeout(t);
  }, [categoriaHoverId, isProductosOpen]);

  const goToCategoria = (id: number) => {
    setIsProductosOpen(false);
    setCategoriaHoverId(id);
    setMobileExpandedId(null);
    // Mantener compatibilidad con el catálogo público actual (filtro usa `categoria_id`)
    router.push(`/productos?categorias=${id}&categoria_id=${id}`);
  };

  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/10 bg-[#0a0a0a]">
      <nav className="w-full">
        <div className="flex w-full items-center justify-between gap-6 px-6 py-3">
          <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <img
              src="https://thqmpndhlqknwactxcik.supabase.co/storage/v1/object/public/productos/logo.PNG"
              alt="N&G"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold tracking-tight text-white">N&amp;G</p>
            <p className="text-xs text-zinc-400">Materiales eléctricos</p>
          </div>
        </Link>

        <div
          className={`hidden items-center gap-10 text-lg font-semibold text-zinc-100 transition-all duration-300 md:flex ${
            isBuscadorOpen
              ? "pointer-events-none w-0 overflow-hidden opacity-0"
              : "opacity-100"
          }`}
        >
          <div
            className="relative"
            onMouseEnter={() => setIsProductosOpen(true)}
            onMouseLeave={() => {
              setIsProductosOpen(false);
              setCategoriaHoverId(null);
              setMobileExpandedId(null);
            }}
          >
            <button
              type="button"
              onClick={() => setIsProductosOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-bold text-black transition hover:bg-amber-600"
            >
              <MenuIcon className="h-4 w-4" />
              <span>Productos</span>
              <ChevronDown
                className={`h-4 w-4 text-black transition-transform duration-150 ${
                  isProductosOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            <div
              className={`absolute left-0 top-full z-50 w-[600px] max-w-[90vw] overflow-hidden rounded-tr-xl rounded-b-xl rounded-tl-none rounded-bl-none border border-zinc-700 bg-zinc-900 shadow-2xl transition-all duration-150 ease-out ${
                isProductosOpen
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-1 pointer-events-none opacity-0"
              }`}
            >
              {/* Desktop mega-menú */}
              <div className="hidden lg:block">
                <div className="flex">
                  <div className="w-[40%] bg-zinc-900">
                    {categorias.length === 0 ? (
                      <div className="px-4 py-4 text-sm font-medium text-zinc-400">
                        Cargando categorías...
                      </div>
                    ) : (
                      categorias.map((cat) => {
                        const isActive = cat.id === categoriaHoverId;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onMouseEnter={() => setCategoriaHoverId(cat.id)}
                            onFocus={() => setCategoriaHoverId(cat.id)}
                            onClick={() => goToCategoria(cat.id)}
                            className={`flex w-full items-center justify-between gap-3 py-3 px-4 text-left text-sm font-semibold uppercase tracking-wide transition ${
                              isActive
                                ? "bg-zinc-800 text-amber-500"
                                : "text-white hover:bg-zinc-800 hover:text-amber-400"
                            }`}
                          >
                            <span className="truncate">{cat.nombre}</span>
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 ${
                                isActive ? "text-amber-500" : "text-amber-400"
                              }`}
                            />
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="w-[60%] border-l border-zinc-700 bg-zinc-800">
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">
                        {categoriaActiva?.nombre ?? ""}
                      </p>
                    </div>

                    <div
                      className={`transition-opacity duration-150 ${
                        subFadeIn ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {categoriaActiva && subcategoriasActivas.length > 0 ? (
                        <div>
                          {subcategoriasActivas.map((sub) => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => goToCategoria(sub.id)}
                              className="block w-full py-2 px-4 text-left text-gray-300 transition hover:bg-zinc-700 hover:text-white"
                            >
                              {sub.nombre}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 pb-4 pt-1">
                          {categoriaActiva ? (
                            <button
                              type="button"
                              onClick={() => goToCategoria(categoriaActiva.id)}
                              className="text-left text-sm font-medium text-amber-500 hover:text-amber-400"
                            >
                              Ver todos los productos de {categoriaActiva.nombre}
                            </button>
                          ) : (
                            <p className="text-sm text-gray-400">
                              Ver todos los productos
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile acordeón */}
              <div className="lg:hidden">
                <div className="bg-zinc-900">
                  {categorias.length === 0 ? (
                    <div className="px-4 py-4 text-sm font-medium text-zinc-400">
                      Cargando categorías...
                    </div>
                  ) : (
                    categorias.map((cat) => {
                      const expanded = mobileExpandedId === cat.id;
                      const subs = subcategoriasByParent[cat.id] ?? [];

                      return (
                        <div
                          key={cat.id}
                          className="border-b border-zinc-700"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setMobileExpandedId(
                                expanded ? null : cat.id,
                              )
                            }
                            onMouseEnter={() => setCategoriaHoverId(cat.id)}
                            className={`flex w-full items-center justify-between gap-3 py-3 px-4 text-left text-sm font-semibold uppercase tracking-wide transition ${
                              expanded
                                ? "bg-zinc-800 text-amber-500"
                                : "text-white hover:bg-zinc-800 hover:text-amber-400"
                            }`}
                          >
                            <span className="truncate">{cat.nombre}</span>
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 transition-transform ${
                                expanded ? "rotate-90 text-amber-500" : "text-amber-400"
                              }`}
                            />
                          </button>

                          {expanded && (
                            <div className="bg-zinc-800">
                              {subs.length > 0 ? (
                                subs.map((sub) => (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => goToCategoria(sub.id)}
                                    className="block w-full py-2 px-4 text-left text-gray-300 transition hover:bg-zinc-700 hover:text-white"
                                  >
                                    {sub.nombre}
                                  </button>
                                ))
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => goToCategoria(cat.id)}
                                  className="block w-full py-2 px-4 text-left text-sm font-medium text-amber-500 hover:text-amber-400"
                                >
                                  Ver todos los productos de {cat.nombre}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/nosotros"
            className="rounded-lg px-2 py-1 transition hover:bg-white/5 hover:text-[#F97316]"
          >
            Nosotros
          </Link>
          <Link
            href="/sucursales"
            className="rounded-lg px-2 py-1 transition hover:bg-white/5 hover:text-[#F97316]"
          >
            Sucursales
          </Link>
          <Link
            href="/contacto"
            className="rounded-lg px-2 py-1 transition hover:bg-white/5 hover:text-[#F97316]"
          >
            Contacto
          </Link>
        </div>

        </div>

        <div className={`flex items-center gap-3 ${isBuscadorOpen ? "flex-1" : ""}`}>
          <Buscador
            isOpen={isBuscadorOpen}
            onOpen={() => setIsBuscadorOpen(true)}
            onClose={() => setIsBuscadorOpen(false)}
          />
          <a
            href="https://www.instagram.com/nyg_iluminacionmaldonado/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className={`shrink-0 text-white transition hover:text-amber-500 ${
              isBuscadorOpen
                ? "pointer-events-none w-0 overflow-hidden opacity-0"
                : "opacity-100"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={20}
              height={20}
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
          <Link
            href="/productos"
            className={`rounded-full bg-[#F97316] px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-orange-500/30 ring-1 ring-orange-300/20 transition hover:bg-orange-400 hover:shadow-orange-500/40 ${
              isBuscadorOpen
                ? "pointer-events-none w-0 overflow-hidden px-0 py-0 opacity-0"
                : "opacity-100"
            }`}
          >
            Ver productos
          </Link>
        </div>
        </div>
      </nav>
    </header>
  );
}

