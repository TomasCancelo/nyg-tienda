import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string | null;
};

function formatUYU(price: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId)) notFound();

  const { data: producto, error: productoError } = await supabase
    .from("productos")
    .select("id, nombre, descripcion, precio, imagen_url")
    .eq("id", productId)
    .maybeSingle();

  if (productoError) {
    throw new Error(productoError.message);
  }

  if (!producto) notFound();

  const { data: relacionados, error: relacionadosError } = await supabase
    .from("productos")
    .select("id, nombre, descripcion, precio, imagen_url")
    .neq("id", productId)
    .order("id", { ascending: true })
    .limit(3);

  if (relacionadosError) {
    throw new Error(relacionadosError.message);
  }

  const whatsappMessage = `Hola, quiero consultar por: ${producto.nombre}`;
  const whatsappUrl = `https://wa.me/59899000000?text=${encodeURIComponent(
    whatsappMessage,
  )}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-50">
      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10 md:px-6 md:py-14">
        <section className="grid gap-8 md:grid-cols-[1.25fr,1fr] md:items-start">
          {/* Foto / placeholder */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-orange-500/15 via-white/5 to-transparent p-6">
            {producto.imagen_url ? (
              <div className="min-h-[500px] w-full overflow-hidden rounded-2xl bg-white">
                <img
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex min-h-[500px] w-full items-center justify-center rounded-2xl bg-zinc-900 text-base font-semibold text-zinc-200">
                {producto.nombre}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
              NYG • Materiales eléctricos
            </p>
            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {producto.nombre}
            </h1>
            <p className="mt-3 text-2xl font-semibold text-orange-200">
              {formatUYU(producto.precio)}
            </p>
            <p className="mt-3 max-w-prose text-sm text-zinc-300 sm:text-base">
              {producto.descripcion}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#F97316] px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-orange-500/25 transition hover:bg-orange-400"
              >
                Consultar por WhatsApp
              </a>
              <Link
                href="/#productos"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-orange-500/40 hover:bg-white/5"
              >
                Seguir viendo productos
              </Link>
            </div>
          </div>
        </section>

        {/* Relacionados */}
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                Productos relacionados
              </h2>
              <p className="mt-1 text-sm text-zinc-300">
                Otras opciones dentro de la misma línea.
              </p>
            </div>
            <Link
              href="/#productos"
              className="text-sm font-semibold text-orange-200 hover:text-[#F97316]"
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(relacionados ?? []).map((p) => (
              <article
                key={p.id}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/40 transition hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-orange-500/10"
              >
                <div className="h-40 w-full overflow-hidden bg-white">
                  {p.imagen_url ? (
                    <img
                      src={p.imagen_url}
                      alt={p.nombre}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-900 px-4 text-center text-sm font-semibold text-zinc-100">
                      {p.nombre}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold tracking-tight">
                    <Link
                      href={`/productos/${p.id}`}
                      className="transition hover:text-[#F97316]"
                    >
                      {p.nombre}
                    </Link>
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-300">
                    {p.descripcion}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-base font-semibold text-orange-200">
                      {formatUYU(p.precio)}
                    </p>
                    <Link
                      href={`/productos/${p.id}`}
                      className="rounded-full bg-[#F97316] px-4 py-2 text-xs font-semibold text-black transition hover:bg-orange-400"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

