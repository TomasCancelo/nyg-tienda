"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { useConsulta } from "../context/ConsultaContext";

const WHATSAPP_NUMBER = "59896077602";

export default function ConsultaCarrito() {
  const { productos, quitarProducto, cambiarCantidad, limpiarConsulta } = useConsulta();
  const [open, setOpen] = useState(false);

  const totalItems = productos.length;

  const enviarPorWhatsapp = () => {
    if (!productos.length) return;
    const lineas = productos
      .map(
        (p) =>
          `• ${p.nombre} (Cód: ${p.codigo || "Sin código"}) - Cantidad: ${p.cantidad}`,
      )
      .join("\n");
    const mensaje = `Hola N&G! Me gustaría consultar precio de los siguientes productos:\n\n${lineas}\n\nQuedo a la espera, gracias!`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full border border-amber-500 bg-black text-amber-500 shadow-lg transition hover:bg-zinc-900"
        aria-label="Abrir carrito de consulta"
      >
        <ShoppingCart className="h-6 w-6" />
        {totalItems > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-semibold text-black">
            {totalItems}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/60"
              aria-label="Cerrar carrito de consulta"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-full flex-col border-l border-zinc-700 bg-zinc-900 sm:w-80"
            >
              <header className="flex items-center justify-between border-b border-zinc-700 px-4 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Mi consulta</h2>
                  <p className="text-sm text-zinc-400">{productos.length} productos</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                  aria-label="Cerrar panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {productos.length === 0 ? (
                  <p className="text-sm text-zinc-400">No agregaste productos aún</p>
                ) : (
                  productos.map((producto) => (
                    <article
                      key={producto.id}
                      className="rounded-xl border border-zinc-700 bg-zinc-800 p-3"
                    >
                      <div className="flex gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-900">
                          {producto.imagen_url ? (
                            <img
                              src={producto.imagen_url}
                              alt={producto.nombre}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                              Sin imagen
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-sm font-medium text-white">
                            {producto.nombre}
                          </h3>
                          <p className="mt-1 text-xs text-zinc-400">Cód: {producto.codigo}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => quitarProducto(producto.id)}
                          className="self-start rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
                          aria-label={`Quitar ${producto.nombre}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3">
                        <label className="text-xs text-zinc-400">Cantidad</label>
                        <input
                          type="number"
                          min={1}
                          value={producto.cantidad}
                          onChange={(e) =>
                            cambiarCantidad(producto.id, Number(e.target.value))
                          }
                          className="mt-1 w-24 rounded-md border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </article>
                  ))
                )}
              </div>

              <footer className="border-t border-zinc-700 px-4 py-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={limpiarConsulta}
                    className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
                  >
                    Limpiar todo
                  </button>
                  <button
                    type="button"
                    onClick={enviarPorWhatsapp}
                    disabled={productos.length === 0}
                    className="flex-1 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Enviar consulta por WhatsApp
                  </button>
                </div>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
