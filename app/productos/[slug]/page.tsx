import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import AgregarConsultaButton from "../../components/AgregarConsultaButton";
import {
  caminoCategoria,
  getCategorias,
  getMarcas,
  getProducto,
  getProductos,
} from "../../../lib/catalogo";
import {
  categoriaUrl,
  idDesdeSlug,
  marcaUrl,
  productoUrl,
  SITE_URL,
  slugConId,
} from "../../../lib/slug";

// Página guardada que se renueva sola cada 5 minutos
export const revalidate = 300;

// Cada producto se arma la primera vez que alguien (o Google) lo visita
export async function generateStaticParams() {
  return [];
}

const WHATSAPP_NUMBER = "59896077602";

type Props = { params: Promise<{ slug: string }> };

async function datosDeProducto(slug: string) {
  const id = idDesdeSlug(slug);
  if (id == null) return null;
  const producto = await getProducto(id);
  if (!producto) return null;
  const [categorias, marcas, productos] = await Promise.all([
    getCategorias(),
    getMarcas(),
    getProductos(),
  ]);
  const marca = marcas.find((m) => m.id === producto.marca_id) ?? null;
  const camino =
    producto.categoria_id != null
      ? caminoCategoria(producto.categoria_id, categorias)
      : [];
  const nombreMarca = (marcaId: number | null) =>
    marcas.find((m) => m.id === marcaId)?.nombre ?? null;

  // Relacionados: otros 4 productos de la misma categoría
  const relacionados = productos
    .filter(
      (p) =>
        p.id !== producto.id &&
        (producto.categoria_id == null || p.categoria_id === producto.categoria_id),
    )
    .sort((a, b) => a.id - b.id)
    .slice(0, 4)
    .map((p) => ({ ...p, marcaNombre: nombreMarca(p.marca_id) }));

  return { producto, marca, camino, relacionados };
}

/** Descripción para Google y WhatsApp: la del admin si existe, si no una armada. */
function descripcionDe(
  producto: { nombre: string; descripcion: string | null; codigo: string | null },
  marca: string | null,
  categoria: string | null,
) {
  const propia = producto.descripcion?.replace(/\s+/g, " ").trim();
  if (propia && propia.length >= 40) {
    return propia.length > 160 ? `${propia.slice(0, 157).trimEnd()}…` : propia;
  }
  // No repetir la marca si ya está en el nombre ("Plaqueta Atenea..." + "Atenea")
  const sinTildes = (t: string) =>
    t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const agregarMarca = marca && !sinTildes(producto.nombre).includes(sinTildes(marca));
  return [
    `${producto.nombre}${agregarMarca ? ` ${marca}` : ""} en N&G Materiales Eléctricos, Maldonado.`,
    categoria ? `Categoría: ${categoria}.` : "",
    producto.codigo ? `Código ${producto.codigo}.` : "",
    "Consultá precio y stock por WhatsApp. Envíos a todo Uruguay.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const datos = await datosDeProducto(slug);
  if (!datos) return {};
  const { producto, marca, camino } = datos;
  const titulo = `${producto.nombre} | N&G Maldonado`;
  const descripcion = descripcionDe(
    producto,
    marca?.nombre ?? null,
    camino.at(-1)?.nombre ?? null,
  );
  const url = `${SITE_URL}${productoUrl(producto)}`;
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: url },
    openGraph: {
      title: titulo,
      description: descripcion,
      url,
      type: "website",
      locale: "es_UY",
      ...(producto.imagen_url
        ? { images: [{ url: producto.imagen_url, alt: producto.nombre }] }
        : {}),
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;
  const datos = await datosDeProducto(slug);
  if (!datos) notFound();
  const { producto, marca, camino, relacionados } = datos;

  // /productos/743 o un nombre viejo → dirección correcta
  if (decodeURIComponent(slug) !== slugConId(producto.id, producto.nombre)) {
    permanentRedirect(productoUrl(producto));
  }

  const categoria = camino.at(-1) ?? null;
  const url = `${SITE_URL}${productoUrl(producto)}`;

  // Datos para Google: qué producto es, de qué marca y en qué categoría
  const datosEstructurados = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: producto.nombre,
      url,
      ...(producto.imagen_url ? { image: producto.imagen_url } : {}),
      ...(producto.codigo ? { sku: producto.codigo } : {}),
      description: descripcionDe(producto, marca?.nombre ?? null, categoria?.nombre ?? null),
      ...(marca ? { brand: { "@type": "Brand", name: marca.nombre } } : {}),
      ...(categoria ? { category: camino.map((c) => c.nombre).join(" > ") } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Productos", item: `${SITE_URL}/productos` },
        ...camino.map((c, i) => ({
          "@type": "ListItem",
          position: i + 3,
          name: c.nombre,
          item: `${SITE_URL}${categoriaUrl(c)}`,
        })),
        { "@type": "ListItem", position: camino.length + 3, name: producto.nombre, item: url },
      ],
    },
  ];

  const whatsappMessage = `Hola, quiero consultar por: ${producto.nombre}`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    whatsappMessage,
  )}`;

  return (
    <div className="min-h-screen bg-[#faf9f7] text-zinc-900">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
        />
        <nav className="text-xs text-zinc-600 sm:text-sm">
          <Link href="/productos" className="transition hover:text-orange-600">
            Productos
          </Link>
          <span className="mx-2 text-gray-600">&gt;</span>
          {categoria ? (
            <Link href={categoriaUrl(categoria)} className="transition hover:text-orange-600">
              {categoria.nombre}
            </Link>
          ) : (
            <span>Sin categoría</span>
          )}
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
              {marca ? (
                <Link href={marcaUrl(marca)} className="transition hover:text-orange-800">
                  {marca.nombre}
                </Link>
              ) : (
                "NYG"
              )}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl">
              {producto.nombre}
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Código: {producto.codigo ?? "Sin código"}
            </p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                producto.disponible === false
                  ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"
                  : "bg-emerald-100 text-emerald-300 ring-1 ring-emerald-500/30"
              }`}
            >
              {producto.disponible === false ? "Sin stock" : "En stock"}
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
                    codigo: producto.codigo,
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
            {relacionados.map((p) => (
              <article
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-amber-500/50"
              >
                <Link href={productoUrl(p)} className="block">
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
                      {p.marcaNombre ?? "NYG"}
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

