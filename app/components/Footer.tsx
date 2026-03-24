import { MapPin, MessageCircle, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-0 border-t border-white/10 bg-black text-zinc-100">
      <div id="contacto" className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-4 text-center">
            <MapPin className="h-8 w-8 text-[#F97316]" strokeWidth={1.5} />
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F97316]">
                Direccion
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300">
                Av. Aparicio Saravia CASI, 20000
                <br />
                Maldonado, Uruguay
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 text-center">
            <Phone className="h-8 w-8 text-[#F97316]" strokeWidth={1.5} />
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F97316]">
                Contacto
              </h3>
              <div className="flex flex-col gap-2 text-sm text-zinc-300">
                <a href="tel:42260541" className="transition hover:text-[#F97316]">
                  42260541
                </a>
                <a
                  href="https://wa.me/59896077602"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-[#F97316]"
                >
                  +598 96 077 602
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 text-center">
            <MessageCircle className="h-8 w-8 text-[#F97316]" strokeWidth={1.5} />
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F97316]">
                WhatsApp
              </h3>
              <a
                href="https://wa.me/59896077602"
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-full bg-[#F97316] px-5 py-2 text-sm font-semibold text-black transition hover:bg-orange-400"
              >
                Escribinos ahora
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-zinc-500">
        <p>2025 NYG - Materiales electricos - Maldonado, Uruguay</p>
      </div>
    </footer>
  );
}
