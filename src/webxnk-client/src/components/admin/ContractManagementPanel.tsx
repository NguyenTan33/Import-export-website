"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminApi, contractsApi } from "@/services/api";
import { SalesContract, RfqCounterOffer, SubmitCounterOfferRequest } from "@/types";
import { CounterOfferTimeline } from "@/components/portal/CounterOfferTimeline";
import { SalesContractViewer } from "@/components/portal/SalesContractViewer";
import {
  FileCheck,
  FileSignature,
  Building,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  Layers,
} from "lucide-react";

interface AdminRfqSummary {
  id: number;
  rfqNumber: string;
  companyName: string;
  incotermCode: string;
  status: string;
  totalQuotedAmountUsd: number;
}

export const ContractManagementPanel: React.FC = () => {
  const [rfqs, setRfqs] = useState<AdminRfqSummary[]>([]);
  const [selectedRfqId, setSelectedRfqId] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<"negotiate" | "contract">("contract");
  const [contract, setContract] = useState<SalesContract | null>(null);
  const [offers, setOffers] = useState<RfqCounterOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getAllRfqs()
      .then((data) => {
        const rows = Array.isArray(data) ? data as AdminRfqSummary[] : [];
        setRfqs(rows);
        if (rows.length) setSelectedRfqId(rows[0].id);
      })
      .catch(() => setStatusMessage("Không thể tải danh sách RFQ từ máy chủ."));
  }, []);

  // Load contract and counter offers for selected RFQ
  const loadData = useCallback(async (rfqId: number) => {
    if (!rfqId) {
      setContract(null);
      setOffers([]);
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const [contractData, offersData] = await Promise.all([
        contractsApi.getContractByRfqId(rfqId),
        contractsApi.getCounterOffers(rfqId),
      ]);
      setContract(contractData);
      setOffers(offersData);
    } catch {
      setContract(null);
      setOffers([]);
      setStatusMessage("Không thể tải dữ liệu hợp đồng và đàm phán từ máy chủ.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRfqId) void loadData(selectedRfqId);
  }, [selectedRfqId, loadData]);

  // Handle Generate Contract
  const handleGenerateContract = async () => {
    setIsLoading(true);
    try {
      const generated = await contractsApi.generateContractFromRfq(selectedRfqId);
      setContract(generated);
      setStatusMessage("Khởi tạo Hợp đồng Mua bán Quốc tế thành công từ dữ liệu RFQ!");
      setActiveSubTab("contract");
    } catch {
      setStatusMessage("Không thể tạo hợp đồng. Vui lòng kiểm tra RFQ và thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Seller Digital Signature & Stamp
  const handleSignAsSeller = async (
    signatureData: string,
    signerName: string,
    signerTitle: string,
    includeCompanyStamp = true
  ) => {
    if (!contract) return;
    setIsSigning(true);
    setStatusMessage(null);
    try {
      const updated = await contractsApi.signContractSeller(contract.id, {
        signerName,
        signerTitle,
        signatureData,
        includeCompanyStamp,
      });
      setContract(updated);
      setStatusMessage("Đại diện Bên Bán đã ký số và đóng mộc đỏ pháp nhân thành công!");
    } catch {
      setStatusMessage("Không thể ký hợp đồng trên máy chủ. Chữ ký chưa được lưu.");
    } finally {
      setIsSigning(false);
    }
  };

  // Handle Download PDF
  const handleDownloadContractPdf = async () => {
    if (!contract) return;
    try {
      const blob = await contractsApi.downloadContractPdf(contract.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sales_Contract_${contract.contractNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setStatusMessage(`Tải xuống thành công: Sales_Contract_${contract.contractNumber}.pdf`);
    } catch {
      alert("Đang xuất bản file PDF hợp đồng trực tiếp từ QuestPDF...");
    }
  };

  // Handle Submit Counter Offer
  const handleSubmitOffer = async (payload: SubmitCounterOfferRequest) => {
    setIsLoading(true);
    try {
      const newOffer = await contractsApi.submitCounterOffer(selectedRfqId, payload, "SELLER");
      setOffers([...offers, newOffer]);
      setStatusMessage("Đã gửi đề xuất phản hồi giá cho đối tác mua hàng!");
    } catch {
      setStatusMessage("Không thể gửi đề xuất. Máy chủ chưa ghi nhận thay đổi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Accept Counter Offer
  const handleAcceptOffer = async (offerId: number) => {
    setIsLoading(true);
    try {
      await contractsApi.acceptCounterOffer(selectedRfqId, offerId);
      setOffers(
        offers.map((o) => (o.id === offerId ? { ...o, status: "ACCEPTED" } : o))
      );
      setStatusMessage("Đã chấp thuận đề xuất đàm phán! Bây giờ bạn có thể tạo hợp đồng.");
    } catch {
      setStatusMessage("Không thể chấp thuận đề xuất trên máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-black bg-white p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-black pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            E-CONTRACT & B2B NEGOTIATION SUITE (EXP-80 TO EXP-89)
          </span>
          <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-[#0E4B94]" />
            Quản Lý Hợp Đồng Ngoại Thương & Đàm Phán B2B Đa Vòng
          </h2>
          <p className="text-xs text-neutral-600 mt-1 font-mono">
            Hợp đồng ICC Model International Sale Contract, chữ ký điện tử kép, mộc đỏ pháp nhân và mã băm SHA-256.
          </p>
        </div>

        {/* RFQ Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono font-bold text-black flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#0E4B94]" />
            Chọn Đơn RFQ:
          </label>
          <select
            value={selectedRfqId}
            onChange={(e) => setSelectedRfqId(Number(e.target.value))}
            className="border border-black px-3 py-1.5 text-xs font-mono bg-neutral-50 font-bold focus:outline-none"
          >
            {rfqs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.rfqNumber} — {r.companyName.substring(0, 28)}...
              </option>
            ))}
          </select>

          <button
            onClick={() => loadData(selectedRfqId)}
            disabled={!selectedRfqId || isLoading}
            className="p-1.5 border border-black hover:bg-neutral-100 transition rounded"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex border-b border-neutral-300 gap-2">
        <button
          onClick={() => setActiveSubTab("contract")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase transition-colors border-b-2 -mb-px ${
            activeSubTab === "contract"
              ? "border-[#0E4B94] text-[#0E4B94] bg-blue-50/50"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Hợp Đồng Điện Tử (E-Contract ICC)</span>
          {contract && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                contract.status === "LEGALLY_BINDING"
                  ? "bg-emerald-100 text-emerald-800"
                  : contract.status === "SELLER_SIGNED"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-neutral-200 text-neutral-700"
              }`}
            >
              {contract.status}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("negotiate")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase transition-colors border-b-2 -mb-px ${
            activeSubTab === "negotiate"
              ? "border-[#0E4B94] text-[#0E4B94] bg-blue-50/50"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Lịch Sử Đàm Phán Đa Vòng ({offers.length} Vòng)</span>
        </button>
      </div>

      {/* Feedback banner */}
      {statusMessage && (
        <div className="p-3 border border-emerald-600 bg-emerald-50 flex items-center gap-2 text-xs font-mono text-emerald-900 rounded">
          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Sub-tab 1: Contract Viewer */}
      {activeSubTab === "contract" && (
        <div className="space-y-4">
          {!contract ? (
            <div className="border-2 border-dashed border-neutral-300 p-8 text-center bg-neutral-50 rounded-xl space-y-3">
              <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto" />
              <div className="text-sm font-bold text-neutral-700">
                {selectedRfqId ? `Chưa có hợp đồng nào được tạo cho RFQ #${selectedRfqId}` : "Chưa có RFQ trong CSDL."}
              </div>
              <p className="text-xs text-neutral-500 max-w-md mx-auto font-mono">
                Sau khi đàm phán giá và các điều khoản thành công, bạn có thể tạo hợp đồng chuẩn ICC
                Model Contract tự động với đầy đủ các điều 1 đến 6.
              </p>
              <button
                onClick={handleGenerateContract}
                disabled={isLoading || !selectedRfqId}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase bg-[#0E4B94] text-white hover:bg-blue-800 transition rounded shadow"
              >
                <PlusCircle className="w-4 h-4" />
                Khởi Tạo Hợp Đồng Ngoại Thương
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-neutral-50 p-3 border border-neutral-200 rounded text-xs font-mono">
                <div className="flex items-center gap-4">
                  <span>
                    Mã Hợp Đồng: <strong className="text-black">{contract.contractNumber}</strong>
                  </span>
                  <span>
                    Tổng Giá Trị:{" "}
                    <strong className="text-[#0E4B94]">
                      ${contract.totalAmountUsd.toLocaleString()} USD
                    </strong>
                  </span>
                  <span>
                    Incoterms: <strong className="text-black">{contract.incotermCode}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {contract.status === "DRAFT" && (
                    <button
                      onClick={() => handleGenerateContract()}
                      className="text-[11px] font-bold text-[#0E4B94] hover:underline"
                    >
                      Đồng bộ lại từ RFQ
                    </button>
                  )}
                </div>
              </div>

              <SalesContractViewer
                contract={contract}
                userRole="ADMIN"
                onSignContract={handleSignAsSeller}
                onDownloadPdf={handleDownloadContractPdf}
                isSigning={isSigning}
              />
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Counter-Offer Timeline */}
      {activeSubTab === "negotiate" && (
        <div className="space-y-4">
          <CounterOfferTimeline
            rfqId={selectedRfqId}
            currentStatus={rfqs.find((rfq) => rfq.id === selectedRfqId)?.status ?? ""}
            offers={offers}
            userRole="ADMIN"
            currentUnitPrice={0}
            currentIncoterm={rfqs.find((rfq) => rfq.id === selectedRfqId)?.incotermCode ?? ""}
            currentPaymentTerms=""
            onSubmitCounterOffer={handleSubmitOffer}
            onAcceptCounterOffer={handleAcceptOffer}
            onGenerateContract={handleGenerateContract}
            isSubmitting={isLoading}
            hasContract={!!contract}
          />
        </div>
      )}
    </div>
  );
};
