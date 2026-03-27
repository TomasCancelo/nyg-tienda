'use client';

import Link from "next/link";
import { useEffect, useRef } from "react";

type ProductoDestacado = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string | null;
};

type Props = {
  productos: ProductoDestacado[];
};

export default function DestacadosCarousel({ productos }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);

  const REPEAT = 6;
  const items = Array.from({ length: REPEAT }, () => productos).flat();
  const SPEED = 0.7;
  const CARD_WIDTH = 300;
  const GAP = 16;

  useEffect(() => {
    const container = trackRef.current;
    if (!container || productos.length === 0) return;

    const oneSetWidth = productos.length * (CARD_WIDTH + GAP);
    container.scrollLeft = oneSetWidth;

    const animate = () => {
      if (container) {
        container.scrollLeft += SPEED;
        if (container.scrollLeft >= oneSetWidth * 2) {
          container.scrollLeft -= oneSetWidth;
        }
        if (container.scrollLeft <= 0) {
          container.scrollLeft += oneSetWidth;
        }
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [productos]);

  const startDrag = (clientX: number) => {
    const container = trackRef.current;
    if (!container) return;
    isDraggingRef.current = true;
    startXRef.current = clientX;
    scrollLeftRef.current = container.scrollLeft;
    dragDistanceRef.current = 0;
  };

  const moveDrag = (clientX: number) => {
    const container = trackRef.current;
    if (!container || !isDraggingRef.current) return;
    const dx = clientX - startXRef.current;
    dragDistanceRef.current = Math.abs(dx);
    container.scrollLeft = scrollLeftRef.current - dx;
  };

  const endDrag = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragDistanceRef.current > 5) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (productos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
        No hay productos destacados todavia.
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      className="flex gap-4 overflow-hidden cursor-grab active:cursor-grabbing py-2 px-2"
      style={{ scrollBehavior: 'auto' }}
      onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX); }}
      onMouseMove={(e) => { if (!isDraggingRef.current) return; e.preventDefault(); moveDrag(e.clientX); }}
      onMouseUp={endDrag}
      onTouchStart={(e) => { const t = e.touches[0]; if (t) startDrag(t.clientX); }}
      onTouchMove={(e) => { const t = e.touches[0]; if (t) moveDrag(t.clientX); }}
      onTouchEnd={endDrag}
    >
      {items.map((producto, index) => (
        <Link
          key={`${producto.id}-${index}`}
          href={`/productos/${producto.id}`}
          onClick={handleClick}
          className="group flex flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 transition hover:border-orange-500/50 hover:-translate-y-1"
          style={{ minWidth: `${CARD_WIDTH}px`, width: `${CARD_WIDTH}px` }}
          draggable={false}
        >
          <div className="h-48 w-full overflow-hidden bg-white">
            {producto.imagen_url ? (
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                className="h-full w-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-900 px-4 text-center text-sm font-semibold text-zinc-100">
                {producto.nombre}
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between p-4">
            <div>
              <p className="text-sm font-semibold tracking-tight text-zinc-50 group-hover:text-orange-300 transition">
                {producto.nombre}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                {producto.descripcion}
              </p>
            </div>
            {/* El precio no se muestra en la vista pública */}
          </div>
        </Link>
      ))}
    </div>
  );
}
