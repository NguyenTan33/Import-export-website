"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Anchor, Truck, FileCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export const Footer: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <footer className="w-full bg-black text-white border-t border-neutral-800 mt-20">
      {/* Top Highlights Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-b border-neutral-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-white shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold tracking-wide uppercase">
                {t("footer.exportStandards")}
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                {t("footer.exportStandardsDesc")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Anchor className="w-6 h-6 text-white shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold tracking-wide uppercase">
                {t("footer.departurePort")}
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                {t("footer.departurePortDesc")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="w-6 h-6 text-white shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold tracking-wide uppercase">
                {t("footer.incoterms")}
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                {t("footer.incotermsDesc")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileCheck className="w-6 h-6 text-white shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold tracking-wide uppercase">
                {t("footer.docs")}
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                {t("footer.docsDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <p className="font-bold text-white text-sm">
            {language === "vi"
              ? "CÔNG TY TNHH SX & TM DV XUẤT NHẬP KHẨU QUANG TẤN HOÀNG"
              : "QUANG TAN HOANG IMPORT EXPORT PRODUCTION TRADING SERVICES CO., LTD"}
          </p>
          <p className="text-neutral-400">
            {language === "vi"
              ? "QUANG TAN HOANG IMPORT EXPORT PRODUCTION TRADING SERVICES CO., LTD"
              : "Tax ID: 0317892345 | Head Office: VSIP 1 Industrial Park, Binh Duong"}
          </p>
          <p className="text-neutral-500 text-[11px] mt-0.5">
            {t("footer.factoryAddress")}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-white transition-colors">
            {t("nav.catalog")}
          </Link>
          <Link href="/portal" className="hover:text-white transition-colors">
            {t("nav.portal")}
          </Link>
          <Link href="/tracking" className="hover:text-white transition-colors text-[#3b82f6] font-semibold">
            {t("nav.tracking")}
          </Link>
          <Link href="/cbm-calculator" className="hover:text-white transition-colors">
            {t("nav.cbm")}
          </Link>
          <Link href="/admin" className="hover:text-white transition-colors">
            {t("nav.admin")}
          </Link>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-neutral-900 py-4 text-center text-[11px] text-neutral-500">
        {t("footer.allRights")}
      </div>
    </footer>
  );
};
