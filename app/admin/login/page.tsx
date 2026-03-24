"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
        <section className="w-full rounded-2xl border border-gray-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/50">
          <div className="mb-6 text-center">
            <Link href="/" className="inline-flex items-center justify-center">
              <img
                src="https://thqmpndhlqknwactxcik.supabase.co/storage/v1/object/public/productos/logo.PNG"
                alt="NYG"
                className="h-20 w-20 rounded-xl border border-white/10 object-cover"
              />
            </Link>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              Administración NYG
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Ingresá para gestionar productos
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-300">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-500"
              />
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
