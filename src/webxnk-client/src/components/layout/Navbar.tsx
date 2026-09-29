"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Globe,
  ShoppingBag,
  Box,
  FileText,
  Menu,
  X,
  ArrowRight,
  Ship,
  DollarSign,
  User,
  LogOut,
  Building,
  Shield,
  ChevronDown,
} from "lucide-react";
import { useCurrency, Currency, CURRENCY_CONFIGS } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";

interface NavbarProps {
  cartCount?: number;
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount = 0, onOpenCart }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === "vi" ? "en" : "vi");
  };

  return (
    <>
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
                  {language === "vi"
                    ? "CÔNG TY TNHH SX & TM DV XNK"
                    : "IMPORT EXPORT PRODUCTION & TRADING"}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-black">
              <Link
                href="/"
                className="px-3 py-1.5 rounded hover:bg-black/5 transition-colors"
              >
                {t("nav.catalog")}
              </Link>
              <Link
                href="/portal"
                className="px-3 py-1.5 rounded hover:bg-black/5 transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-neutral-600" />
                {t("nav.portal")}
              </Link>
              <Link
                href="/tracking"
                className="px-3 py-1.5 rounded hover:bg-black/5 transition-colors flex items-center gap-1.5 font-semibold text-[#0E4B94]"
              >
                <Ship className="w-4 h-4" />
                {t("nav.tracking")}
              </Link>
              <Link
                href="/cbm-calculator"
                className="px-3 py-1.5 rounded hover:bg-black/5 transition-colors flex items-center gap-1.5"
              >
                <Box className="w-4 h-4 text-neutral-600" />
                {t("nav.cbm")}
              </Link>
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded hover:bg-black/5 transition-colors"
              >
                {t("nav.admin")}
              </Link>
            </nav>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Multi-Currency Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                aria-label={t("checkout.selectCurrency") || "Chọn đơn vị tiền tệ"}
                className="appearance-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-xs font-mono font-bold px-2 py-1.5 pr-6 rounded cursor-pointer focus:outline-none focus:border-black transition-colors"
              >
                {Object.keys(CURRENCY_CONFIGS).map((cur) => (
                  <option key={cur} value={cur}>
                    {CURRENCY_CONFIGS[cur as Currency].label}
                  </option>
                ))}
              </select>
              <DollarSign className="w-3 h-3 absolute right-1.5 pointer-events-none text-neutral-500" />
            </div>

            {/* Language Toggle VI / EN */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold uppercase border border-black/20 hover:border-black rounded bg-white hover:bg-neutral-50 text-black transition-colors shadow-sm"
              title={language === "vi" ? "Switch to 100% English" : "Chuyển sang 100% Tiếng Việt"}
            >
              <Globe className="w-3.5 h-3.5 text-[#0E4B94]" />
              <span className="font-mono">{language === "vi" ? "VI" : "EN"}</span>
            </button>

            {/* Authentication Button or User Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 border border-black/20 hover:border-black rounded bg-white text-xs font-medium text-black transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-[#0E4B94] text-white flex items-center justify-center text-[10px] font-bold">
                    {user.fullName.charAt(0)}
                  </div>
                  <span className="hidden sm:inline max-w-[110px] truncate font-semibold">
                    {user.fullName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-neutral-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 shadow-xl rounded-md py-2 z-50">
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <p className="text-xs font-bold text-black">{user.fullName}</p>
                      <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-[#0E4B94]/10 text-[#0E4B94]">
                        {user.role === "B2B_BUYER"
                          ? language === "vi" ? "Doanh Nghiệp B2B" : "B2B Importer"
                          : user.role === "SUPER_ADMIN"
                          ? language === "vi" ? "Quản Trị Viên" : "Super Admin"
                          : language === "vi" ? "Khách Hàng Mua Lẻ" : "B2C Customer"}
                      </span>
                      {user.companyName && (
                        <p className="text-[10px] text-neutral-600 mt-1 flex items-center gap-1">
                          <Building className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate">{user.companyName}</span>
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      {user.role === "B2B_BUYER" && (
                        <Link
                          href="/portal"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#0E4B94]" />
                          <span>{t("nav.myRfqs")}</span>
                        </Link>
                      )}
                      {user.role === "SUPER_ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-100 transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5 text-[#C9252C]" />
                          <span>{t("nav.admin")}</span>
                        </Link>
                      )}
                      <Link
                        href="/tracking"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-100 transition-colors"
                      >
                        <Ship className="w-3.5 h-3.5 text-[#0E4B94]" />
                        <span>{t("nav.myShipments")}</span>
                      </Link>
                    </div>

                    <div className="border-t border-neutral-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t("nav.signOut")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-black/20 hover:border-black rounded bg-white text-black hover:bg-neutral-50 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-neutral-700" />
                <span className="hidden sm:inline">{t("nav.signIn")}</span>
              </button>
            )}

            {/* Cart Icon */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center justify-center p-2 rounded border border-black/20 hover:border-black text-black transition-colors"
              aria-label={t("nav.cart")}
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9252C] text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* B2B Buyer Quick Quote CTA */}
            <Link
              href="/portal"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#0E4B94] text-white text-xs uppercase tracking-wider font-semibold px-3 py-1.5 hover:bg-[#0a376d] transition-colors rounded shadow-sm"
            >
              <span>{t("nav.rfqQuoteBtn")}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-black"
              aria-label="Toggle menu"
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
              className="block py-2 text-sm font-semibold text-black hover:text-[#0E4B94]"
            >
              {t("nav.catalog")}
            </Link>
            <Link
              href="/portal"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-black hover:text-[#0E4B94]"
            >
              {t("nav.portal")}
            </Link>
            <Link
              href="/tracking"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#0E4B94]"
            >
              {t("nav.tracking")}
            </Link>
            <Link
              href="/cbm-calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-black hover:text-[#0E4B94]"
            >
              {t("nav.cbm")}
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-black hover:text-[#0E4B94]"
            >
              {t("nav.admin")}
            </Link>

            {!isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full text-left py-2 text-sm font-bold text-[#0E4B94] border-t border-neutral-100 mt-2 pt-3"
              >
                {t("nav.signIn")}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
};