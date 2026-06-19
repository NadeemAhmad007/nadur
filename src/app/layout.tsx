import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Footer } from "@/components/footer";
import { OrganizationSchema, LocalBusinessSchema } from "@/components/schema-markup";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Kasheer360",
    default: "Kasheer360 | Book Houseboats, Hotels, Taxis & Tours in Kashmir",
  },
  description:
    "Book trusted Kashmir hotels, houseboats, shikara rides, taxis, and tour packages directly with local providers. No middlemen. Best rates. Kasheer360.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png?v=4",
    apple: "/icons/icon-192.png?v=4",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Kasheer360",
    title: "Kasheer360 | Book Houseboats, Hotels, Taxis & Tours in Kashmir",
    description:
      "Book trusted Kashmir hotels, houseboats, shikara rides, taxis, and tour packages directly with local providers. No middlemen. Best rates.",
    url: "https://kasheer360.com",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kasheer360",
  },
};

export const viewport: Viewport = {
  themeColor: "#16314D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <OrganizationSchema />
          <LocalBusinessSchema />
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
