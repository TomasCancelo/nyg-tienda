export type Producto = {
  id: number;
  name: string;
  description: string;
  price: number;
};

export const productos: readonly Producto[] = [
  {
    id: 1,
    name: "Lámpara LED",
    description: "Bajo consumo, luz uniforme y larga vida útil.",
    price: 299,
  },
  {
    id: 2,
    name: "Cable eléctrico",
    description: "Rollo para instalaciones domiciliarias y comerciales.",
    price: 1290,
  },
  {
    id: 3,
    name: "Araña colgante",
    description: "Diseño moderno para comedor o living.",
    price: 3890,
  },
  {
    id: 4,
    name: "Artefacto de techo",
    description: "Fácil instalación, ideal para interiores.",
    price: 1590,
  },
  {
    id: 5,
    name: "Caño eléctrico",
    description: "Protección y prolijidad para canalizaciones.",
    price: 220,
  },
  {
    id: 6,
    name: "Caja de paso",
    description: "Conexiones seguras y accesibles en la instalación.",
    price: 190,
  },
] as const;

