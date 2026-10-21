"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Package,
} from "lucide-react";
import { useCurrency, Currency, CURRENCY_CONFIGS } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { AuthModal } from "@/components/auth/AuthModal";

interface NavbarProps {
  cartCount?: number;
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { currency, setCurrency, isLiveRate } = useCurrency();
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const canAccessAdmin = user?.role === "SUPER_ADMIN" && !user.isDemo;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname?.startsWith("/product");
    return pathname?.startsWith(href);
  };

  const navLinkClass = (href: string) =>
    `px-2.5 xl:px-3 py-1.5 rounded transition-colors flex items-center gap-1 whitespace-nowrap ${
      isActive(href)
        ? "bg-[#0E4B94]/10 text-[#0E4B94] font-bold"
        : "text-black hover:bg-black/5 font-medium"
    }`;

  const effectiveCartCount = cartCount !== undefined ? cartCount : totalItemsCount;
  const handleCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
    } else {
      setIsCartOpen(true);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "vi" ? "en" : "vi");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/95 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Left: Brand Logo & Desktop Nav Links */}
          <div className="flex items-center gap-3 xl:gap-6 min-w-0">
            {/* Brand Logo - QUANG TẤN HOÀNG */}
            <Link href="/" className="group flex items-center gap-2.5 shrink-0">
              <img
                src="/logo.jpg"
                alt="Logo Quang Tấn Hoàng"
                width={40}
                height={40}
                style={{ width: "40px", height: "40px", objectFit: "contain" }}
                className="rounded transition-transform group-hover:scale-105 shrink-0"
              />
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-extrabold tracking-tight text-base sm:text-lg leading-tight whitespace-nowrap">
                  <span className="text-[#0E4B94]">QUANG TẤN </span>
                  <span className="text-[#C9252C]">HOÀNG</span>
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-wider text-neutral-500 uppercase font-semibold whitespace-nowrap">
                  {language === "vi"
                    ? "CÔNG TY TNHH SX & TM DV XNK"
                    : "IMPORT EXPORT TRADING CO., LTD"}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links - Single-line whitespace-nowrap */}
            <nav className="hidden lg:flex items-center gap-1 text-xs xl:text-sm whitespace-nowrap">
              <Link href="/" className={navLinkClass("/")}>
                <span>{t("nav.catalog")}</span>
              </Link>
              <Link href="/portal" className={navLinkClass("/portal")}>
                <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive("/portal") ? "text-[#0E4B94]" : "text-neutral-600"}`} />
                <span>{t("nav.portal")}</span>
              </Link>
              <Link href="/tracking" className={navLinkClass("/tracking")}>
                <Ship className={`w-3.5 h-3.5 shrink-0 ${isActive("/tracking") ? "text-[#0E4B94]" : "text-neutral-600"}`} />
                <span>{t("nav.tracking")}</span>
              </Link>
              <Link href="/cbm-calculator" className={navLinkClass("/cbm-calculator")}>
                <Box className={`w-3.5 h-3.5 shrink-0 ${isActive("/cbm-calculator") ? "text-[#0E4B94]" : "text-neutral-600"}`} />
                <span>{t("nav.cbm")}</span>
              </Link>
              {canAccessAdmin && (
                <Link href="/admin" className={navLinkClass("/admin")}>
                  <span>{t("nav.admin")}</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right Action Controls - Compact & Symmetrical */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
            {/* Multi-Currency Dropdown */}
            <div className="relative inline-flex items-center shrink-0" title={isLiveRate ? "Live FX Exchange Rates Synced" : "Standard FX Exchange Rates"}>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                aria-label={t("checkout.selectCurrency") || "Currency"}
                className="appearance-none bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-xs font-mono font-bold px-2 py-1.5 pr-5 rounded cursor-pointer focus:outline-none focus:border-black transition-colors whitespace-nowrap"
              >
                {Object.keys(CURRENCY_CONFIGS).map((cur) => (
                  <option key={cur} value={cur}>
                    {CURRENCY_CONFIGS[cur as Currency].label}
                  </option>
                ))}
              </select>
              <DollarSign className="w-3 h-3 absolute right-1 pointer-events-none text-neutral-500" />
            </div>

            {/* Language Toggle VI / EN */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold uppercase border border-black/20 hover:border-black rounded bg-white hover:bg-neutral-50 text-black transition-colors shadow-sm shrink-0 whitespace-nowrap"
              title={language === "vi" ? "Switch to 100% English" : "Chuyển sang 100% Tiếng Việt"}
            >
              <Globe className="w-3.5 h-3.5 text-[#0E4B94] shrink-0" />
              <span className="font-mono">{language === "vi" ? "VI" : "EN"}</span>
            </button>

            {/* Authentication Button or User Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 border border-black/20 hover:border-black rounded bg-white text-xs font-medium text-black transition-colors whitespace-nowrap"
                >
                  <div className="w-5 h-5 rounded-full bg-[#0E4B94] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {user.fullName.charAt(0)}
                  </div>
                  <span className="hidden sm:inline max-w-[90px] xl:max-w-[120px] truncate font-semibold">
                    {user.fullName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-neutral-500 shrink-0" />
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
                          : language === "vi" ? "Khách Mua Lẻ" : "B2C Customer"}
                      </span>
                      {user.companyName && (
                        <p className="text-[10px] text-neutral-600 mt-1 flex items-center gap-1">
                          <Building className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate">{user.companyName}</span>
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-800 hover:bg-neutral-100 transition-colors font-semibold"
                      >
                        <User className="w-3.5 h-3.5 text-[#0E4B94]" />
                        <span>{t("nav.profile")}</span>
                      </Link>
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
                      {canAccessAdmin && (
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
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-black/20 hover:border-black rounded bg-white text-black hover:bg-neutral-50 transition-colors shrink-0 whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                <span>{t("nav.signIn")}</span>
              </button>
            )}

            {/* Cart Icon */}
            <button
              onClick={handleCartClick}
              className="relative flex items-center justify-center p-2 rounded border border-black/20 hover:border-black text-black transition-colors shrink-0"
              aria-label={t("nav.cart")}
            >
              <ShoppingBag className="w-4 h-4" />
              {effectiveCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9252C] text-[10px] font-bold text-white">
                  {effectiveCartCount}
                </span>
              )}
            </button>

            {/* B2B Buyer Quick Quote CTA */}
            <Link
              href="/portal"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#0E4B94] text-white text-xs uppercase tracking-wider font-bold px-3 py-1.5 hover:bg-[#0a376d] transition-colors rounded shadow-sm shrink-0 whitespace-nowrap"
            >
              <span>{t("nav.rfqQuoteBtn")}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-black shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-xl">
            {/* User Info or Sign In on Mobile */}
            {isAuthenticated && user ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0E4B94] text-white flex items-center justify-center font-bold text-xs">
                      {user.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{user.fullName}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                    title={t("nav.signOut")}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[#0E4B94] font-semibold hover:underline flex items-center gap-1"
                  >
                    <User className="w-3.5 h-3.5" />
                    {t("nav.profile")}
                  </Link>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#0E4B94]">
                    {user.role === "B2B_BUYER" ? "B2B" : user.role === "SUPER_ADMIN" ? "ADMIN" : "B2C"}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0E4B94] text-white text-xs font-bold shadow-md shadow-blue-900/20"
              >
                <User className="w-4 h-4" />
                {t("nav.signIn")}
              </button>
            )}

            {/* Navigation Links */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                {t("nav.menuTitle")}
              </p>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <Package className="w-4 h-4 text-[#0E4B94]" />
                {t("nav.catalog")}
              </Link>
              <Link
                href="/portal"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <FileText className="w-4 h-4 text-[#0E4B94]" />
                {t("nav.portal")}
              </Link>
              <Link
                href="/tracking"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <Ship className="w-4 h-4 text-[#0E4B94]" />
                {t("nav.tracking")}
              </Link>
              <Link
                href="/cbm-calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <Box className="w-4 h-4 text-[#0E4B94]" />
                {t("nav.cbm")}
              </Link>
              {canAccessAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <Shield className="w-4 h-4 text-[#C9252C]" />
                  {t("nav.admin")}
                </Link>
              )}
              {isAuthenticated && (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#0E4B94] hover:bg-blue-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  {t("nav.profile")}
                </Link>
              )}
            </div>

            {/* Language & Currency on Mobile */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-500" />
                <button
                  onClick={toggleLanguage}
                  className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-bold hover:bg-slate-200"
                >
                  {language.toUpperCase()} ({language === "vi" ? "Tiếng Việt" : "English"})
                </button>
              </div>

              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="text-xs font-semibold bg-slate-100 border border-slate-200 rounded px-2 py-1 text-slate-800"
              >
                {Object.values(CURRENCY_CONFIGS).map((cfg) => (
                  <option key={cfg.code} value={cfg.code}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
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
