import type { Metadata } from "next";
import { Inter, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TripRoll - Spontaneous Travel, Delivered",
  description:
    "Spin the globe. Get a complete trip. TripRoll eliminates trip planning by delivering personalized, ready-to-go travel packages within your budget.",
  keywords: [
    "travel",
    "spontaneous travel",
    "trip planning",
    "surprise trip",
    "vacation",
    "TripRoll",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-cloud">
        {children}
      </body>
    </html>
  );
}
