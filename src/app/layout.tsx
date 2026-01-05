import type { Metadata, Viewport } from "next";
import { LifeSyncProvider } from "@/context/LifeSyncContext";
import { SyncIndicator } from "@/components/ui/sync-indicator";
import { UndoToastProvider } from "@/components/ui/undo-toast";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#191919",
};

export const metadata: Metadata = {
  title: "Life Sync | Seu Sistema Operacional Pessoal",
  description:
    "Life Sync é o seu cockpit para alta performance e clareza mental. Gerencie seu tempo, hábitos, finanças e objetivos em um único lugar.",
  keywords: [
    "life os",
    "produtividade",
    "hábitos",
    "planejamento",
    "finanças pessoais",
    "objetivos",
    "segunda cérebro",
  ],
  authors: [{ name: "Life Sync Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Life Sync",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

// Script to register service worker
const registerSW = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('[App] ServiceWorker registered:', registration.scope);
      })
      .catch(function(err) {
        console.log('[App] ServiceWorker registration failed:', err);
      });
  });
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* PWA Meta Tags */}
        <meta name="application-name" content="Life Sync" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Life Sync" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#191919" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{ __html: registerSW }} />
      </head>
      <body className="min-h-screen antialiased">
        {/* Background Pattern - Dark Academia Subtle Grid */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Subtle Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `linear-gradient(rgba(227,227,227,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(227,227,227,0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Main Content with Providers */}
        <LifeSyncProvider>
          <UndoToastProvider>
            {/* Sync Status Indicator */}
            <SyncIndicator />

            {/* Page Content */}
            <main className="relative z-10">{children}</main>
          </UndoToastProvider>
        </LifeSyncProvider>
      </body>
    </html>
  );
}
