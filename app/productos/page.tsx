import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string | null;
};

async function getProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, descripcion, precio, imagen_url")
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Producto[];
}

export default async function ProductosPage() {
  const productos = await getProductos();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-50">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:px-6 md:py-14">

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
              NYG - Materiales electricos
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Catalogo de productos
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Todos nuestros productos disponibles. Consulta por stock y variantes.
            </p>
          </div>
          <a
            href="/#contacto"
            className="rounded-full border border-orange-500/30 px-4 py-2 text-xs font-medium text-orange-200 transition hover:border-orange-500/60 hover:bg-orange-500/10"
          >
            Pedir cotizacion
          </a>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((product) => (
            <article
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/40 transition hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-orange-500/10"
            >
              <div className="relative h-44 w-full overflow-hidden bg-white">
                {product.imagen_url ? (
                  <img
                    src={product.imagen_url}
                    alt={product.nombre}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-900 px-4 text-center text-sm font-semibold text-zinc-100">
                    {product.nombre}
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-orange-200 ring-1 ring-orange-500/20">
                  Disponible
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight sm:text-base">
                    <Link
                      href={`/productos/${product.id}`}
                      className="transition hover:text-[#F97316]"
                    >
                      {product.nombre}
                    </Link>
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-300 sm:text-sm">
                    {product.descripcion}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-base font-semibold text-orange-200">
                    {new Intl.NumberFormat("es-UY", {
                      style: "currency",
                      currency: "UYU",
                      maximumFractionDigits: 0,
                    }).format(product.precio)}
                  </p>
                  <Link
                    href={`/productos/${product.id}`}
                    className="rounded-full bg-[#F97316] px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-orange-400"
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

      </main>

      <footer className="border-t border-white/10 bg-black/30 py-6 text-xs text-zinc-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between md:px-6">
          <p>2025 NYG. Todos los derechos reservados.</p>
          <p className="text-zinc-500">Materiales electricos - Uruguay</p>
        </div>
      </footer>
    </div>
  );
}
