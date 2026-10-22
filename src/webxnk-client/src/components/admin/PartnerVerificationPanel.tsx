"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  CheckCircle2,
  XCircle,
  Globe,
  DollarSign,
  ShieldCheck,
  Clock,
  FileText,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { adminApi, paymentsApi } from "@/services/api";

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
  paymentStage?: string;
  paymentMethod?: string;
  amountUsd: number;
  bankReference: string;
  swiftCode: string;
  bankSlipFileUrl?: string;
  submittedDate: string;
  status: "PENDING_VERIFY" | "VERIFIED" | "REJECTED";
}

export const PartnerVerificationPanel: React.FC = () => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isVi = language === "vi";

  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [bankSlips, setBankSlips] = useState<PendingBankSlip[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getPendingCompanies()
      .then((apiCompanies) => {
        {
          const mapped: PendingCompany[] = apiCompanies.map((c) => ({
            id: c.id,
            companyName: c.companyName,
            taxId: c.taxId || c.taxIdentificationNumber || "",
            country: c.countryCode,
            website: c.website || "",
            address: c.businessAddress || "",
            repName: c.representativeName || "",
            email: c.contactEmail || "",
            phone: c.contactPhone || "",
            registeredDate: c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : "",
            isVerified: c.isVerified ?? c.verificationStatus === "VERIFIED",
          }));
          setCompanies(mapped);
        }
      })
      .catch(() => setLoadError(isVi ? "Không tải được hồ sơ doanh nghiệp." : "Could not load company applications."));

    paymentsApi
      .getAllB2BPayments()
      .then((apiSlips) => {
        {
          const mapped: PendingBankSlip[] = apiSlips.map((s) => {
            const rawStatus = s.verificationStatus || s.status;
            const rawDate = s.submittedAt || s.createdAt;
            return {
              id: s.id,
              rfqId: s.rfqNumber,
              companyName: s.companyName || "",
              paymentStage: s.paymentStage,
              paymentMethod: s.paymentMethod,
              amountUsd: s.amountUsd,
              bankReference: s.swiftReference,
              swiftCode: s.paymentMethod,
              bankSlipFileUrl: s.bankSlipFileUrl,
              submittedDate: rawDate
                ? new Date(rawDate).toISOString().slice(0, 10)
                : "",
              status:
                rawStatus === "VERIFIED"
                  ? "VERIFIED"
                  : rawStatus === "REJECTED"
                  ? "REJECTED"
                  : "PENDING_VERIFY",
            };
          });
          setBankSlips(mapped);
        }
      })
      .catch(() => setLoadError(isVi ? "Không tải được chứng từ thanh toán." : "Could not load payment slips."));
  }, [isVi]);

  const handleVerifyCompany = async (id: number, approve: boolean) => {
    try {
      await adminApi.verifyCompany(id, approve);
      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, isVerified: approve } : c)));
      setLoadError(null);
    } catch {
      setLoadError(isVi ? "Không thể cập nhật trạng thái doanh nghiệp." : "Could not update company status.");
      return;
    }

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

  const handleVerifyBankSlip = async (id: number, approve: boolean) => {
    try {
      await paymentsApi.verifyBankSlip(
        id,
        approve,
        approve
          ? "Verified by Finance Department against SWIFT MT103 statement"
          : "Rejected by Finance Department"
      );
      setBankSlips((prev) => prev.map((s) => (s.id === id ? { ...s, status: approve ? "VERIFIED" : "REJECTED" } : s)));
      setLoadError(null);
    } catch {
      setLoadError(isVi ? "Không thể cập nhật chứng từ thanh toán." : "Could not update payment slip.");
      return;
    }

    const slip = bankSlips.find((s) => s.id === id);
    setNotification(
      isVi
        ? approve
          ? `Đã xác nhận thanh toán cho đơn ${slip?.rfqId}. Đơn hàng đã chuyển sang trạng thái: ĐANG SẢN XUẤT (IN_PRODUCTION).`
          : `Đã từ chối ủy nhiệm chi cho đơn ${slip?.rfqId}.`
        : approve
          ? `Confirmed wire transfer for ${slip?.rfqId}. RFQ status advanced to: IN_PRODUCTION.`
          : `Rejected bank slip for ${slip?.rfqId}.`
    );
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-8">
      {loadError && <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{loadError}</div>}
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
          {companies.map((comp, index) => (
            <div
              key={comp.id ?? comp.companyName ?? `company-${index}`}
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
                    <a href={`https://${comp.website.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1">
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
              {isVi ? "2. Thẩm Định Ủy Nhiệm Chi Chuyển Tiền T/T & L/C (EXP-60 đến EXP-63)" : "2. T/T & L/C Wire Transfer Verification"}
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
                <th className="py-3.5 px-4">{isVi ? "Số Tiền Chuyển" : "Wire Amount"}</th>
                <th className="py-3.5 px-4">{isVi ? "Mã Giao Dịch SWIFT / Chứng từ" : "SWIFT Ref / Slip"}</th>
                <th className="py-3.5 px-4">{isVi ? "Ngày Nộp" : "Submitted Date"}</th>
                <th className="py-3.5 px-4">{isVi ? "Trạng Thái" : "Status"}</th>
                <th className="py-3.5 px-4 text-right">{isVi ? "Thao Tác" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {bankSlips.map((slip, index) => (
                <tr key={slip.id ?? `${slip.rfqId}-${index}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-[#0E4B94] block">{slip.rfqId}</span>
                    <span className="text-slate-800 font-medium">{slip.companyName}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-sm">
                    {formatPrice(slip.amountUsd)}
                    {slip.paymentStage && (
                      <span className="block text-[10px] font-normal text-slate-500">
                        {slip.paymentStage === "DEPOSIT_30"
                          ? isVi
                            ? "Đặt cọc 30%"
                            : "30% Deposit"
                          : isVi
                          ? "Tất toán 70%"
                          : "70% Balance"}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-semibold text-slate-900 block">{slip.bankReference}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>SWIFT: {slip.swiftCode}</span>
                      {slip.bankSlipFileUrl && (
                        <span className="inline-flex items-center gap-0.5 text-blue-600 font-semibold">
                          <FileText className="w-3 h-3" /> PDF
                        </span>
                      )}
                    </div>
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
