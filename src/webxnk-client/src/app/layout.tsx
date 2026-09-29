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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
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
