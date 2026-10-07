"use client";

import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  Building2,
  Globe,
  Phone,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "register_b2c" | "register_b2b";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "signin",
}) => {
  const [tab, setTab] = useState<"signin" | "register_b2c" | "register_b2b">(defaultTab);
  const { login, loginAsDemo, registerB2c, registerB2b } = useAuth();
  const { t } = useLanguage();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // B2B specific states
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [country, setCountry] = useState("Japan");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await login(email, password);
    onClose();
  };

  const handleRegisterB2c = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) return;
    await registerB2c({ fullName, email, phone, password });
    onClose();
  };

  const handleRegisterB2b = async (e: React.FormEvent) => {
    e.preventDefault();
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
    onClose();
  };

  const handleDemoClick = (type: "b2c" | "b2b" | "admin") => {
    loginAsDemo(type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white border border-black shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Top Header */}
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-[#0E4B94] rounded flex items-center justify-center text-white font-black text-xs">
              QTH
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                {tab === "signin"
                  ? t("auth.signInTitle")
                  : tab === "register_b2c"
                  ? t("auth.registerB2cTitle")
                  : t("auth.registerB2bTitle")}
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono">
                CÔNG TY TNHH SX & TM DV XNK QUANG TẤN HOÀNG
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 text-xs font-mono">
          <button
            type="button"
            onClick={() => setTab("signin")}
            className={`flex-1 py-3 text-center font-bold uppercase transition-colors border-b-2 ${
              tab === "signin"
                ? "border-[#0E4B94] bg-white text-[#0E4B94]"
                : "border-transparent text-neutral-500 hover:text-black"
            }`}
          >
            {t("auth.signInBtn")}
          </button>
          <button
            type="button"
            onClick={() => setTab("register_b2c")}
            className={`flex-1 py-3 text-center font-bold uppercase transition-colors border-b-2 ${
              tab === "register_b2c"
                ? "border-[#0E4B94] bg-white text-[#0E4B94]"
                : "border-transparent text-neutral-500 hover:text-black"
            }`}
          >
            {t("auth.registerB2cTitle")}
          </button>
          <button
            type="button"
            onClick={() => setTab("register_b2b")}
            className={`flex-1 py-3 text-center font-bold uppercase transition-colors border-b-2 ${
              tab === "register_b2b"
                ? "border-[#0E4B94] bg-white text-[#0E4B94]"
                : "border-transparent text-neutral-500 hover:text-black"
            }`}
          >
            {t("auth.registerB2bTitle")}
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {/* TAB 1: SIGN IN */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                  {t("auth.email")}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full border border-neutral-300 pl-10 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                  {t("auth.password")}
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

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#0E4B94] hover:bg-[#0a376d] text-white py-2.5 text-xs font-bold font-mono uppercase tracking-wider transition-colors shadow-sm"
              >
                <span>{t("auth.signInBtn")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 1-Click Fast Demo Logins */}
              <div className="pt-3 border-t border-neutral-200">
                <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-2 font-bold">
                  {t("auth.quickDemoLogin")}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoClick("b2c")}
                    className="p-2 border border-neutral-300 hover:border-black bg-neutral-50 text-[11px] font-mono font-semibold text-neutral-800 rounded transition-colors text-center"
                  >
                    🛒 {t("auth.demoB2c")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoClick("b2b")}
                    className="p-2 border border-[#0E4B94] hover:bg-blue-50 bg-blue-50/50 text-[11px] font-mono font-bold text-[#0E4B94] rounded transition-colors text-center"
                  >
                    🏢 {t("auth.demoB2b")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoClick("admin")}
                    className="p-2 border border-neutral-800 bg-neutral-900 text-[11px] font-mono font-bold text-white rounded transition-colors text-center"
                  >
                    🛡️ {t("auth.demoAdmin")}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER B2C */}
          {tab === "register_b2c" && (
            <form onSubmit={handleRegisterB2c} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                  {t("auth.fullName")}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyen Van A"
                    className="w-full border border-neutral-300 pl-10 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                  {t("auth.email")}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="buyer@gmail.com"
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
                    placeholder="+84 901 234 567"
                    className="w-full border border-neutral-300 pl-10 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                  {t("auth.password")}
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

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 text-white py-2.5 text-xs font-bold font-mono uppercase tracking-wider transition-colors shadow-sm"
              >
                <span>{t("auth.registerBtn")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: REGISTER B2B COMPANY */}
          {tab === "register_b2b" && (
            <form onSubmit={handleRegisterB2b} className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded text-[11px] font-mono text-[#0E4B94] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  Đăng ký tài khoản doanh nghiệp để được chiết khấu giá sỉ container và hỗ trợ thanh toán T/T.
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                    {t("auth.taxId")} *
                  </label>
                  <input
                    type="text"
                    required
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="VAT / Tax Code"
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
                  placeholder="Corporate Headquarters Address"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                    {t("auth.fullName")} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Mr. Kenji Sato"
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                    {t("auth.phone")}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+81 3 5555 0192"
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                    {t("auth.email")} *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="purchasing@company.com"
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 mb-1">
                    {t("auth.password")} *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-neutral-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#0E4B94] hover:bg-[#0a376d] text-white py-2.5 text-xs font-bold font-mono uppercase tracking-wider transition-colors shadow-sm"
              >
                <span>Đăng Ký & Mở Khóa Giá Sỉ B2B</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
