"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useConsulta } from "../context/ConsultaContext";

const WHATSAPP_NUMBER = "59896077602";

export default function ConsultaCarrito() {
  const { productos, quitarProducto, cambiarCantidad, limpiarConsulta } =
    useConsulta();
  const [open, setOpen] = useState(false);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensajeAdicional, setMensajeAdicional] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [exito, setExito] = useState("");

  const totalItems = productos.length;

  const abrirWhatsappCliente = (
    nombreCliente: string,
    tel: string,
    lineasProductos: string,
    extra: string,
  ) => {
    let cuerpo = `Hola N&G! Soy ${nombreCliente} (${tel}).\nAcabo de enviar una consulta desde la web con los siguientes productos:\n\n${lineasProductos}`;
    const extraTrim = extra.trim();
    if (extraTrim) {
      cuerpo += `\n\n${extraTrim}`;
    }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(cuerpo)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onSubmitConsulta = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorEnvio("");
    setExito("");

    if (!productos.length) {
      setErrorEnvio("Agregá al menos un producto a la consulta.");
      return;
    }

    const nombreTrim = nombre.trim();
    const telTrim = telefono.trim();
    if (!nombreTrim || !telTrim) {
      setErrorEnvio("Completá tu nombre y teléfono/WhatsApp.");
      return;
    }

    const listaProductos = productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      cantidad: p.cantidad,
    }));

    setEnviando(true);
    const { error } = await supabase.from("consultas").insert({
      nombre: nombreTrim,
      telefono: telTrim,
      mensaje: mensajeAdicional.trim(),
      estado: "pendiente",
      productos: JSON.stringify(listaProductos),
    });
    setEnviando(false);

    if (error) {
      setErrorEnvio(error.message || "No se pudo guardar la consulta.");
      return;
    }

    const lineas = productos
      .map(
        (p) =>
          `• ${p.nombre} (Cód: ${p.codigo || "Sin código"}) - Cantidad: ${p.cantidad}`,
      )
      .join("\n");

    abrirWhatsappCliente(nombreTrim, telTrim, `\n${lineas}`, mensajeAdicional);

    setExito("Consulta enviada correctamente.");
    limpiarConsulta();
    setNombre("");
    setTelefono("");
    setMensajeAdicional("");
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
              <header className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-4 py-4">
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

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
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

              <footer className="shrink-0 border-t border-zinc-700 px-4 py-4">
                {exito ? (
                  <p className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                    {exito}
                  </p>
                ) : null}
                {errorEnvio ? (
                  <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {errorEnvio}
                  </p>
                ) : null}

                <form onSubmit={onSubmitConsulta} className="space-y-3">
                  <div>
                    <label
                      htmlFor="consulta-nombre"
                      className="mb-1 block text-xs text-zinc-400"
                    >
                      Nombre completo
                    </label>
                    <input
                      id="consulta-nombre"
                      type="text"
                      required
                      autoComplete="name"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="consulta-telefono"
                      className="mb-1 block text-xs text-zinc-400"
                    >
                      Teléfono / WhatsApp
                    </label>
                    <input
                      id="consulta-telefono"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="consulta-mensaje"
                      className="mb-1 block text-xs text-zinc-400"
                    >
                      Mensaje adicional (opcional)
                    </label>
                    <textarea
                      id="consulta-mensaje"
                      rows={3}
                      value={mensajeAdicional}
                      onChange={(e) => setMensajeAdicional(e.target.value)}
                      className="w-full resize-none rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        limpiarConsulta();
                        setExito("");
                        setErrorEnvio("");
                      }}
                      className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
                    >
                      Limpiar todo
                    </button>
                    <button
                      type="submit"
                      disabled={enviando || productos.length === 0}
                      className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {enviando ? "Enviando…" : "Enviar consulta"}
                    </button>
                  </div>
                </form>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
