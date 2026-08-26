import type { Metadata } from "next";
import { Schibsted_Grotesk, Martian_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import LightRays from '@/components/LightRays'
import Navbar from "@/components/Navbar"

export const metadata: Metadata = {
  title: "DevEvent",
  description: "The Hub for Every Dev Event You Can't Miss",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("min-h-screen", "antialiased", "font-sans")}
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
