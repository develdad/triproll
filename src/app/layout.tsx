import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
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

const TITLE = "TripRoll - Spontaneous Travel, Delivered";
const DESCRIPTION =
  "Spin the globe. Get a complete trip. TripRoll eliminates trip planning by delivering personalized, ready-to-go travel packages within your budget.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | TripRoll",
  },
  description: DESCRIPTION,
  applicationName: "TripRoll",
  keywords: [
    "travel",
    "spontaneous travel",
    "trip planning",
    "surprise trip",
    "vacation",
    "TripRoll",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "TripRoll",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "TripRoll" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0D7377",
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
