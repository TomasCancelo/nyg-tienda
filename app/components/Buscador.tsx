"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ProductoBusqueda = {
  id: number;
  nombre: string;
  precio_costo: number | null;
  multiplicador_venta: number | null;
  imagen_url: string | null;
  categoria_id: number | null;
};

type BuscadorProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export default function Buscador({ isOpen, onOpen, onClose }: BuscadorProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);

  const cerrarBuscador = () => {
    onClose();
    setQuery("");
    setResultados([]);
    setLoading(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        cerrarBuscador();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cerrarBuscador();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  });

  useEffect(() => {
    const texto = query.trim();
    if (!isOpen || texto.length < 2) {
      setResultados([]);
      setLoading(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio_costo, multiplicador_venta, imagen_url, categoria_id")
        .ilike("nombre", `%${texto}%`)
        .limit(6);

      if (error) {
        console.error("Error buscando productos:", error.message);
        setResultados([]);
      } else {
        setResultados((data ?? []) as ProductoBusqueda[]);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, isOpen]);

  const handleSubmit = () => {
    const texto = query.trim();
    if (!texto) return;
    cerrarBuscador();
    router.push(`/productos?q=${encodeURIComponent(texto)}`);
  };

  return (
    <div
      ref={wrapperRef}
      className={isOpen ? "relative w-full max-w-2xl" : "relative"}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-hidden={isOpen}
        tabIndex={isOpen ? -1 : 0}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-amber-500/60 hover:text-amber-400"
        aria-label="Abrir buscador"
        style={isOpen ? { display: "none" } : undefined}
      >
        <Search className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          <div className="flex w-full items-center gap-3 border-b border-gray-600 bg-[#0a0a0a] py-2">
            <Search className="h-5 w-5 shrink-0 text-amber-500" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder="Buscar productos..."
              className="w-full bg-transparent text-lg text-white outline-none placeholder:text-zinc-500"
            />
            <button
              type="button"
              onClick={cerrarBuscador}
              className="rounded p-1 text-zinc-400 transition hover:bg-gray-800 hover:text-white"
              aria-label="Cerrar buscador"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {query.trim().length >= 2 && (
            <div className="absolute right-0 top-full z-40 mt-2 w-full overflow-hidden border border-gray-700 bg-[#0a0a0a] shadow-2xl shadow-black/70">
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <p className="px-4 py-3 text-sm text-zinc-400">Buscando...</p>
                ) : resultados.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-zinc-400">Sin resultados</p>
                ) : (
                  resultados.map((producto) => (
                    <Link
                      key={producto.id}
                      href={`/productos/${producto.id}`}
                      onClick={cerrarBuscador}
                      className="flex items-center gap-3 border-b border-gray-800 px-4 py-3 transition hover:bg-gray-800"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-gray-900">
                        {producto.imagen_url ? (
                          <img
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded bg-gray-700" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {producto.nombre}
                        </p>
                        <p className="text-xs font-semibold text-amber-400">-</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <Link
                href={`/productos?q=${encodeURIComponent(query.trim())}`}
                onClick={cerrarBuscador}
                className="block border-t border-gray-700 px-4 py-3 text-sm font-semibold text-amber-500 transition hover:bg-gray-800"
              >
                Ver todos los resultados para "{query.trim()}"
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
