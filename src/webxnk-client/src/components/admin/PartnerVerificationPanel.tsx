"use client";

import React, { useState } from "react";
import { 
  Building, 
  CheckCircle2, 
  XCircle, 
  Globe, 
  DollarSign, 
  ShieldCheck, 
  Clock
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

interface PendingCompany {
  id: number;
  companyName: string;
  taxId: string;
  country: string;
  website: string;
  address: string;
  repName: string;
  email: string;
  phone: string;
  registeredDate: string;
  isVerified: boolean;
}

interface PendingBankSlip {
  id: number;
  rfqId: string;
  companyName: string;
  amountUsd: number;
  bankReference: string;
  swiftCode: string;
  submittedDate: string;
  status: "PENDING_VERIFY" | "VERIFIED" | "REJECTED";
}

const INITIAL_COMPANIES: PendingCompany[] = [
  {
    id: 101,
    companyName: "Tokyo Overseas Logistics Co., Ltd",
    taxId: "JP-9010401012345",
    country: "Japan",
    website: "www.tokyotrading.co.jp",
    address: "2-3-1 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan",
    repName: "Kenji Sato",
    email: "sato@tokyotrading.co.jp",
    phone: "+81 3 1234 5678",
    registeredDate: "2026-09-24",
    isVerified: true,
  },
  {
    id: 102,
    companyName: "Hamburg EuroPort Import GmbH",
    taxId: "DE-312984719",
    country: "Germany",
    website: "www.europort-hamburg.de",
    address: "Am Sandtorkai 48, 20457 Hamburg, Germany",
    repName: "Hans Müller",
    email: "muller.h@europort.de",
    phone: "+49 40 8829 100",
    registeredDate: "2026-09-29",
    isVerified: false,
  },
  {
    id: 103,
    companyName: "California Harvest Foods Inc",
    taxId: "US-94-3281902",
    country: "United States",
    website: "www.calharvest.com",
    address: "1000 Harbor Blvd, Long Beach, CA 90802, USA",
    repName: "Sarah Jenkins",
    email: "procurement@calharvest.com",
    phone: "+1 562 555 0192",
    registeredDate: "2026-09-30",
    isVerified: false,
  },
];

const INITIAL_BANK_SLIPS: PendingBankSlip[] = [
  {
    id: 501,
    rfqId: "RFQ-2026-QTH-001",
    companyName: "Tokyo Overseas Logistics Co., Ltd",
    amountUsd: 25350, // 30% of $84,500
    bankReference: "SWIFT-MT103-MUFG-2026-8812",
    swiftCode: "BOTKJPJT",
    submittedDate: "2026-09-27",
    status: "PENDING_VERIFY",
  },
  {
    id: 502,
    rfqId: "RFQ-2026-QTH-002",
    companyName: "California Harvest Foods Inc",
    amountUsd: 73800, // 30% of $246,000
    bankReference: "FEDWIRE-BOA-2026-09941",
    swiftCode: "BOFAUS3N",
    submittedDate: "2026-09-28",
    status: "PENDING_VERIFY",
  },
];

export const PartnerVerificationPanel: React.FC = () => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isVi = language === "vi";

  const [companies, setCompanies] = useState<PendingCompany[]>(INITIAL_COMPANIES);
  const [bankSlips, setBankSlips] = useState<PendingBankSlip[]>(INITIAL_BANK_SLIPS);
  const [notification, setNotification] = useState<string | null>(null);

  const handleVerifyCompany = (id: number, approve: boolean) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isVerified: approve } : c))
    );
    const company = companies.find((c) => c.id === id);
    setNotification(
      isVi
        ? approve
          ? `Đã phê duyệt pháp nhân cho ${company?.companyName}. Chính sách giá sỉ container đã được mở khóa.`
          : `Đã từ chối cấp phép cho ${company?.companyName}.`
        : approve
          ? `Verified corporate credentials for ${company?.companyName}. Wholesale container tier pricing unlocked.`
          : `Rejected application for ${company?.companyName}.`
    );
    setTimeout(() => setNotification(null), 4000);
  };

  const handleVerifyBankSlip = (id: number, approve: boolean) => {
    setBankSlips((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: approve ? "VERIFIED" : "REJECTED" } : s))
    );
    const slip = bankSlips.find((s) => s.id === id);
    setNotification(
      isVi
        ? approve
          ? `Đã xác nhận đặt cọc 30% cho đơn ${slip?.rfqId}. Đơn hàng đã chuyển sang trạng thái: ĐANG SẢN XUẤT (IN_PRODUCTION).`
          : `Đã từ chối ủy nhiệm chi cho đơn ${slip?.rfqId}.`
        : approve
          ? `Confirmed 30% deposit for ${slip?.rfqId}. RFQ status advanced to: IN_PRODUCTION.`
          : `Rejected bank slip for ${slip?.rfqId}.`
    );
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-8">
      {/* Alert banner */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* SECTION 1: DOANH NGHIỆP B2B ĐĂNG KÝ MỚI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-[#0E4B94]" />
              {isVi ? "1. Phê Duyệt Hồ Sơ Pháp Nhân Doanh Nghiệp B2B (EXP-14, EXP-15)" : "1. B2B Corporate Verification Suite"}
            </h2>
            <p className="text-xs text-slate-500">
              {isVi 
                ? "Thẩm định giấy phép kinh doanh, mã số thuế và mở khóa hạn mức giá sỉ container cho đối tác quốc tế."
                : "Verify business registration, Tax ID, and unlock wholesale container tier pricing for overseas buyers."}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-blue-100 text-[#0E4B94] font-bold text-xs">
            {companies.filter((c) => !c.isVerified).length} {isVi ? "chờ thẩm định" : "pending"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((comp) => (
            <div 
              key={comp.id}
              className={`bg-white rounded-xl p-5 border shadow-sm space-y-3 transition-all ${
                comp.isVerified ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{comp.companyName}</h3>
                  <p className="text-xs text-slate-500">{comp.country}</p>
                </div>
                {comp.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    {isVi ? "ĐÃ XÁC THỰC" : "VERIFIED"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    <Clock className="w-3 h-3 text-amber-600" />
                    {isVi ? "CHỜ DUYỆT" : "PENDING"}
                  </span>
                )}
              </div>

              <dl className="text-xs space-y-1.5 text-slate-600 border-t border-slate-100 pt-2">
                <div className="flex justify-between">
                  <dt className="text-slate-400">{isVi ? "Mã số thuế:" : "Tax ID / VAT:"}</dt>
                  <dd className="font-mono font-semibold text-slate-800">{comp.taxId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">{isVi ? "Người đại diện:" : "Representative:"}</dt>
                  <dd className="font-medium text-slate-800">{comp.repName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Email:</dt>
                  <dd className="text-slate-700 truncate max-w-[150px]">{comp.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Website:</dt>
                  <dd className="text-blue-600 hover:underline">
                    <a href={`https://${comp.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {comp.website}
                    </a>
                  </dd>
                </div>
              </dl>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                {!comp.isVerified ? (
                  <>
                    <button
                      onClick={() => handleVerifyCompany(comp.id, false)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                    >
                      {isVi ? "Từ chối" : "Reject"}
                    </button>
                    <button
                      onClick={() => handleVerifyCompany(comp.id, true)}
                      className="px-3 py-1.5 rounded-lg bg-[#0E4B94] hover:bg-[#0b3d78] text-white text-xs font-bold shadow-sm"
                    >
                      {isVi ? "Phê Duyệt Pháp Nhân" : "Verify Corporate"}
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isVi ? "Đã mở khóa giá sỉ FCL" : "FCL Wholesale Unlocked"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: THẨM ĐỊNH ỦY NHIỆM CHI T/T ĐẶT CỌC 30% */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              {isVi ? "2. Thẩm Định Ủy Nhiệm Chi Chuyển Tiền T/T Đặt Cọc 30% (EXP-60 đến EXP-63)" : "2. T/T Wire Transfer Deposit Verification"}
            </h2>
            <p className="text-xs text-slate-500">
              {isVi 
                ? "Kế toán kiểm tra giao dịch điện tín SWIFT MT103 / Bank Slip từ tài khoản quốc tế trước khi đưa lệnh sản xuất vào nhà máy."
                : "Finance team reconciles incoming SWIFT MT103 wire deposits before pushing batch order to factory floor."}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">
            {bankSlips.filter((s) => s.status === "PENDING_VERIFY").length} {isVi ? "chờ đối soát" : "pending reconciliation"}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{isVi ? "Mã RFQ / Đối Tác" : "RFQ / Partner"}</th>
                <th className="py-3.5 px-4">{isVi ? "Số Tiền Đặt Cọc (30%)" : "Deposit Amount (30%)"}</th>
                <th className="py-3.5 px-4">{isVi ? "Mã Giao Dịch SWIFT / Bank Ref" : "SWIFT Ref / Wire Code"}</th>
                <th className="py-3.5 px-4">{isVi ? "Ngày Nộp" : "Submitted Date"}</th>
                <th className="py-3.5 px-4">{isVi ? "Trạng Thái" : "Status"}</th>
                <th className="py-3.5 px-4 text-right">{isVi ? "Thao Tác" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {bankSlips.map((slip) => (
                <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-[#0E4B94] block">{slip.rfqId}</span>
                    <span className="text-slate-800 font-medium">{slip.companyName}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-sm">
                    {formatPrice(slip.amountUsd)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-semibold text-slate-900 block">{slip.bankReference}</span>
                    <span className="text-[10px] text-slate-400">SWIFT: {slip.swiftCode}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {slip.submittedDate}
                  </td>
                  <td className="py-3.5 px-4">
                    {slip.status === "PENDING_VERIFY" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        {isVi ? "Chờ Kế Toán Duyệt" : "Pending Audit"}
                      </span>
                    )}
                    {slip.status === "VERIFIED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {isVi ? "Đã Xác Nhận Cọc" : "Deposit Approved"}
                      </span>
                    )}
                    {slip.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="w-3 h-3" />
                        {isVi ? "Đã Từ Chối" : "Rejected"}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {slip.status === "PENDING_VERIFY" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleVerifyBankSlip(slip.id, false)}
                          className="px-2.5 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                        >
                          {isVi ? "Từ chối" : "Reject"}
                        </button>
                        <button
                          onClick={() => handleVerifyBankSlip(slip.id, true)}
                          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                        >
                          {isVi ? "Xác Nhận Cọc 30%" : "Confirm Deposit"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {isVi ? "Hoàn tất" : "Completed"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
