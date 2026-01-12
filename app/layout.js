import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Script from "next/script";
import { getPrefCodeFromURL } from "@/app/utils/getPrefCodeFromURL";

export const metadata = {
  title: "CityRiskView",
};

export default function RootLayout({ children }) {
  // SSRでは window がないので一旦nullにして、CSRで取得
  let prefCode = null;
  if (typeof window !== "undefined") {
    prefCode = getPrefCodeFromURL();
    console.log("Detected Pref Code:", prefCode);
  }

  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-screen overflow-hidden">
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y37BP6LQGG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Y37BP6LQGG');
          `}
        </Script>

        <div className="flex h-full">
          <Sidebar prefCode={prefCode} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
