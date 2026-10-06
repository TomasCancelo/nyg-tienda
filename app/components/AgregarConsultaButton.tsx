"use client";

import { Plus, ShoppingCart, X } from "lucide-react";
import { useConsulta } from "../context/ConsultaContext";

type Props = {
  producto: {
    id: number;
    nombre: string;
    codigo?: string | null;
    imagen_url?: string | null;
  };
  className?: string;
  compact?: boolean;
};

export default function AgregarConsultaButton({
  producto,
  className = "",
  compact = false,
}: Props) {
  const { agregarProducto, quitarProducto, estaAgregado } = useConsulta();
  const agregado = estaAgregado(producto.id);

  if (agregado) {
    return (
      <button
        type="button"
        onClick={() => quitarProducto(producto.id)}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 ${className}`}
      >
        <ShoppingCart className="h-4 w-4" />
        Agregado ✓
        <X className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => agregarProducto(producto)}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-orange-500/60 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-100 ${className}`}
    >
      {compact ? <Plus className="h-4 w-4 shrink-0" /> : <ShoppingCart className="h-4 w-4" />}
      {compact ? (
        // En tarjetas angostas (celular) el texto largo no entra en una línea
        <>
          <span className="whitespace-nowrap sm:hidden">Consultar</span>
          <span className="hidden whitespace-nowrap sm:inline">Agregar a consulta</span>
        </>
      ) : (
        "Agregar a consulta"
      )}
    </button>
  );
}
