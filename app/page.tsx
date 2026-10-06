import { getCategorias, getMarcas, getProductos } from "../lib/catalogo";
import { categoriaUrl, marcaUrl } from "../lib/slug";
import PlaquetasAtenea from "./components/PlaquetasAtenea";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Boxes,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  PackagePlus,
  Phone,
  Search,
  Send,
  Truck,
} from "lucide-react";

type ProductoResumen = {
  id: number;
  categoria_id: number | null;
  marca_id: number | null;
  imagen_url: string | null;
};

type Categoria = { id: number; nombre: string; parent_id: number | null };
type Marca = { id: number; nombre: string };

type CategoriaTile = {
  id: number;
  nombre: string;
  cantidad: number;
  imagen: string | null;
};

type MarcaChip = { id: number; nombre: string; cantidad: number };

// Página guardada que se renueva sola cada 5 minutos
export const revalidate = 300;

const WHATSAPP = "https://wa.me/59896077602";
const MAPS_LINK =
  "https://www.google.com/maps/place/N%26G+Materiales+El%C3%A9ctricos/@-34.9107885,-54.944991,17z/data=!3m1!4b1!4m6!3m5!1s0x95751bb97a1bb0ad:0xb47ce57e9ec9c59d!8m2!3d-34.9107885!4d-54.9424161!16s%2Fg%2F11h8cglpvy";
const MAPS_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3272.8!2d-54.9424161!3d-34.9107885!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95751bb97a1bb0ad%3A0xb47ce57e9ec9c59d!2sN%26G%20Materiales%20El%C3%A9ctricos!5e0!3m2!1ses!2suy!4v1";
const LOCAL_IMAGE =
  "https://thqmpndhlqknwactxcik.supabase.co/storage/v1/object/public/productos/local.PNG";

// Atajos debajo del buscador, a subcategorías con muchos productos
const ATAJOS = [
  { id: 9, nombre: "Lámparas LED" },
  { id: 34, nombre: "Plaquetas y módulos" },
  { id: 15, nombre: "Reflectores" },
  { id: 29, nombre: "Térmicas" },
  { id: 45, nombre: "Spots" },
];

// Foto fija para categorías donde la automática no se luce
// (6 = Electricidad Doméstica: se usa el recorte de la plaqueta Atenea Plus)
const IMAGEN_CATEGORIA: Record<number, string> = {
  6: "/atenea/plus-blanca-3.webp",
};

// Cuántas categorías se muestran en la grilla del inicio
const CANTIDAD_CATEGORIAS = 8;

// La marca "Generica" no se muestra como marca
const MARCAS_OCULTAS = new Set(["generica", "genérica"]);

