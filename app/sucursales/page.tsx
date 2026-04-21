"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Phone, Smartphone } from "lucide-react";

const LOCAL_IMAGE =
  "https://thqmpndhlqknwactxcik.supabase.co/storage/v1/object/public/productos/local.PNG";

const MAPS_LINK =
  "https://www.google.com/maps/place/N%26G+Materiales+El%C3%A9ctricos/@-34.9107885,-54.944991,17z/data=!3m1!4b1!4m6!3m5!1s0x95751bb97a1bb0ad:0xb47ce57e9ec9c59d!8m2!3d-34.9107885!4d-54.9424161!16s%2Fg%2F11h8cglpvy";

export default function SucursalesPage() {
  return (
    <main className="bg-black px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="text-balance text-4xl font-light tracking-tight text-white md:text-5xl">
            Nuestras Sucursales
          </h1>
          <p className="mt-4 text-zinc-400">
            Visitanos en nuestra tienda en Maldonado
          </p>
          <div className="mx-auto mt-6 h-0.5 w-20 bg-amber-500" aria-hidden />
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="mt-12 grid gap-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 md:grid-cols-2 md:p-8"
        >
          <div className="overflow-hidden rounded-xl">
            <img
              src={LOCAL_IMAGE}
              alt="Fachada de N&G Materiales Eléctricos"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-semibold text-white">
              N&G Materiales Eléctricos
            </h2>

            <div className="mt-6 space-y-4 text-zinc-300">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <p>Av. Aparicio Saravia CASI Guyunusa, Maldonado, Uruguay</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <p>Lunes a Viernes: 8:00 - 12:30 / 14:00 - 18:00</p>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <p>42260541</p>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <p>096 077 602</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://wa.me/59896077602"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-3 font-medium text-white transition hover:bg-green-500"
              >
                Abrir en WhatsApp
              </a>
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-5 py-3 font-medium text-black transition hover:bg-amber-400"
              >
                Cómo llegar
              </a>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="mt-10 overflow-hidden rounded-2xl border border-zinc-800"
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3272.8!2d-54.9424161!3d-34.9107885!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95751bb97a1bb0ad%3A0xb47ce57e9ec9c59d!2sN%26G%20Materiales%20El%C3%A9ctricos!5e0!3m2!1ses!2suy!4v1"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          />
        </motion.section>
      </div>
    </main>
  );
}
