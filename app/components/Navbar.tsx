import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0a0a]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-10 md:px-6">
        <Link href="/#inicio" className="flex items-center gap-4">
          <div className="h-[100px] w-[100px] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <img
              src="/logo.png"
              alt="NYG"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="leading-tight">
            <p className="text-3xl font-bold tracking-tight text-white">NYG</p>
            <p className="text-base text-zinc-400">Materiales eléctricos</p>
          </div>
        </Link>

        <div className="hidden items-center gap-10 text-lg font-semibold text-zinc-100 md:flex">
          <Link
            href="/#inicio"
            className="rounded-lg px-2 py-1 transition hover:bg-white/5 hover:text-[#F97316]"
          >
            Inicio
          </Link>
          <Link
            href="/#productos"
            className="rounded-lg px-2 py-1 transition hover:bg-white/5 hover:text-[#F97316]"
          >
            Productos
          </Link>
          <Link
            href="/#contacto"
            className="rounded-lg px-2 py-1 transition hover:bg-white/5 hover:text-[#F97316]"
          >
            Contacto
          </Link>
        </div>

        <Link
          href="/#productos"
          className="rounded-full bg-[#F97316] px-8 py-4 text-lg font-semibold text-black shadow-lg shadow-orange-500/30 ring-1 ring-orange-300/20 transition hover:bg-orange-400 hover:shadow-orange-500/40"
        >
          Ver productos
        </Link>
      </nav>
    </header>
  );
}

