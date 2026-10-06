import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import CatalogoCliente from "./CatalogoCliente";
import { getCategorias, getMarcas, getProductos } from "../../lib/catalogo";
import { categoriaUrl, marcaUrl, SITE_URL } from "../../lib/slug";

export const metadata: Metadata = {
  title: { absolute: "Catálogo de productos | N&G Maldonado" },
  description:
    "Catálogo completo de N&G Materiales Eléctricos: lámparas LED, plaquetas y módulos, cables, tableros, canalización y más. Consultá precio y stock por WhatsApp. Envíos a todo Uruguay.",
  alternates: { canonical: `${SITE_URL}/productos` },
  openGraph: {
    title: "Catálogo de productos | N&G Maldonado",
    url: `${SITE_URL}/productos`,
    type: "website",
    locale: "es_UY",
  },
};

type SearchParams = Record<string, string | string[] | undefined>;

const primero = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

/** Un solo id numérico ("9" → 9; "9,10" o "abc" → null). */
function idUnico(v: string | undefined): number | null {
  if (!v || !/^\d+$/.test(v.trim())) return null;
  return Number(v);
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const [productos, categorias, marcas] = await Promise.all([
    getProductos(),
    getCategorias(),
    getMarcas(),
  ]);

  // Links viejos (?categoria_id=9, ?categorias=9, ?marca_id=12) → páginas nuevas.
  // Solo cuando hay una única categoría o marca; con varias se queda en /productos.
  const catId = idUnico(primero(sp.categoria_id) ?? primero(sp.categorias));
  const marId = idUnico(primero(sp.marca_id));
  const resto = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (["categoria_id", "categorias", "marca_id"].includes(k)) continue;
    const valor = primero(v);
    if (valor) resto.set(k, valor);
  }
  const cat = catId != null ? categorias.find((c) => c.id === catId) : undefined;
  const mar = marId != null ? marcas.find((m) => m.id === marId) : undefined;
  if (cat) {
    if (mar) resto.set("marca_id", String(mar.id));
    const qs = resto.toString();
    permanentRedirect(`${categoriaUrl(cat)}${qs ? `?${qs}` : ""}`);
  }
  if (mar && !primero(sp.categoria_id) && !primero(sp.categorias)) {
    const qs = resto.toString();
    permanentRedirect(`${marcaUrl(mar)}${qs ? `?${qs}` : ""}`);
  }

  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const valor = primero(v);
    if (valor) query.set(k, valor);
  }

  return (
    <CatalogoCliente
      productos={productos}
      categorias={categorias}
      marcas={marcas}
      queryInicial={query.toString()}
    />
  );
}
