import { supabase } from "../lib/supabase";
import DestacadosCarousel from "./components/DestacadosCarousel";
import Link from "next/link";

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string | null;
  destacado: boolean | null;
};

async function getProductosDestacados(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, descripcion, precio, imagen_url, destacado")
    .eq("destacado", true)
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Producto[];
}

const categorias = [
  { nombre: "Lamparas y Cintas LED", icono: "💡", slug: "lamparas" },
  { nombre: "Luz Solar", icono: "☀️", slug: "solar" },
  { nombre: "Uso Interior", icono: "🏠", slug: "interior" },
  { nombre: "Accesorios Varios", icono: "🔧", slug: "accesorios" },
];

export default async function Home() {
  const productosDestacados = await getProductosDestacados();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-50">
      <main id="inicio" className="flex flex-col gap-16 py-10 md:py-16">

        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
              Envios a todo Uruguay
              <span className="h-1 w-1 rounded-full bg-[#F97316]" />
              Atencion personalizada
            </span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Todo en{" "}
              <span className="text-[#F97316]">materiales electricos</span>
            </h1>
            <p className="max-w-xl text-balance text-sm text-zinc-300 sm:text-base">
              Lamparas, cables, aranas, artefactos y mas. Enviamos a todo Uruguay.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a href="/productos" className="rounded-full bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400">
                Ver catalogo
              </a>
              <a href="#contacto" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-orange-500/40 hover:bg-white/5">
                Contacto
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F97316]" />
                Stock y variedad
              </span>
              <span>Precios en pesos uruguayos</span>
              <span>Entrega rapida</span>
            </div>
          </div>
        </section>

        {/* Carrusel - ancho completo con overflow hidden */}
        <section className="w-full" style={{ overflow: 'hidden' }}>
          <div className="mx-auto mb-4 max-w-6xl px-4 md:px-6">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
              Productos destacados
            </h2>
          </div>
          <DestacadosCarousel productos={productosDestacados} />
        </section>

        {/* Categorias */}
        <section className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Categorias</h2>
            <p className="mt-2 text-sm text-zinc-400">Encontra lo que estas buscando segun su categoria.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categorias.map((cat) => (
              <Link
                key={cat.slug}
                href={`/productos?categoria=${cat.slug}`}
                className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition duration-200 hover:-translate-y-2 hover:border-orange-500/50 hover:bg-orange-500/10 hover:shadow-lg hover:shadow-orange-500/10"
              >
                <span className="text-4xl">{cat.icono}</span>
                <span className="text-sm font-medium text-zinc-200 group-hover:text-orange-200">{cat.nombre}</span>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
