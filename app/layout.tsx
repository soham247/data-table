import type { Metadata } from "next";
import { Providers } from "./providers";
import { Navbar } from "./_components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workforce Directory · Enterprise Data Table",
  description: "Enterprise-grade virtualized data table built with TanStack Table + Virtual",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col">
        <Navbar />
        <Providers>
          <div className="min-h-0 flex-1">{children}</div>
        </Providers>
      </body>
    </html>
  );
}

