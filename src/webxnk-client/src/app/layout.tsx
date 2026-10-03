import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "QUANG TẤN HOÀNG | Nền tảng Xuất Khẩu Quốc Tế & E-Commerce Hybrid B2B & B2C",
  description: "Công ty TNHH SX & TM DV XNK Quang Tấn Hoàng - Nền tảng thương mại xuất khẩu kết hợp B2B & B2C, tự động hóa RFQ, đóng thùng container CBM và xuất bộ chứng từ QuestPDF.",
  keywords: [
    "Xuất khẩu nông sản",
    "Global Export Vietnam",
    "B2B RFQ Portal",
    "Container CBM Calculator",
    "Incoterms 2020",
    "Stripe 3D Secure",
    "Hạt điều Bình Phước",
    "Cà phê Robusta",
    "Quang Tấn Hoàng"
  ],
  alternates: {
    canonical: "https://quangtanhoang.com",
    languages: {
      "vi-VN": "https://quangtanhoang.com?lang=vi",
      "en-US": "https://quangtanhoang.com?lang=en",
    },
  },
  openGraph: {
    title: "QUANG TẤN HOÀNG — Global Export Platform & B2B/B2C E-Commerce",
    description: "Nền tảng xuất khẩu quốc tế đa điều kiện Incoterms 2020, đàm phán giá sỉ realtime và tối ưu hóa đóng hàng container CBM.",
    url: "https://quangtanhoang.com",
    siteName: "Quang Tấn Hoàng Export",
    locale: "vi_VN",
    type: "website",
  },
};

const jsonLdOrg = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CÔNG TY TNHH SX & TM DV XNK QUANG TẤN HOÀNG",
  alternateName: "QUANG TAN HOANG IMPORT EXPORT CO., LTD",
  url: "https://quangtanhoang.com",
  logo: "https://quangtanhoang.com/logo.png",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+84-28-3822-8899",
    contactType: "Customer Support & Foreign Trade",
    availableLanguage: ["Vietnamese", "English"]
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "KCN VSIP 1, TP. Thuận An",
    addressLocality: "Bình Dương",
    addressCountry: "VN"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white text-black`}
      >
        <LanguageProvider>
          <AuthProvider>
            <CurrencyProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </CurrencyProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
