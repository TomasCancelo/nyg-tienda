"use client";

// Vitrina de plaquetas Atenea Clásica y Plus (Molveno) en la homepage.
// Las imágenes de /public/atenea/ son recortes sin fondo de las fotos de molveno.com.uy,
// así las plaquetas quedan "colgadas" sobre la pared del panel.

import Image from "next/image";
import Link from "next/link";
import { useRef, type PointerEvent } from "react";
import { ArrowRight } from "lucide-react";

const PLAQUETAS = [
  {
    src: "/atenea/plus-blanca-3.webp",
    linea: "Plus",
    color: "Blanca",
    modulos: "3 módulos",
  },
  {
    src: "/atenea/blanca-3.webp",
    linea: "Clásica",
    color: "Blanca",
    modulos: "3 módulos",
  },
  {
    src: "/atenea/plata-mate-3.webp",
    linea: "Clásica",
    color: "Plata mate",
    modulos: "3 módulos",
  },
  {
    src: "/atenea/acero-mate-3.webp",
    linea: "Clásica",
    color: "Acero mate",
    modulos: "3 módulos",
  },
  {
    src: "/atenea/blanca-2.webp",
    linea: "Clásica",
    color: "Blanca",
    modulos: "2 módulos",
  },
];

// Inclinación máxima (grados) cuando el mouse está en el borde de la plaqueta
const TILT = 9;

function Plaqueta({ src, linea, color, modulos }: (typeof PLAQUETAS)[number]) {
  const ref = useRef<HTMLDivElement>(null);

  const mover = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty("--ry", `${(x * TILT * 2).toFixed(2)}deg`);
    ref.current.style.setProperty("--rx", `${(-y * TILT * 2).toFixed(2)}deg`);
  };

  const soltar = () => {
    ref.current?.style.setProperty("--ry", "0deg");
    ref.current?.style.setProperty("--rx", "0deg");
  };

  return (
    <figure className="plaqueta-atenea flex w-[31vw] max-w-[168px] shrink-0 snap-center flex-col items-center gap-4 sm:w-auto sm:max-w-[168px] sm:flex-1">
      {/* Caja con la proporción de la plaqueta más alta (Plus), así los textos quedan alineados */}
      <div className="flex aspect-[352/545] w-full items-center">
        <div
          ref={ref}
          onPointerMove={mover}
          onPointerLeave={soltar}
          className="plaqueta-atenea__pieza relative w-full"
        >
          <Image
            src={src}
            alt={`Plaqueta Atenea ${linea} ${color.toLowerCase()} de ${modulos}`}
            width={350}
            height={522}
            sizes="(min-width: 1024px) 168px, (min-width: 640px) 18vw, 31vw"
            className="plaqueta-atenea__img h-auto w-full"
          />
          {/* Brillo que recorre la plaqueta, recortado con su propia silueta */}
          <span
            aria-hidden
            className="plaqueta-atenea__brillo pointer-events-none absolute inset-0"
            style={{ maskImage: `url(${src})`, WebkitMaskImage: `url(${src})` }}
          />
        </div>
      </div>
      <figcaption className="text-center leading-tight">
        <span className="block text-sm font-semibold text-zinc-900">
          {linea === "Plus" ? `Plus ${color.toLowerCase()}` : color}
        </span>
        <span className="block text-xs text-zinc-600">{modulos}</span>
      </figcaption>
    </figure>
  );
}

export default function PlaquetasAtenea() {
  return (
    <section
      aria-labelledby="plaquetas-atenea"
      className="mx-auto w-full max-w-6xl px-4 md:px-6"
    >
      <div className="pared-atenea overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-4 px-6 pt-8 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:pt-10">
          <div>
            <h2
              id="plaquetas-atenea"
              className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl"
            >
              Plaquetas <span className="text-orange-700">Atenea</span>
            </h2>
            <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-zinc-700 sm:text-base">
              Atenea Clásica en blanco, plata y acero mate, y Atenea Plus. De 1
              a 3 módulos.
            </p>
          </div>
          <Image
            src="/banner/logo-molveno.png"
            alt="Molveno"
            width={140}
            height={65}
            className="h-9 w-auto self-start object-contain mix-blend-multiply sm:self-auto"
          />
        </div>

        <div className="plaquetas-atenea-fila -mb-2 flex snap-x sm:justify-center snap-mandatory overflow-x-auto px-6 pb-10 pt-12 [scrollbar-width:none] gap-5 sm:gap-8 sm:overflow-visible sm:px-10 sm:pt-14 lg:gap-12 lg:px-16 [&::-webkit-scrollbar]:hidden">
          {PLAQUETAS.map((p) => (
            <Plaqueta key={p.src} {...p} />
          ))}
        </div>

        <div className="flex justify-center px-6 pb-10 sm:pb-12">
          <Link
            href="/productos?marca_id=12"
            className="group inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#F97316] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ebe7e0]"
          >
            Ver más plaquetas
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
