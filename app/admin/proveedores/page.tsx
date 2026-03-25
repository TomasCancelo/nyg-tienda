"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Proveedor = { id: number; nombre: string };

const inputClase =
  "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-amber-500/50";

export default function AdminProveedoresPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [rows, setRows] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("proveedores")
      .select("id, nombre")
      .order("nombre", { ascending: true });

    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows((data ?? []) as Proveedor[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditingId(null);
    setNombre("");
    setFormOpen(true);
  };

  const openEdit = (p: Proveedor) => {
    setEditingId(p.id);
    setNombre(p.nombre);
    setFormOpen(true);
  };

  const cancelForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setNombre("");
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) {
      alert("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    if (editingId == null) {
      const { error: insErr } = await supabase
        .from("proveedores")
        .insert({ nombre: n });
      if (insErr) alert(insErr.message);
      else cancelForm();
    } else {
      const { error: updErr } = await supabase
        .from("proveedores")
        .update({ nombre: n })
        .eq("id", editingId);
      if (updErr) alert(updErr.message);
      else cancelForm();
    }
    setSaving(false);
    await fetchList();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro?")) return;
    setSaving(true);
    const { error: delErr } = await supabase
      .from("proveedores")
      .delete()
      .eq("id", id);
    if (delErr) alert(delErr.message);
    setSaving(false);
    await fetchList();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
            >
              Agregar nuevo
            </button>
            <Link
              href="/admin"
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-500 hover:text-amber-400"
            >
              Volver al panel
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-gray-800 bg-zinc-950">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 text-sm">
              <thead className="bg-black/60 text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-gray-400" colSpan={2}>
                      Cargando…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-gray-400" colSpan={2}>
                      No hay proveedores.
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-900/70">
                      <td className="px-3 py-3 font-medium text-white">{p.nombre}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => openEdit(p)}
                            className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/10 disabled:opacity-60"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleDelete(p.id)}
                            className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {formOpen ? (
          <form
            onSubmit={handleSave}
            className="mt-6 space-y-4 rounded-xl border border-gray-800 bg-zinc-950 p-4"
          >
            <h2 className="text-lg font-semibold text-white">
              {editingId == null ? "Nuevo proveedor" : "Editar proveedor"}
            </h2>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inputClase}
                required
                placeholder="Nombre"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
              >
                Guardar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={cancelForm}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-500 hover:text-amber-400 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </main>
    </div>
  );
}
