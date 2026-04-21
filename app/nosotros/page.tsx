"use client";

import { motion } from "framer-motion";
import {
  Handshake,
  Lightbulb,
  Rocket,
  Star,
  Wrench,
  Zap,
} from "lucide-react";

const STORY_IMG_PLACEHOLDER =
  "https://images.unsplash.com/photo-1621905252472-7af2864a9428?w=900";

const inViewBlock = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const },
  viewport: { once: true, margin: "-100px" as const },
};

const ofrecemosCards = [
  {
    icon: Lightbulb,
    title: "Iluminación",
    body:
      "Amplio catálogo de lámparas, plafones, reflectores, apliques y más para cada necesidad.",
  },
  {
    icon: Zap,
    title: "Electricidad",
    body:
      "Todo en materiales eléctricos: cables, tableros, interruptores, tomas y accesorios.",
  },
  {
    icon: Wrench,
    title: "Asesoramiento",
    body:
      "Te ayudamos a elegir el producto correcto para tu proyecto con atención personalizada.",
  },
] as const;

const elegirnosItems = [
  {
    icon: Handshake,
    title: "Confianza y cercanía",
    body: "Más de 10 años construyendo relaciones con nuestros clientes.",
  },
  {
    icon: Star,
    title: "Calidad garantizada",
    body: "Productos seleccionados de las mejores marcas del mercado.",
  },
  {
    icon: Rocket,
    title: "Atención rápida y eficiente",
    body: "Respondemos tus consultas de forma ágil por WhatsApp.",
  },
  {
    icon: Lightbulb,
    title: "Asesoramiento técnico",
    body: "Te guiamos en cada proyecto para que elijas lo mejor.",
  },
] as const;

export default function NosotrosPage() {
  return (
    <>
      <section className="relative z-10 bg-black px-4 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
          <motion.div {...inViewBlock}>
            <h2 className="text-4xl font-light tracking-tight text-white">
              Nuestra Historia
            </h2>
            <div className="mt-4 h-0.5 w-16 bg-amber-500" aria-hidden />
            <div className="mt-8 max-w-2xl space-y-5 text-zinc-300">
              <p className="text-pretty leading-relaxed">
                Con más de 10 años en el mercado, N&G Materiales Eléctricos nació
                con un objetivo claro: acercar productos de iluminación y
                electricidad de la más alta calidad a hogares y empresas de
                Maldonado y todo Uruguay.
              </p>
              <p className="text-pretty leading-relaxed">
                Lo que comenzó como un pequeño emprendimiento creció hasta
                convertirse en una empresa de referencia en la región, siempre
                manteniendo el trato cercano y personalizado que nos caracteriza.
              </p>
            </div>
          </motion.div>
          <motion.div {...inViewBlock}>
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
              <img
                src={STORY_IMG_PLACEHOLDER}
                alt=""
                className="aspect-[4/3] w-full object-cover md:aspect-auto md:min-h-[280px] md:max-h-[360px]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 bg-zinc-900 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            className="text-center text-4xl font-light tracking-tight text-white"
            {...inViewBlock}
          >
            Lo que ofrecemos
          </motion.h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {ofrecemosCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.article
                  key={card.title}
                  className="h-full rounded-2xl border border-amber-500/25 bg-zinc-800 p-8 shadow-lg"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    ease: "easeOut",
                    delay: index * 0.15,
                  }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <Icon
                    className="h-10 w-10 text-amber-500"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <h3 className="mt-5 text-xl font-semibold text-white">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-400">
                    {card.body}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-black px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            className="text-center text-4xl font-light tracking-tight text-white"
            {...inViewBlock}
          >
            Por qué elegirnos
          </motion.h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-2">
            {elegirnosItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  className="flex gap-4"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    ease: "easeOut",
                    delay: index * 0.15,
                  }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <Icon
                    className="mt-0.5 h-8 w-8 shrink-0 text-amber-500"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-pretty text-sm leading-relaxed text-zinc-400">
                      {item.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
