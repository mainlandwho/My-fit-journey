import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaClientShell } from "@/components/pwa/PwaClientShell";

export const metadata: Metadata = {
  title: "My Fit Journey",
  description: "Your Journey. Your Transformation.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    // Enables standalone mode when launched from the iOS home screen
    capable: true,
    statusBarStyle: "black-translucent",
    title: "My Fit Journey",
  },
};

export const viewport: Viewport = {
  themeColor: "#1F2937",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // fitness app UI is custom-built for one scale; prevents accidental pinch-zoom breaking layout
  viewportFit: "cover", // respects the iPhone notch/safe areas
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaClientShell />
      </body>
    </html>
  );
}
