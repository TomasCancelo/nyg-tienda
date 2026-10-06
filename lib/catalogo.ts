// Lectura del catálogo desde el servidor (solo lectura, no modifica la base).
// Las consultas se guardan 5 minutos: así las páginas cargan rápido, Google las ve
// completas y los cambios hechos en el admin aparecen solos como mucho 5 minutos después.

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

export const REVALIDAR_SEGUNDOS = 300;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const db = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: {
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        next: { revalidate: REVALIDAR_SEGUNDOS, tags: ["catalogo"] },
      }),
  },
});

export type Categoria = { id: number; nombre: string; parent_id: number | null };
export type Marca = { id: number; nombre: string };
export type ProductoLista = {
  id: number;
  nombre: string;
  codigo: string | null;
  imagen_url: string | null;
  disponible: boolean;
  destacado: boolean | null;
  categoria_id: number | null;
  marca_id: number | null;
};
export type ProductoDetalle = ProductoLista & {
  descripcion: string | null;
};

export const getCategorias = cache(async (): Promise<Categoria[]> => {
  const { data, error } = await db
    .from("categorias")
    .select("id, nombre, parent_id")
    .order("nombre", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Categoria[];
});

export const getMarcas = cache(async (): Promise<Marca[]> => {
  const { data, error } = await db
    .from("marcas")
    .select("id, nombre")
    .order("nombre", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Marca[];
});

export const getProductos = cache(async (): Promise<ProductoLista[]> => {
  const { data, error } = await db
    .from("productos")
    .select(
      "id, nombre, codigo, imagen_url, disponible, destacado, categoria_id, marca_id",
    )
    .order("nombre", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductoLista[];
});

export const getProducto = cache(
  async (id: number): Promise<ProductoDetalle | null> => {
    const { data, error } = await db
      .from("productos")
      .select(
        "id, nombre, descripcion, codigo, imagen_url, disponible, destacado, categoria_id, marca_id",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as ProductoDetalle | null;
  },
);

/** Hijos directos de cada categoría. */
export function hijosPorCategoria(cats: Categoria[]): Map<number, number[]> {
  const m = new Map<number, number[]>();
  for (const c of cats) {
    if (c.parent_id == null) continue;
    m.set(c.parent_id, [...(m.get(c.parent_id) ?? []), c.id]);
  }
  return m;
}

/** La categoría y todas sus subcategorías. */
export function subarbol(id: number, cats: Categoria[]): Set<number> {
  const hijos = hijosPorCategoria(cats);
  const out = new Set<number>();
  const cola = [id];
  while (cola.length) {
    const actual = cola.shift()!;
    if (out.has(actual)) continue;
    out.add(actual);
    cola.push(...(hijos.get(actual) ?? []));
  }
  return out;
}

/** Camino desde la categoría principal hasta esta (para las "migas de pan"). */
export function caminoCategoria(id: number, cats: Categoria[]): Categoria[] {
  const porId = new Map(cats.map((c) => [c.id, c]));
  const camino: Categoria[] = [];
  let actual = porId.get(id);
  for (let i = 0; actual && i < 10; i++) {
    camino.unshift(actual);
    actual = actual.parent_id != null ? porId.get(actual.parent_id) : undefined;
  }
  return camino;
}

/** Primera foto disponible entre los productos dados (para la vista previa al compartir). */
export function primeraFoto(productos: ProductoLista[]): string | null {
  return productos.find((p) => p.imagen_url)?.imagen_url ?? null;
}