/** Categorías principales con más productos (contando subcategorías), cada una con una foto. */
async function getResumenCatalogo(): Promise<{
  total: number;
  categorias: CategoriaTile[];
  marcas: MarcaChip[];
  nombreCategoria: Map<number, string>;
}> {
  let productos: ProductoResumen[];
  let cats: Categoria[];
  let marcasRows: Marca[];
  try {
    const [todos, categoriasDb, marcasDb] = await Promise.all([
      getProductos(),
      getCategorias(),
      getMarcas(),
    ]);
    productos = todos
      .filter((p) => p.disponible)
      .sort((a, b) => a.id - b.id);
    cats = categoriasDb;
    marcasRows = marcasDb;
  } catch {
    // Si algo falla, el inicio sigue cargando sin estas secciones
    return { total: 0, categorias: [], marcas: [], nombreCategoria: new Map() };
  }

  const padreDe = new Map<number, number | null>();
  for (const c of cats) padreDe.set(c.id, c.parent_id);
  const raiz = (id: number) => {
    let actual = id;
    for (let i = 0; i < 10; i++) {
      const p = padreDe.get(actual);
      if (p == null) return actual;
      actual = p;
    }
    return actual;
  };

  // Por cada categoría principal: total de productos y, como foto, un producto
  // de su subcategoría con más productos (la más representativa)
  const porRaiz = new Map<number, number>();
  const porHoja = new Map<number, { cantidad: number; imagen: string | null }>();
  const porMarca = new Map<number, number>();
  for (const p of productos) {
    if (p.categoria_id != null) {
      const r = raiz(p.categoria_id);
      porRaiz.set(r, (porRaiz.get(r) ?? 0) + 1);
      const hoja = porHoja.get(p.categoria_id) ?? { cantidad: 0, imagen: null };
      hoja.cantidad += 1;
      if (!hoja.imagen && p.imagen_url) hoja.imagen = p.imagen_url;
      porHoja.set(p.categoria_id, hoja);
    }
    if (p.marca_id != null) {
      porMarca.set(p.marca_id, (porMarca.get(p.marca_id) ?? 0) + 1);
    }
  }
  const imagenDe = (rootId: number) => {
    let mejor: { cantidad: number; imagen: string | null } | null = null;
    for (const [hojaId, hoja] of porHoja) {
      if (!hoja.imagen || raiz(hojaId) !== rootId) continue;
      if (!mejor || hoja.cantidad > mejor.cantidad) mejor = hoja;
    }
    return mejor?.imagen ?? null;
  };

  const categorias = cats
    .filter((c) => c.parent_id == null && (porRaiz.get(c.id) ?? 0) > 0)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      cantidad: porRaiz.get(c.id)!,
      imagen: IMAGEN_CATEGORIA[c.id] ?? imagenDe(c.id),
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, CANTIDAD_CATEGORIAS);

  const marcas = marcasRows
    .filter(
      (m) =>
        (porMarca.get(m.id) ?? 0) > 0 &&
        !MARCAS_OCULTAS.has(m.nombre.trim().toLowerCase()),
    )
    .map((m) => ({ id: m.id, nombre: m.nombre, cantidad: porMarca.get(m.id)! }))
    .sort((a, b) => b.cantidad - a.cantidad);

  return {
    total: productos.length,
    categorias,
    marcas,
    nombreCategoria: new Map(cats.map((c) => [c.id, c.nombre])),
  };
}

