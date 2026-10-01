import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Quantum from Zero · Learn by doing",
  description:
    "De tu primer qubit a tu primer proyecto cuántico. Una plataforma interactiva para developers.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
