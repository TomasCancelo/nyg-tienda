import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CatalogoCliente from "../../productos/CatalogoCliente";
import {
  caminoCategoria,
  getCategorias,
  getMarcas,
  getProductos,
  primeraFoto,
  subarbol,
} from "../../../lib/catalogo";
import { categoriaUrl, idDesdeSlug, SITE_URL, slugConId } from "../../../lib/slug";

// Página guardada que se renueva sola cada 5 minutos
export const revalidate = 300;

// Las páginas se arman la primera vez que alguien (o Google) las visita
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

async function datosDeCategoria(slug: string) {
  const id = idDesdeSlug(slug);
  if (id == null) return null;
  const [categorias, marcas, productos] = await Promise.all([
    getCategorias(),
    getMarcas(),
    getProductos(),
  ]);
  const categoria = categorias.find((c) => c.id === id);
  if (!categoria) return null;
  const ids = subarbol(categoria.id, categorias);
  const propios = productos.filter(
    (p) => p.categoria_id != null && ids.has(p.categoria_id),
  );
  return { categoria, categorias, marcas, productos, propios };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const datos = await datosDeCategoria(slug);
  if (!datos) return {};
  const { categoria, categorias, propios } = datos;
  const titulo = `${categoria.nombre} | N&G Maldonado`;
  const padre = caminoCategoria(categoria.id, categorias).at(-2);
  const descripcion =
    `${categoria.nombre}${padre ? ` (${padre.nombre})` : ""} en N&G Materiales Eléctricos, Maldonado: ` +
    `${propios.length} ${propios.length === 1 ? "producto" : "productos"}. ` +
    "Consultá precio y stock por WhatsApp. Envíos a todo Uruguay.";
  const url = `${SITE_URL}${categoriaUrl(categoria)}`;
  const foto = primeraFoto(propios);
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
      ...(foto ? { images: [{ url: foto, alt: categoria.nombre }] } : {}),
    },
  };
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const datos = await datosDeCategoria(slug);
  if (!datos) notFound();
  const { categoria, categorias, marcas, productos } = datos;

  // Si el nombre cambió (o falta en la dirección), lleva a la dirección correcta
  if (decodeURIComponent(slug) !== slugConId(categoria.id, categoria.nombre)) {
    permanentRedirect(categoriaUrl(categoria));
  }

  const camino = caminoCategoria(categoria.id, categorias);
  const migas = {
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
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(migas) }}
      />
      <CatalogoCliente
        key={categoria.id}
        productos={productos}
        categorias={categorias}
        marcas={marcas}
        titulo={categoria.nombre}
        fijo={{ tipo: "categoria", id: categoria.id }}
      />
    </>
  );
}
