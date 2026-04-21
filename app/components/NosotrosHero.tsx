"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const BG = "#0a0a0a";
const ACCENT = "#F97316";
const SCROLL_PX = 160;

function LampIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 320"
      className="mx-auto h-[min(42vw,220px)] w-auto max-w-[220px] select-none"
      aria-hidden
    >
      <defs>
        <radialGradient id="nosotrosHero-lampGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.55" />
          <stop offset="45%" stopColor={ACCENT} stopOpacity="0.12" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
        <filter id="nosotrosHero-lampBlur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="nosotrosHero-shadeMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="50%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
      </defs>

      <path
        d="M110 0 L110 52"
        stroke="#52525b"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="110" cy="56" r="5" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />

      <rect
        x="94"
        y="60"
        width="32"
        height="22"
        rx="3"
        fill="#27272a"
        stroke="#3f3f46"
        strokeWidth="1"
      />

      <path
        d="M52 82 L168 82 L148 168 L72 168 Z"
        fill="url(#nosotrosHero-shadeMetal)"
        stroke="#3f3f46"
        strokeWidth="1.2"
      />
      <path
        d="M62 92 L158 92 L145 158 L75 158 Z"
        fill="#18181b"
        opacity="0.45"
      />

      <motion.g
        style={{ transformOrigin: "110px 130px" }}
        animate={{
          opacity: [1, 0.88, 1, 0.92, 0.86, 0.95, 1, 0.9, 1],
        }}
        transition={{
          duration: 5.2,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <ellipse
          cx="110"
          cy="128"
          rx="78"
          ry="72"
          fill="url(#nosotrosHero-lampGlow)"
          filter="url(#nosotrosHero-lampBlur)"
        />
        <ellipse cx="110" cy="142" rx="22" ry="14" fill={ACCENT} opacity="0.35" />
      </motion.g>

      <motion.g
        animate={{
          opacity: [1, 0.82, 1, 0.9, 0.85, 1],
        }}
        transition={{
          duration: 5.2,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <ellipse
          cx="110"
          cy="148"
          rx="18"
          ry="22"
          fill="#fef3c7"
          opacity="0.95"
        />
        <ellipse cx="110" cy="144" rx="8" ry="6" fill="#fffbeb" opacity="0.5" />
      </motion.g>

      <path
        d="M72 168 L148 168 L142 178 L78 178 Z"
        fill="#27272a"
        stroke="#3f3f46"
        strokeWidth="1"
      />
    </svg>
  );
}

export default function NosotrosHero() {
  const scrollTrackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: scrollTrackRef,
    offset: ["start start", "end start"],
  });

  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 5]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const glowScale = useTransform(scrollYProgress, [0, 1], [1, 9]);
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [0.55, 0]);

  return (
    <section
      className="relative w-full shrink-0"
      style={{ height: `calc(100vh + ${SCROLL_PX}px)` }}
      aria-labelledby="nosotros-hero-heading"
    >
      {/* Track de {SCROLL_PX}px: progreso 0→1 = primeros 160px de scroll (scrub 1:1 con el dedo) */}
      <div
        ref={scrollTrackRef}
        className="pointer-events-none absolute left-0 top-0 z-[1] w-full"
        style={{ height: SCROLL_PX }}
        aria-hidden
      />

      <div
        className="sticky top-0 z-[15] flex h-screen w-full flex-col items-center justify-center overflow-hidden px-4"
        style={{ backgroundColor: BG }}
      >
        {/* Glow: radial naranja, expande + desvanece con el mismo scroll */}
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
          aria-hidden
        >
          <motion.div
            className="h-[min(120vmin,720px)] w-[min(120vmin,720px)] rounded-full"
            style={{
              opacity: glowOpacity,
              scale: glowScale,
              transformOrigin: "center center",
              willChange: "transform, opacity",
              background:
                "radial-gradient(circle closest-side, rgba(249,115,22,0.55) 0%, rgba(249,115,22,0.2) 38%, rgba(249,115,22,0.06) 55%, transparent 72%)",
            }}
          />
        </div>

        <motion.div
          className="relative z-[1] flex w-full max-w-3xl flex-col items-center text-center"
          style={{
            scale: heroScale,
            opacity: heroOpacity,
            transformOrigin: "center center",
            willChange: "transform, opacity",
          }}
        >
          <LampIcon />

          <div className="mt-10 flex flex-col items-center gap-4 md:mt-12">
            <h1
              id="nosotros-hero-heading"
              className="text-balance text-4xl font-light tracking-tight text-white md:text-5xl"
            >
              Quiénes somos
            </h1>
            <p className="max-w-lg text-sm font-medium tracking-[0.35em] text-[#F97316] md:text-base md:tracking-[0.42em]">
              N&G · Materiales Eléctricos
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
