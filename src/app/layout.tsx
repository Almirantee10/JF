import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/store/AppStore";

const barlow = Barlow({
  variable: "--f-barlow",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});
const condensed = Barlow_Condensed({
  variable: "--f-condensed",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agropecuária JF · Gestão financeira",
  description:
    "Receitas, despesas, bancos, caixa e resultados da Casa de Carnes e da compra e venda de gado.",
  icons: { icon: "/logo.jpg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${barlow.variable} ${condensed.variable}`}>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
