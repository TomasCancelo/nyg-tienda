import type { MetadataRoute } from "next";
import { getCategorias, getMarcas, getProductos, subarbol } from "../lib/catalogo";
import { categoriaUrl, marcaUrl, productoUrl, SITE_URL } from "../lib/slug";

// Se arma solo desde la base y se renueva cada hora
export const revalidate = 3600;

const paginasFijas = ["", "/productos", "/contacto", "/nosotros", "/sucursales"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fijas: MetadataRoute.Sitemap = paginasFijas.map((ruta) => ({
    url: `${SITE_URL}${ruta}`,
    changeFrequency: "weekly",
    priority: ruta === "" ? 1 : 0.8,
  }));

  try {
    const [productos, categorias, marcas] = await Promise.all([
      getProductos(),
      getCategorias(),
      getMarcas(),
    ]);

    // Solo categorías y marcas que tienen productos (las vacías no le sirven a Google)
    const categoriasConProductos = categorias.filter((c) => {
      const ids = subarbol(c.id, categorias);
      return productos.some((p) => p.categoria_id != null && ids.has(p.categoria_id));
    });
    const marcasConProductos = marcas.filter((m) =>
      productos.some((p) => p.marca_id === m.id),
    );

    return [
      ...fijas,
      ...categoriasConProductos.map((c) => ({
        url: `${SITE_URL}${categoriaUrl(c)}`,
        changeFrequency: "weekly" as const,
        priority: c.parent_id == null ? 0.8 : 0.7,
      })),
      ...marcasConProductos.map((m) => ({
        url: `${SITE_URL}${marcaUrl(m)}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...productos.map((p) => ({
        url: `${SITE_URL}${productoUrl(p)}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Si la base no responde, al menos se publican las páginas fijas
    return fijas;
  }
}
