import type { MetadataRoute } from "next";

const routes = [
  "",
  "/productos",
  "/contacto",
  "/nosotros",
  "/sucursales",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://nygmaterialeselectricos.com.uy";

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
