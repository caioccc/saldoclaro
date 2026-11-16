import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://saldoclaro.app"),
  title: {
    default: "SaldoClaro | Simulador de Crédito e Parcelamentos",
    template: "%s | SaldoClaro",
  },
  description:
    "Simule sua capacidade de crédito, saques no cartão e parcelamentos com taxas transparentes e projeção mensal.",
  applicationName: "SaldoClaro",
  keywords: [
    "simulador de crédito",
    "simulador de parcelamento",
    "capacidade de crédito",
    "saque no cartão",
    "Mercado Pago",
    "planejamento financeiro",
  ],
  authors: [{ name: "SaldoClaro" }],
  creator: "SaldoClaro",
  publisher: "SaldoClaro",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://saldoclaro.app",
    siteName: "SaldoClaro",
    title: "SaldoClaro | Simulador de Crédito e Parcelamentos",
    description:
      "Planeje sua capacidade de crédito e visualize o impacto de parcelamentos mês a mês.",
    images: [{ url: "/icon.svg", width: 64, height: 64, alt: "Ícone do SaldoClaro" }],
  },
  twitter: {
    card: "summary",
    title: "SaldoClaro | Simulador de Crédito e Parcelamentos",
    description:
      "Planeje sua capacidade de crédito e visualize o impacto de parcelamentos mês a mês.",
    images: ["/icon.svg"],
  },
};

const themeScript = `(function(){try{var match=document.cookie.match(/(?:^|; )saldoclaro_theme=([^;]+)/);var stored=match?decodeURIComponent(match[1]):null;var dark=stored?stored==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "SaldoClaro",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              inLanguage: "pt-BR",
              description: "Simulador de capacidade de crédito e parcelamentos.",
              url: "https://saldoclaro.app",
            }),
          }}
        />
      </head>
      <body className="bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        {children}
      </body>
    </html>
  );
}
