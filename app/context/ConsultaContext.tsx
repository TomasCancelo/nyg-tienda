"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ConsultaProducto = {
  id: number;
  nombre: string;
  codigo: string;
  imagen_url: string | null;
  cantidad: number;
};

type ConsultaInput = {
  id: number;
  nombre: string;
  codigo?: string | null;
  imagen_url?: string | null;
};

type ConsultaContextValue = {
  productos: ConsultaProducto[];
  agregarProducto: (producto: ConsultaInput) => void;
  quitarProducto: (id: number) => void;
  cambiarCantidad: (id: number, cantidad: number) => void;
  limpiarConsulta: () => void;
  estaAgregado: (id: number) => boolean;
};

const STORAGE_KEY = "nyg_consulta_carrito";

const ConsultaContext = createContext<ConsultaContextValue | null>(null);

export function ConsultaProvider({ children }: { children: ReactNode }) {
  const [productos, setProductos] = useState<ConsultaProducto[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ConsultaProducto[];
      if (!Array.isArray(parsed)) return;
      setProductos(
        parsed
          .filter((p) => typeof p.id === "number" && typeof p.nombre === "string")
          .map((p) => ({
            id: p.id,
            nombre: p.nombre,
            codigo: p.codigo || "Sin código",
            imagen_url: p.imagen_url ?? null,
            cantidad:
              typeof p.cantidad === "number" && p.cantidad > 0
                ? Math.floor(p.cantidad)
                : 1,
          })),
      );
    } catch {
      // Ignora datos inválidos en localStorage.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
  }, [productos, ready]);

  const agregarProducto = useCallback((producto: ConsultaInput) => {
    setProductos((prev) => {
      const index = prev.findIndex((p) => p.id === producto.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], cantidad: next[index].cantidad + 1 };
        return next;
      }
      return [
        ...prev,
        {
          id: producto.id,
          nombre: producto.nombre,
          codigo: producto.codigo || "Sin código",
          imagen_url: producto.imagen_url ?? null,
          cantidad: 1,
        },
      ];
    });
  }, []);

  const quitarProducto = useCallback((id: number) => {
    setProductos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const cambiarCantidad = useCallback((id: number, cantidad: number) => {
    const nextCantidad = Number.isFinite(cantidad) ? Math.max(1, Math.floor(cantidad)) : 1;
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad: nextCantidad } : p)),
    );
  }, []);

  const limpiarConsulta = useCallback(() => {
    setProductos([]);
  }, []);

  const estaAgregado = useCallback(
    (id: number) => productos.some((p) => p.id === id),
    [productos],
  );

  const value = useMemo(
    () => ({
      productos,
      agregarProducto,
      quitarProducto,
      cambiarCantidad,
      limpiarConsulta,
      estaAgregado,
    }),
    [
      productos,
      agregarProducto,
      quitarProducto,
      cambiarCantidad,
      limpiarConsulta,
      estaAgregado,
    ],
  );

  return <ConsultaContext.Provider value={value}>{children}</ConsultaContext.Provider>;
}

export function useConsulta() {
  const ctx = useContext(ConsultaContext);
  if (!ctx) {
    throw new Error("useConsulta debe usarse dentro de ConsultaProvider");
  }
  return ctx;
}
