import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CatalogoCliente from "../../productos/CatalogoCliente";
import {
  getCategorias,
  getMarcas,
  getProductos,
  primeraFoto,
} from "../../../lib/catalogo";
import { idDesdeSlug, marcaUrl, SITE_URL, slugConId } from "../../../lib/slug";

// Página guardada que se renueva sola cada 5 minutos
export const revalidate = 300;

// Las páginas se arman la primera vez que alguien (o Google) las visita
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

async function datosDeMarca(slug: string) {
  const id = idDesdeSlug(slug);
  if (id == null) return null;
  const [categorias, marcas, productos] = await Promise.all([
    getCategorias(),
    getMarcas(),
    getProductos(),
  ]);
  const marca = marcas.find((m) => m.id === id);
  if (!marca) return null;
  const propios = productos.filter((p) => p.marca_id === marca.id);
  return { marca, categorias, marcas, productos, propios };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const datos = await datosDeMarca(slug);
  if (!datos) return {};
  const { marca, propios } = datos;
  const titulo = `${marca.nombre} | N&G Maldonado`;
  const descripcion =
    `Productos ${marca.nombre} en N&G Materiales Eléctricos, Maldonado: ` +
    `${propios.length} ${propios.length === 1 ? "producto" : "productos"}. ` +
    "Consultá precio y stock por WhatsApp. Envíos a todo Uruguay.";
  const url = `${SITE_URL}${marcaUrl(marca)}`;
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
      ...(foto ? { images: [{ url: foto, alt: marca.nombre }] } : {}),
    },
  };
}

export default async function MarcaPage({ params }: Props) {
  const { slug } = await params;
  const datos = await datosDeMarca(slug);
  if (!datos) notFound();
  const { marca, categorias, marcas, productos } = datos;

  // Si el nombre cambió (o falta en la dirección), lleva a la dirección correcta
  if (decodeURIComponent(slug) !== slugConId(marca.id, marca.nombre)) {
    permanentRedirect(marcaUrl(marca));
  }

  const migas = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Productos", item: `${SITE_URL}/productos` },
      { "@type": "ListItem", position: 3, name: marca.nombre, item: `${SITE_URL}${marcaUrl(marca)}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(migas) }}
      />
      <CatalogoCliente
        key={marca.id}
        productos={productos}
        categorias={categorias}
        marcas={marcas}
        titulo={marca.nombre}
        fijo={{ tipo: "marca", id: marca.id }}
      />
    </>
  );
}
