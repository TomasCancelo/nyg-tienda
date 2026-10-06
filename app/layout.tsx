import type { Metadata } from "next";
import { Raleway, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import ConsultaCarrito from "./components/ConsultaCarrito";
import { ConsultaProvider } from "./context/ConsultaContext";
import { getCategorias } from "../lib/catalogo";
import { SITE_URL } from "../lib/slug";

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-raleway",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
});

export const metadata: Metadata = {
  // Dirección base para links e imágenes de vista previa (WhatsApp, redes)
  metadataBase: new URL(SITE_URL),
  title: "N&G Materiales Eléctricos | Iluminación y Electricidad - Maldonado",
  description:
    "Lámparas, cables, arañas, reflectores LED, artefactos solares y más. Tu tienda de materiales eléctricos e iluminación en Maldonado, Uruguay. Stock permanente, precios en pesos uruguayos y envíos a todo el país.",
  keywords:
    "materiales eléctricos Maldonado, electricidad Maldonado, iluminación Uruguay, luminarias LED, cables eléctricos, reflectores solar, N&G",
  openGraph: {
    title: "N&G Materiales Eléctricos - Maldonado, Uruguay",
    description:
      "Lámparas, cables, arañas, reflectores LED y más. Envíos a todo Uruguay.",
    url: "https://nygmaterialeselectricos.com.uy",
    locale: "es_UY",
    type: "website",
  },
  verification: {
    google: "Fhc0GCHVWDUZKP8BPRrjWJpzOjsvVhNpwka5hoJOBzQ",
  },
};

/** Categorías del menú, armadas en el servidor. Si la base falla, el menú muestra "Ver todos los productos". */
async function categoriasDelMenu() {
  try {
    const todas = await getCategorias();
    const principales = todas
      .filter((c) => c.parent_id == null)
      .map(({ id, nombre }) => ({ id, nombre }));
    const subcategoriasByParent: Record<
      number,
      { id: number; nombre: string; parent_id: number }[]
    > = {};
    for (const c of todas) {
      if (c.parent_id == null) continue;
      (subcategoriasByParent[c.parent_id] ??= []).push({
        id: c.id,
        nombre: c.nombre,
        parent_id: c.parent_id,
      });
    }
    return { principales, subcategoriasByParent };
  } catch {
    return { principales: [], subcategoriasByParent: {} };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const menu = await categoriasDelMenu();
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "N&G Materiales Eléctricos",
    description:
      "Tienda de materiales eléctricos, lámparas, cables y luminarias en Maldonado, Uruguay",
    url: "https://nygmaterialeselectricos.com.uy",
    telephone: "42260541",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. Aparicio Saravia CASI",
      addressLocality: "Maldonado",
      addressRegion: "Maldonado",
      addressCountry: "UY",
      postalCode: "20000",
    },
    priceRange: "$$",
    openingHours: "Mo-Fr 08:00-12:30, Mo-Fr 14:00-18:00",
    sameAs: "https://www.instagram.com/nyg_iluminacionmaldonado",
  };

  return (
    <html lang="es">
      <body
        className={`${raleway.variable} ${bebasNeue.variable} font-sans bg-[#faf9f7]`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <ConsultaProvider>
          <Navbar
            categorias={menu.principales}
            subcategoriasByParent={menu.subcategoriasByParent}
          />
          <main className="bg-[#faf9f7]">{children}</main>
          <Footer />
          <WhatsAppButton />
          <ConsultaCarrito />
        </ConsultaProvider>
      </body>
    </html>
  );
}
