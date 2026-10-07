"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Building2, Phone, ArrowRight, ArrowLeft, ShieldCheck, Globe } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<"b2c" | "b2b">("b2b");
  const { registerB2c, registerB2b } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // B2B Company states
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [country, setCountry] = useState("Japan");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountType === "b2b") {
      if (!companyName || !taxId || !email) return;
      await registerB2b({
        companyName,
        taxId,
        country,
        companyAddress,
        companyWebsite,
        fullName,
        email,
        phone,
        password,
      });
    } else {
      if (!fullName || !email) return;
      await registerB2c({ fullName, email, phone, password });
    }
    router.push("/");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-xl bg-white border border-neutral-300 shadow-md p-8 space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-black mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-[#0E4B94] rounded flex items-center justify-center text-white font-black text-xs">
              QTH
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 font-mono">
              {accountType === "b2b" ? t("auth.registerB2bTitle") : t("auth.registerB2cTitle")}
            </h1>
          </div>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            {accountType === "b2b" ? t("auth.registerB2bSubtitle") : t("auth.registerB2cSubtitle")}
          </p>
        </div>

        {/* Account Type Toggle */}
        <div className="flex border border-neutral-300 bg-neutral-100 p-1 rounded text-xs font-mono">
          <button
            type="button"
            onClick={() => setAccountType("b2b")}
            className={`flex-1 py-2 font-bold uppercase transition-colors rounded ${
              accountType === "b2b"
                ? "bg-[#0E4B94] text-white shadow-sm"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            🏢 Doanh nghiệp Nhập khẩu B2B
          </button>
          <button
            type="button"
            onClick={() => setAccountType("b2c")}
            className={`flex-1 py-2 font-bold uppercase transition-colors rounded ${
              accountType === "b2c"
                ? "bg-black text-white shadow-sm"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            🛒 Khách mua lẻ B2C
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {accountType === "b2b" && (
            <>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-[11px] font-mono text-[#0E4B94] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  Doanh nghiệp đăng ký sẽ được phê duyệt mã đối tác (Partner Code) để áp dụng giá sỉ container và xuất Proforma Invoice tự động.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                  {t("auth.companyName")} *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="TOKYO OVERSEAS TRADING CO., LTD"
                    className="w-full border border-neutral-300 pl-10 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                    {t("auth.taxId")} *
                  </label>
                  <input
                    type="text"
                    required
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="VAT / Tax Identification"
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                    {t("auth.country")} *
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Japan / USA / Germany"
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                  {t("auth.companyAddress")}
                </label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Headquarters Address"
                  className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                  {t("auth.companyWebsite")}
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full border border-neutral-300 pl-10 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                {t("auth.fullName")} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mr. Kenji Sato"
                  className="w-full border border-neutral-300 pl-10 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                {t("auth.phone")}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+81 3 5555 0192"
                  className="w-full border border-neutral-300 pl-10 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                {t("auth.email")} *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="purchasing@company.com"
                  className="w-full border border-neutral-300 pl-10 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                {t("auth.password")} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-neutral-300 pl-10 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#0E4B94] hover:bg-[#0a376d] text-white py-2.5 text-xs font-bold font-mono uppercase tracking-wider transition-colors shadow-sm"
          >
            <span>{t("auth.registerBtn")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs font-mono text-neutral-600">
          <Link href="/login" className="text-[#0E4B94] font-bold hover:underline">
            {t("auth.alreadyHaveAccount")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