function EncabezadoSeccion({
  id,
  titulo,
  bajada,
  link,
}: {
  id: string;
  titulo: string;
  bajada?: string;
  link?: { href: string; texto: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <h2
          id={id}
          className="text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl"
        >
          {titulo}
        </h2>
        {bajada && <p className="mt-1.5 text-sm text-zinc-600">{bajada}</p>}
      </div>
      {link && (
        <Link
          href={link.href}
          className="group inline-flex items-center gap-1.5 rounded text-sm font-semibold text-orange-700 underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
        >
          {link.texto}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const resumen = await getResumenCatalogo();
  // Redondeado hacia abajo para no prometer de más: 678 → "670"
  const totalRedondeado = Math.floor(resumen.total / 10) * 10;

  const beneficios = [
    { icono: Truck, titulo: "Envíos a todo Uruguay", texto: "Coordinamos el envío o retirás en el local" },
    {
      icono: Boxes,
      titulo: totalRedondeado > 0 ? `Más de ${totalRedondeado} productos` : "Stock permanente",
      texto: "Stock permanente y variedad",
    },
    { icono: Banknote, titulo: "Precios en pesos", texto: "Todo en pesos uruguayos" },
    { icono: MessageCircle, titulo: "Atención personalizada", texto: "Te asesoramos por WhatsApp" },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] text-zinc-900">
      <main id="inicio" className="flex flex-col gap-16 pb-16 md:gap-24 md:pb-24">
        {/* Portada: propuesta, buscador y foto del local */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-10 md:px-6 md:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
          <div className="flex flex-col gap-6">
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Todo en{" "}
              <span className="text-orange-600">materiales eléctricos</span>
            </h1>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-zinc-700 sm:text-lg">
              Lámparas, cables, arañas, artefactos y más. Tu tienda de
              materiales eléctricos en Maldonado, Uruguay.
            </p>

            <form action="/productos" method="get" role="search" className="max-w-xl">
              <label htmlFor="buscar-inicio" className="sr-only">
                Buscar productos
              </label>
              <div className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white p-1.5 pl-5 shadow-[0_8px_24px_-16px_rgba(24,24,27,0.35)] transition focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/15">
                <Search className="h-5 w-5 shrink-0 text-zinc-500" aria-hidden />
                <input
                  id="buscar-inicio"
                  name="q"
                  type="search"
                  placeholder="¿Qué estás buscando?"
                  className="min-w-0 flex-1 bg-transparent py-2 text-base text-zinc-900 outline-none placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:hidden"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2"
                >
                  Buscar
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="mr-1 text-zinc-600">Ir directo a:</span>
              {ATAJOS.map((a) => (
                <Link
                  key={a.id}
                  href={categoriaUrl({ id: a.id, nombre: resumen.nombreCategoria.get(a.id) ?? a.nombre })}
                  className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-zinc-800 transition hover:border-orange-500 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                >
                  {a.nombre}
                </Link>
              ))}
            </div>
          </div>

          <figure className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-zinc-200 shadow-[0_30px_60px_-30px_rgba(24,24,27,0.45)]">
              <Image
                src={LOCAL_IMAGE}
                alt="Frente del local de N&G Materiales Eléctricos en Maldonado"
                fill
                priority
                sizes="(min-width: 1024px) 480px, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="absolute -bottom-5 left-4 right-4 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-3 pr-4 shadow-[0_12px_30px_-14px_rgba(24,24,27,0.35)] backdrop-blur sm:left-6 sm:right-auto">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm leading-snug">
                <span className="block font-semibold text-zinc-900">
                  Av. Aparicio Saravia casi Guyunusa
                </span>
                <span className="block text-zinc-600">
                  Maldonado · Lun a Vie 8:00–12:30 y 14:00–18:00
                </span>
              </span>
            </figcaption>
          </figure>
        </section>

        {/* Beneficios */}
        <section aria-label="Por qué comprar en N&G" className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 lg:grid-cols-4">
            {beneficios.map((b) => (
              <li key={b.titulo} className="flex items-start gap-3 bg-white p-4 sm:p-5">
                <b.icono className="mt-0.5 h-6 w-6 shrink-0 text-orange-600" strokeWidth={1.75} aria-hidden />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900 sm:text-base">
                    {b.titulo}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-600 sm:text-sm">{b.texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Plaquetas Atenea - Molveno */}
        <PlaquetasAtenea />

        {/* Categorías */}
        {resumen.categorias.length > 0 && (
          <section aria-labelledby="inicio-categorias" className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <EncabezadoSeccion
              id="inicio-categorias"
              titulo="Comprá por categoría"
              bajada="Encontrá lo que necesitás para tu obra, tu casa o tu negocio."
              link={{ href: "/productos", texto: "Ver todas" }}
            />
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {resumen.categorias.map((c) => (
                <li key={c.id}>
                  <Link
                    href={categoriaUrl(c)}
                    className="inicio-tile group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-white p-4">
                      {c.imagen ? (
                        <img
                          src={c.imagen}
                          alt=""
                          loading="lazy"
                          className="inicio-tile__img h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-300">
                          <Boxes className="h-10 w-10" strokeWidth={1.25} aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="flex items-end justify-between gap-2 border-t border-zinc-100 px-4 py-3">
                      <span className="text-sm font-semibold leading-tight text-zinc-900 group-hover:text-orange-700">
                        {c.nombre}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                        {c.cantidad}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/*
          Carrusel de "Productos destacados": sacado del inicio a pedido, pero guardado
          en app/components/DestacadosCarousel.tsx (muestra los productos marcados como
          "destacado" en el admin). Para volver a ponerlo:
            1. import DestacadosCarousel from "./components/DestacadosCarousel";
            2. Traer los destacados con supabase: from("productos")
               .select("id, nombre, descripcion, precio_costo, multiplicador_venta, imagen_url")
               .eq("destacado", true).eq("disponible", true)
            3. Acá: <DestacadosCarousel productos={productosDestacados} />
          La versión completa está en el commit a5cd920 (app/page.tsx).
        */}

        {/* Cómo comprar */}
        <section aria-labelledby="inicio-como-comprar" className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="rounded-3xl bg-zinc-950 p-6 text-white sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
              <div className="lg:w-80 lg:shrink-0">
                <h2 id="inicio-como-comprar" className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                  Cómo hacer tu pedido
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  Armá tu lista desde la web y te respondemos por WhatsApp con
                  precio y disponibilidad.
                </p>
                <Link
                  href="/productos"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Empezar en el catálogo
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <ol className="grid flex-1 gap-6 sm:grid-cols-3 sm:gap-4">
                {[
                  { icono: PackagePlus, titulo: "Elegí tus productos", texto: "Tocá «Agregar a consulta» en lo que necesites." },
                  { icono: Send, titulo: "Envianos la consulta", texto: "Completá tu nombre y teléfono y se abre WhatsApp con tu lista." },
                  { icono: BadgeCheck, titulo: "Te confirmamos", texto: "Te pasamos precio y stock, y coordinamos retiro o envío." },
                ].map((paso, i) => (
                  <li key={paso.titulo} className="relative flex flex-col gap-3 border-t border-white/15 pt-5">
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F97316] text-sm font-bold tabular-nums text-black">
                        {i + 1}
                      </span>
                      <paso.icono className="h-5 w-5 text-orange-400" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="text-base font-semibold">{paso.titulo}</span>
                    <span className="text-sm leading-relaxed text-zinc-300">{paso.texto}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Marcas */}
        {resumen.marcas.length > 0 && (
          <section aria-labelledby="inicio-marcas" className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <EncabezadoSeccion
              id="inicio-marcas"
              titulo="Marcas que trabajamos"
              bajada="Encontrá productos por marca."
            />
            <ul className="flex flex-wrap gap-3">
              {resumen.marcas.map((m) => (
                <li key={m.id}>
                  <Link
                    href={marcaUrl(m)}
                    className="group flex items-baseline gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-[0_10px_24px_-16px_rgba(234,88,12,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                  >
                    <span className="text-lg font-bold tracking-tight text-zinc-800 group-hover:text-zinc-950">
                      {m.nombre}
                    </span>
                    <span className="text-xs tabular-nums text-zinc-500">
                      {m.cantidad} productos
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Local + texto para buscadores */}
        <section aria-labelledby="inicio-local" className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="grid overflow-hidden rounded-3xl border border-zinc-200 bg-white lg:grid-cols-2">
            <div className="flex flex-col gap-6 p-6 sm:p-10">
              <div>
                <h2 id="inicio-local" className="text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                  Tu tienda de materiales eléctricos en Maldonado
                </h2>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-700 sm:text-base">
                  En N&amp;G contamos con amplio stock de lámparas, cables,
                  arañas, reflectores LED, artefactos solares y todo lo que
                  necesitás en electricidad e iluminación. Precios en pesos
                  uruguayos y envíos a todo Uruguay.
                </p>
              </div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" aria-hidden />
                  <div>
                    <dt className="font-semibold text-zinc-900">Dirección</dt>
                    <dd className="text-zinc-700">Av. Aparicio Saravia casi Guyunusa, Maldonado</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" aria-hidden />
                  <div>
                    <dt className="font-semibold text-zinc-900">Horario</dt>
                    <dd className="text-zinc-700">Lun a Vie 8:00–12:30 y 14:00–18:00</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" aria-hidden />
                  <div>
                    <dt className="font-semibold text-zinc-900">Teléfono</dt>
                    <dd>
                      <a href="tel:42260541" className="text-zinc-700 underline-offset-4 hover:text-orange-700 hover:underline">
                        4226 0541
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" aria-hidden />
                  <div>
                    <dt className="font-semibold text-zinc-900">WhatsApp</dt>
                    <dd>
                      <a href={WHATSAPP} target="_blank" rel="noreferrer" className="text-zinc-700 underline-offset-4 hover:text-orange-700 hover:underline">
                        096 077 602
                      </a>
                    </dd>
                  </div>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap gap-3">
                <a
                  href={MAPS_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
                >
                  <Navigation className="h-4 w-4" aria-hidden />
                  Cómo llegar
                </a>
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:border-green-600 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Escribinos
                </a>
              </div>
            </div>
            <div className="relative min-h-[280px] bg-zinc-100">
              <iframe
                title="Ubicación de N&G Materiales Eléctricos en el mapa"
                src={MAPS_EMBED}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
