// Direcciones legibles para productos, categorías y marcas.
// Formato: "<id>-<nombre-sin-tildes>", por ejemplo /productos/743-plaqueta-atenea-plus-3-mod.
// Para buscar en la base solo se usa el número del principio, así que si cambia
// el nombre en el admin la dirección vieja sigue funcionando (redirige a la nueva).

export const SITE_URL = "https://nygmaterialeselectricos.com.uy";

/** "Plaqueta Atenea Plus 3 Mod" → "plaqueta-atenea-plus-3-mod" */
export function slugify(texto: string): string {
  const base = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base.length <= 80) return base;
  // Corta en el último guion antes de 80 caracteres para no partir palabras
  const corte = base.slice(0, 80);
  return corte.slice(0, corte.lastIndexOf("-")) || corte;
}

/** Parte de la dirección después de /productos/, /categorias/ o /marcas/. */
export function slugConId(id: number, nombre: string): string {
  const s = slugify(nombre);
  return s ? `${id}-${s}` : String(id);
}

/** "743-plaqueta-atenea" → 743 (o null si no empieza con un número). */
export function idDesdeSlug(slug: string): number | null {
  const m = /^(\d+)(?:-|$)/.exec(decodeURIComponent(slug));
  return m ? Number(m[1]) : null;
}

export const productoUrl = (p: { id: number; nombre: string }) =>
  `/productos/${slugConId(p.id, p.nombre)}`;

export const categoriaUrl = (c: { id: number; nombre: string }) =>
  `/categorias/${slugConId(c.id, c.nombre)}`;

export const marcaUrl = (m: { id: number; nombre: string }) =>
  `/marcas/${slugConId(m.id, m.nombre)}`;
