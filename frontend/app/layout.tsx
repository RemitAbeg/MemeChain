import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Electrolize } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import ContextProvider from "@/context";

const _geistSans = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const _electrolize = Electrolize({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-electrolize",
});

export const metadata: Metadata = {
  title: "MemeChain - The Meme Battle Arena",
  description:
    "Enter the arena. Stake USDC. Battle for glory and NFT rewards on Base.",
  generator: "v0.app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <html lang="en" className="dark">
      <body
        className={`${_geistSans.className} ${_orbitron.variable} ${_electrolize.variable} font-sans antialiased`}
      >
        <ContextProvider cookies={cookies}>
          <div className="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#0F1626] to-[#0A0F1E]">
            {children}
          </div>
        </ContextProvider>
      </body>
    </html>
  );
}
