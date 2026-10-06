import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import AgregarConsultaButton from "../../components/AgregarConsultaButton";

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio_costo: number | null;
  multiplicador_venta: number | null;
  imagen_url: string | null;
};

type ProductoMeta = {
  codigo: string | null;
  disponible: boolean | null;
  categoria_id: number | null;
  marcas: { nombre: string } | null;
};

type Categoria = {
  nombre: string;
};

type ProductoRelacionado = {
  id: number;
  nombre: string;
  precio_costo: number | null;
  multiplicador_venta: number | null;
  imagen_url: string | null;
  marcas: { nombre: string } | null;
};

type ProductoRelacionadoRaw = {
  id: number;
  nombre: string;
  precio_costo: number | null;
  multiplicador_venta: number | null;
  imagen_url: string | null;
  marcas: { nombre: string }[] | null;
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
    .select("id, nombre, descripcion, precio_costo, multiplicador_venta, imagen_url")
    .eq("id", productId)
    .maybeSingle();

  if (productoError) {
    throw new Error(productoError.message);
  }

  if (!producto) notFound();

  const { data: productoMeta, error: metaError } = await supabase
    .from("productos")
    .select("codigo, disponible, categoria_id, marcas ( nombre )")
    .eq("id", productId)
    .maybeSingle();

  if (metaError) {
    throw new Error(metaError.message);
  }

  const meta = (productoMeta ?? null) as ProductoMeta | null;

  let categoriaNombre = "Sin categoría";
  if (meta?.categoria_id) {
    const { data: categoriaData, error: categoriaError } = await supabase
      .from("categorias")
      .select("nombre")
      .eq("id", meta.categoria_id)
      .maybeSingle();

    if (categoriaError) {
      throw new Error(categoriaError.message);
    }

    if (categoriaData) {
      categoriaNombre = (categoriaData as Categoria).nombre;
    }
  }

  let relacionadosQuery = supabase
    .from("productos")
    .select("id, nombre, precio_costo, multiplicador_venta, imagen_url, marcas ( nombre )")
    .neq("id", productId)
    .order("id", { ascending: true });

  if (meta?.categoria_id) {
    relacionadosQuery = relacionadosQuery.eq("categoria_id", meta.categoria_id);
  }

  const { data: relacionados, error: relacionadosError } =
    await relacionadosQuery.limit(4);

  if (relacionadosError) {
    throw new Error(relacionadosError.message);
  }

  const relacionadosNormalizados: ProductoRelacionado[] = (
    (relacionados ?? []) as ProductoRelacionadoRaw[]
  ).map((p) => ({
    ...p,
    marcas: Array.isArray(p.marcas) ? (p.marcas[0] ?? null) : null,
  }));

  const whatsappMessage = `Hola, quiero consultar por: ${producto.nombre}`;
  const whatsappUrl = `https://wa.me/59899000000?text=${encodeURIComponent(
    whatsappMessage,
  )}`;

  return (
    <div className="min-h-screen bg-[#faf9f7] text-zinc-900">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
        <nav className="text-xs text-zinc-600 sm:text-sm">
          <Link href="/productos" className="transition hover:text-orange-600">
            Productos
          </Link>
          <span className="mx-2 text-gray-600">&gt;</span>
          <span>{categoriaNombre}</span>
          <span className="mx-2 text-gray-600">&gt;</span>
          <span className="text-zinc-700">{producto.nombre}</span>
        </nav>

        <section className="grid gap-8 md:grid-cols-5 md:items-start">
          <div className="md:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4">
              {producto.imagen_url ? (
                <div className="h-[500px] w-full overflow-hidden rounded-xl bg-white">
                  <img
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-[500px] w-full items-center justify-center rounded-xl bg-gray-950 text-6xl text-orange-600">
                  ⚡
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
              {meta?.marcas?.nombre ?? "NYG"}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl">
              {producto.nombre}
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Código: {meta?.codigo ?? "Sin código"}
            </p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                meta?.disponible === false
                  ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"
                  : "bg-emerald-100 text-emerald-300 ring-1 ring-emerald-500/30"
              }`}
            >
              {meta?.disponible === false ? "Sin stock" : "En stock"}
            </span>

            <div className="mt-6 border-t border-zinc-200 pt-6">
              <p className="text-sm leading-relaxed text-zinc-700">
                {producto.descripcion}
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                >
                  📱 Consultar por WhatsApp
                </a>
                <AgregarConsultaButton
                  className="w-full rounded-xl py-3 text-sm"
                  producto={{
                    id: producto.id,
                    nombre: producto.nombre,
                    codigo: meta?.codigo,
                    imagen_url: producto.imagen_url,
                  }}
                />
              </div>
              <Link
                href="/productos"
                className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-transparent px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:border-amber-500 hover:text-orange-600"
              >
                Ver catálogo completo
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-xl font-semibold text-zinc-900">
            Productos relacionados
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {relacionadosNormalizados.map((p) => (
              <article
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-amber-500/50"
              >
                <Link href={`/productos/${p.id}`} className="block">
                  <div className="h-36 w-full overflow-hidden border-b border-zinc-200 bg-white">
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl text-orange-600">
                        ⚡
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">
                      {p.marcas?.nombre ?? "NYG"}
                    </p>
                    <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900">
                      {p.nombre}
                    </h3>
                    {/* El precio no se muestra en la vista pública */}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

