 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Categoria = {
  id: number;
  nombre: string;
};

export default function Navbar() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isProductosOpen, setIsProductosOpen] = useState(false);

  useEffect(() => {
    const fetchCategorias = async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre")
        .is("parent_id", null)
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error al cargar categorias principales:", error.message);
        return;
      }

      setCategorias((data ?? []) as Categoria[]);
    };

    fetchCategorias();
  }, []);

  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/10 bg-[#0a0a0a]">
      <nav className="w-full">
        <div className="flex w-full items-center justify-between gap-4 px-6 py-10">
        <Link href="/#inicio" className="flex items-center gap-4">
          <div className="h-[100px] w-[100px] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <img
              src="/logo.png"
              alt="NYG"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="leading-tight">
            <p className="text-3xl font-bold tracking-tight text-white">NYG</p>
            <p className="text-base text-zinc-400">Materiales eléctricos</p>
          </div>
        </Link>

        <div className="hidden items-center gap-10 text-lg font-semibold text-zinc-100 md:flex">
          <Link
            href="/#inicio"
            className="rounded-lg px-2 py-1 transition hover:bg-white/5 hover:text-[#F97316]"
          >
            Inicio
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setIsProductosOpen(true)}
            onMouseLeave={() => setIsProductosOpen(false)}
          >
            <Link
              href="/#productos"
              className="rounded-lg px-2 py-1 transition hover:bg-white/5 hover:text-[#F97316]"
            >
              Productos
            </Link>

            {isProductosOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-orange-500/30 bg-[#111111] shadow-xl shadow-black/60 ring-1 ring-orange-500/20">
                <div className="border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-orange-300">
                  Categorias
                </div>
                <div className="py-2">
                  {categorias.length > 0 ? (
                    categorias.map((categoria) => (
                      <Link
                        key={categoria.id}
                        href={`/productos?categoria_id=${categoria.id}`}
                        className="block px-4 py-2 text-sm text-zinc-100 transition hover:bg-orange-500/10 hover:text-orange-300"
                      >
                        {categoria.nombre}
                      </Link>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-zinc-400">
                      Sin categorias disponibles
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/#contacto"
            className="rounded-lg px-2 py-1 transition hover:bg-white/5 hover:text-[#F97316]"
          >
            Contacto
          </Link>
        </div>

        <Link
          href="/#productos"
          className="rounded-full bg-[#F97316] px-8 py-4 text-lg font-semibold text-black shadow-lg shadow-orange-500/30 ring-1 ring-orange-300/20 transition hover:bg-orange-400 hover:shadow-orange-500/40"
        >
          Ver productos
        </Link>
        </div>
      </nav>
    </header>
  );
}

