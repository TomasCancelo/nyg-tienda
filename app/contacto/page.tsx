"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

const WHATSAPP_NUMBER = "59896077602";

export default function ContactoPage() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [asunto, setAsunto] = useState("Consulta de producto");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const mensajeCompleto = `Hola N&G! Mi nombre es ${nombre}.
Asunto: ${asunto}
${mensaje}
Mi teléfono: ${telefono || "-"}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensajeCompleto)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="bg-black px-4 py-16">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-light tracking-tight text-white md:text-5xl">
            Contactanos
          </h1>
          <p className="mt-3 text-zinc-400">Estamos para ayudarte</p>
          <div className="mt-5 h-0.5 w-20 bg-amber-500" aria-hidden />

          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <h2 className="font-semibold text-white">WhatsApp</h2>
                  <p className="mt-1 text-zinc-300">096 077 602</p>
                  <a
                    href="https://wa.me/59896077602"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                  >
                    Escribir ahora
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <h2 className="font-semibold text-white">Email</h2>
                  <p className="mt-1 text-zinc-300">electricidad.nyg@gmail.com</p>
                  <a
                    href="mailto:electricidad.nyg@gmail.com"
                    className="mt-3 inline-flex rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                  >
                    Enviar email
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <h2 className="font-semibold text-white">Teléfono</h2>
                  <p className="mt-1 text-zinc-300">42260541</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <h2 className="font-semibold text-white">Dirección</h2>
                  <p className="mt-1 text-zinc-300">
                    Av. Aparicio Saravia CASI Guyunusa, Maldonado
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <h2 className="font-semibold text-white">Horario</h2>
                  <p className="mt-1 text-zinc-300">
                    Lun-Vie: 8:00-12:30 / 14:00-18:00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 md:p-8"
        >
          <h2 className="text-2xl font-semibold text-white">Envianos tu consulta</h2>
          <p className="mt-2 text-zinc-400">Te respondemos por WhatsApp</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="nombre" className="mb-2 block text-sm text-zinc-300">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                required
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="mb-2 block text-sm text-zinc-300">
                Teléfono
              </label>
              <input
                id="telefono"
                type="text"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="asunto" className="mb-2 block text-sm text-zinc-300">
                Asunto
              </label>
              <select
                id="asunto"
                value={asunto}
                onChange={(event) => setAsunto(event.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-amber-500"
              >
                <option>Consulta de producto</option>
                <option>Solicitar presupuesto</option>
                <option>Información general</option>
                <option>Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="mensaje" className="mb-2 block text-sm text-zinc-300">
                Mensaje
              </label>
              <textarea
                id="mensaje"
                required
                rows={5}
                value={mensaje}
                onChange={(event) => setMensaje(event.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#25D366] px-5 py-3 font-medium text-white transition hover:brightness-110"
            >
              Enviar por WhatsApp
            </button>
          </form>
        </motion.section>
      </div>
    </main>
  );
}
