import type { Metadata } from "next";
import { NavBar } from "@/components/nav-bar";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechKart - Smart Shopping for Electronics",
  description:
    "Modern buyer-first ecommerce experience for discovery, comparison, and price tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Providers>
          <NavBar />
          <main className="min-h-[calc(100vh-70px)]">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
