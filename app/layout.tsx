import type { Metadata } from "next";
import { Schibsted_Grotesk, Martian_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import LightRays from '@/components/LightRays'
import Navbar from "@/components/Navbar"

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted-grotesk",
  subsets: ["latin"],
});

const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevEvent",
  description: "The Hub for Every Dev Event You Can't Miss",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("min-h-screen", "antialiased", schibstedGrotesk.variable, martianMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-screen flex flex-col">
         <Navbar />
         <div className="absolute inset-0 top-0 z-[-1] min-h-screen">
           <LightRays
             raysOrigin="top-center-offset"
             raysColor="#5dfeca"
             raysSpeed={0.5}
             lightSpread={0.9}
             rayLength={1.4}
             followMouse={true}
             mouseInfluence={0.02}
             noiseAmount={0}
             distortion={0.01}
             pulsating={false}
             fadeDistance={1}
             saturation={1}
         />
         </div>

         <main>
            {children}
         </main>
      </body>
    </html>
  );
}
