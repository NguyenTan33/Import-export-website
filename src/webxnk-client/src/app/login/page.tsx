"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { isValidEmail } from "@/utils/validation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setFormError("Email không đúng định dạng.");
      return;
    }
    setFormError("");
    setIsSubmitting(true);
    const success = await login(email, password);
    if (success) router.push("/");
    else {
      setFormError("Email hoặc mật khẩu không chính xác, hoặc API chưa sẵn sàng.");
      setIsSubmitting(false);
    }
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

          {formError && <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 p-3">{formError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-[#0E4B94] hover:bg-[#0a376d] text-white py-2.5 text-xs font-bold font-mono uppercase tracking-wider transition-colors shadow-sm"
          >
            <span>{isSubmitting ? "Đang xử lý..." : t("auth.signInBtn")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs font-mono text-neutral-600">
          <Link href="/register" className="text-[#0E4B94] font-bold hover:underline">
            {t("auth.needAccount")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
