// Banner promocional Clásica × Molveno — placas y tomacorrientes
// Imágenes servidas desde /public/banner/ (extraídas del diseño original)

import Image from "next/image";
import Link from "next/link";

export default function BannerClasica() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 md:px-6">
      <div
        className="relative flex flex-col overflow-hidden rounded-2xl"
      >

        {/* Grid lines overlay */}
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.05,
            backgroundImage:
              "linear-gradient(90deg, #ff7a00 1px, transparent 1px), linear-gradient(0deg, #ff7a00 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Corner — top right */}
        <div
          className="absolute right-6 top-6 z-[2] h-[50px] w-[50px] rounded-tr-lg"
          style={{
            borderTop: "2px solid rgba(255,122,0,0.45)",
            borderRight: "2px solid rgba(255,122,0,0.45)",
          }}
        />
        {/* Corner — bottom left */}
        <div
          className="absolute bottom-6 left-6 z-[2] h-[35px] w-[35px]"
          style={{
            borderBottom: "2px solid rgba(255,122,0,0.25)",
            borderLeft: "2px solid rgba(255,122,0,0.25)",
          }}
        />

        {/* ── Logos bar ── */}
        <div
          className="relative z-10 flex items-center gap-6 px-5 py-[24px] sm:px-[52px] sm:py-[30px]"
          style={{ borderBottom: "1px solid rgba(255,122,0,0.1)" }}
        >
          <Image
            src="/banner/logo-clasica.png"
            alt="Clásica"
            width={130}
            height={65}
            className="h-[65px] w-auto object-contain opacity-[0.92]"
          />
          <div
            className="h-[65px] w-px shrink-0"
            style={{ background: "rgba(255,122,0,0.3)" }}
          />
          <div className="rounded-lg bg-white px-3 py-2">
            <Image
              src="/banner/logo-molveno.png"
              alt="Molveno"
              width={140}
              height={65}
              className="h-[55px] w-auto object-contain"
            />
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="relative z-10 flex flex-col items-start gap-8 px-5 pb-10 pt-8 md:flex-row md:items-center md:px-[52px] md:pb-[52px]">
          {/* Right-side wall gradient (desktop only) */}
          <div
            className="absolute bottom-0 right-0 top-0 hidden w-[60%] md:block"
            style={{ borderLeft: "1px solid rgba(255,122,0,0.10)" }}
          />

          {/* Glow orb (desktop only) */}
          <div
            className="pointer-events-none absolute hidden md:block"
            style={{
              width: 420,
              height: 420,
              background:
                "radial-gradient(circle, rgba(255,122,0,0.11) 0%, transparent 70%)",
              top: "50%",
              left: "55%",
              transform: "translate(-50%,-50%)",
            }}
          />

          {/* ── Left: text ── */}
          <div className="relative z-10 w-full md:w-[38%] md:pr-9">
            {/* Badge */}
            <div
              className="mb-[18px] inline-flex items-center gap-[7px] rounded-full px-[14px] py-1 text-[10px] font-semibold uppercase tracking-[2px]"
              style={{
                background: "rgba(255,122,0,0.1)",
                border: "1px solid rgba(255,122,0,0.35)",
                color: "#ff7a00",
              }}
            >
              <span
                className="h-[6px] w-[6px] animate-pulse rounded-full"
                style={{ background: "#ff7a00" }}
              />
              Atenea
            </div>

            {/* Heading (usa Bebas Neue si está disponible) */}
            <h2
              className="mb-[10px] text-[42px] leading-[.93] tracking-[1px] text-white sm:text-[52px]"
              style={{
                fontFamily:
                  "var(--font-bebas-neue, 'Bebas Neue', Impact, sans-serif)",
              }}
            >
              LA NATURALEZA
              <br />
              <span style={{ color: "#ff7a00" }}>DEL DISEÑO</span>
              <br />
              ATENEA
            </h2>

            <p
              className="mb-5 text-[11px] font-light uppercase tracking-[3.5px]"
              style={{ color: "rgba(255,255,255,.4)" }}
            >
              Placas &amp; Tomacorrientes
            </p>

            {/* Divider */}
            <div
              className="mb-[18px] h-[2px] w-11 rounded-sm"
              style={{ background: "#ff7a00" }}
            />

            <p
              className="mb-7 text-[13px] leading-[1.65]"
              style={{ color: "rgba(255,255,255,.6)" }}
            >
              Diseño que se integra a cada espacio.
              <br />
              Funcionalidad y estética en cada detalle.
            </p>

            {/* CTA */}
            <a
              href="/productos"
              className="inline-flex items-center gap-2 rounded px-[26px] py-3 text-xs font-semibold uppercase tracking-[1.5px] text-white transition hover:bg-orange-400"
              style={{ background: "#ff7a00" }}
            >
              Ver catálogo →
            </a>
          </div>

          {/* ── Right: floating product images (desktop only) ── */}
          <div className="relative z-10 hidden flex-1 md:block">
            <div className="relative h-[420px] w-full">
              {/* p1 — panel triple blanco, bottom-left, rotado */}
              <Link href="/productos" className="absolute" style={{ left: 0, bottom: 8, zIndex: 3 }}>
                <Image
                  src="/banner/prod-panel.png"
                  alt="Panel triple blanco"
                  width={320}
                  height={390}
                  className="object-contain transition-all duration-[350ms] hover:scale-[1.04] cursor-pointer"
                  style={{
                    width: 320,
                    height: "auto",
                    transform: "rotate(-4deg)",
                    filter:
                      "drop-shadow(0 12px 28px rgba(0,0,0,.6)) drop-shadow(0 4px 10px rgba(255,122,0,0.12))",
                  }}
                />
              </Link>
              {/* p3 — placas grises, centro, z más alto */}
              <Link href="/productos" className="absolute" style={{ left: "27%", top: "50%", transform: "translateY(-50%)", zIndex: 5 }}>
                <Image
                  src="/banner/prod-placas.png"
                  alt="Placas grises"
                  width={770}
                  height={590}
                  className="object-contain transition-all duration-[350ms] hover:scale-[1.05] cursor-pointer"
                  style={{
                    width: 300,
                    height: "auto",
                    transform: "rotate(-1deg)",
                    filter:
                      "drop-shadow(0 12px 28px rgba(0,0,0,.6)) drop-shadow(0 4px 10px rgba(255,122,0,0.12))",
                  }}
                />
              </Link>
              {/* p2 — placas verticales, arriba-derecha */}
              <Link href="/productos" className="absolute" style={{ right: "3%", top: "4%", zIndex: 4 }}>
                <Image
                  src="/banner/prod-vertical.png"
                  alt="Placas verticales"
                  width={210}
                  height={410}
                  className="object-contain transition-all duration-[350ms] hover:scale-[1.06] cursor-pointer"
                  style={{
                    width: 210,
                    height: "auto",
                    transform: "rotate(4deg)",
                    filter:
                      "drop-shadow(0 12px 28px rgba(0,0,0,.6)) drop-shadow(0 4px 10px rgba(255,122,0,0.12))",
                  }}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
