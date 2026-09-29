"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loginAsDemo } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await login(email, password);
    router.push("/");
  };

  const handleDemo = (type: "b2c" | "b2b" | "admin") => {
    loginAsDemo(type);
    router.push("/");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md bg-white border border-neutral-300 shadow-md p-8 space-y-6">
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
              {t("auth.signInTitle")}
            </h1>
          </div>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            {t("auth.signInSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
        </form>

        {/* Quick Demo Logins */}
        <div className="pt-4 border-t border-neutral-200">
          <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-2 font-bold">
            {t("auth.quickDemoLogin")}
          </span>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleDemo("b2b")}
              className="p-2 border border-[#0E4B94] hover:bg-blue-50 bg-blue-50/50 text-xs font-mono font-bold text-[#0E4B94] rounded transition-colors text-left flex items-center justify-between"
            >
              <span>🏢 {t("auth.demoB2b")}</span>
              <span className="text-[10px] bg-[#0E4B94] text-white px-2 py-0.5 rounded">1-Click</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo("b2c")}
              className="p-2 border border-neutral-300 hover:border-black bg-neutral-50 text-xs font-mono font-semibold text-neutral-800 rounded transition-colors text-left flex items-center justify-between"
            >
              <span>🛒 {t("auth.demoB2c")}</span>
              <span className="text-[10px] bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded">1-Click</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo("admin")}
              className="p-2 border border-neutral-800 bg-neutral-900 text-xs font-mono font-bold text-white rounded transition-colors text-left flex items-center justify-between"
            >
              <span>🛡️ {t("auth.demoAdmin")}</span>
              <span className="text-[10px] bg-neutral-700 text-white px-2 py-0.5 rounded">1-Click</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-2 text-xs font-mono text-neutral-600">
          <Link href="/register" className="text-[#0E4B94] font-bold hover:underline">
            {t("auth.needAccount")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
