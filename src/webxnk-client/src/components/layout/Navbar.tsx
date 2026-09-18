"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Globe, ShoppingBag, Box, FileText, Menu, X, ArrowRight } from "lucide-react";

interface NavbarProps {
  cartCount?: number;
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount = 0, onOpenCart }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<"vi" | "en">("vi");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo - QUANG TẤN HOÀNG with 2 Brand Colors */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Logo Quang Tấn Hoàng"
              width={42}
              height={42}
              style={{ width: "42px", height: "42px", objectFit: "contain" }}
              className="rounded transition-transform group-hover:scale-105 shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-lg leading-tight">
                <span className="text-[#0E4B94]">QUANG TẤN </span>
                <span className="text-[#C9252C]">HOÀNG</span>
              </span>
              <span className="text-[10px] tracking-wider text-neutral-500 uppercase font-semibold">
                CÔNG TY TNHH SX & TM DV XNK
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-black">
            <Link
              href="/"
              className="px-3 py-1.5 rounded hover:bg-black/5 transition-colors"
            >
              Catalog B2C
            </Link>
            <Link
              href="/portal"
              className="px-3 py-1.5 rounded hover:bg-black/5 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              B2B RFQ Portal
            </Link>
            <Link
              href="/cbm-calculator"
              className="px-3 py-1.5 rounded hover:bg-black/5 transition-colors flex items-center gap-1.5"
            >
              <Box className="w-4 h-4" />
              3D/2D CBM Container
            </Link>
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded hover:bg-black/5 transition-colors"
            >
              Admin ERP & Docs
            </Link>
          </nav>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "vi" ? "en" : "vi")}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase border border-black/20 hover:border-black rounded text-black transition-colors"
            title="Đổi ngôn ngữ / Switch Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang}</span>
          </button>

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center p-2 rounded border border-black/20 hover:border-black text-black transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* B2B Buyer Quick Quote CTA */}
          <Link
            href="/portal"
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#0E4B94] text-white text-xs uppercase tracking-wider font-semibold px-4 py-2 hover:bg-[#0a376d] transition-colors"
          >
            <span>Yêu cầu báo giá B2B</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-black"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black/10 bg-white px-4 py-3 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-black"
          >
            Catalog B2C (Khách lẻ)
          </Link>
          <Link
            href="/portal"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-black"
          >
            B2B RFQ Portal (Nhà nhập khẩu)
          </Link>
          <Link
            href="/cbm-calculator"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-black"
          >
            Interactive CBM Container UI
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-black"
          >
            Admin ERP & Xuất chứng từ PDF
          </Link>
        </div>
      )}
    </header>
  );
};
