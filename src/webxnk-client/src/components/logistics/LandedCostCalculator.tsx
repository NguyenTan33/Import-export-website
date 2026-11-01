"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LandedCostResult } from "@/types";
import { pricingApi } from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import {
  Calculator,
  Globe,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  Ship,
  Award,
  RefreshCw,
  CheckCircle2,
  Info,
} from "lucide-react";

interface LandedCostCalculatorProps {
  productId?: number;
  sku?: string;
  hsCode: string;
  productName: string;
  quantity: number;
  unitPriceUsd: number;
  defaultIncoterm?: "EXW" | "FOB" | "CFR" | "CIF" | "DDP";
  defaultDestinationCountry?: string;
}

const DESTINATION_MARKETS = [
  {
    code: "JPN",
    nameVi: "Nhật Bản (Tokyo / Yokohama)",
    nameEn: "Japan (Tokyo / Yokohama Port)",
    portName: "Tokyo / Yokohama Port, Japan",
    flag: "🇯🇵",
    ftaBadge: "VJEPA / CPTPP",
  },
  {
    code: "DEU",
    nameVi: "CHLB Đức / EU (Hamburg)",
    nameEn: "Germany / EU (Hamburg Port)",
    portName: "Hamburg Port, Germany",
    flag: "🇩🇪",
    ftaBadge: "EVFTA (EUR.1)",
  },
  {
    code: "NLD",
    nameVi: "Hà Lan / EU (Rotterdam)",
    nameEn: "Netherlands / EU (Rotterdam Port)",
    portName: "Rotterdam Port, Netherlands",
    flag: "🇳🇱",
    ftaBadge: "EVFTA (EUR.1)",
  },
  {
    code: "USA",
    nameVi: "Hoa Kỳ (Los Angeles / Long Beach)",
    nameEn: "United States (LA / Long Beach)",
    portName: "Los Angeles / Long Beach Port, USA",
    flag: "🇺🇸",
    ftaBadge: "WTO MFN (Form B)",
  },
  {
    code: "GBR",
    nameVi: "Vương quốc Anh (Felixstowe)",
    nameEn: "United Kingdom (Felixstowe Port)",
    portName: "Felixstowe Port, UK",
    flag: "🇬🇧",
    ftaBadge: "UKVFTA",
  },
  {
    code: "KOR",
    nameVi: "Hàn Quốc (Busan Port)",
    nameEn: "South Korea (Busan Port)",
    portName: "Busan Port, South Korea",
    flag: "🇰🇷",
    ftaBadge: "VKFTA / RCEP",
  },
  {
    code: "AUS",
    nameVi: "Úc (Melbourne / Sydney)",
    nameEn: "Australia (Melbourne / Sydney)",
    portName: "Melbourne / Sydney Port, Australia",
    flag: "🇦🇺",
    ftaBadge: "AANZFTA / CPTPP",
  },
  {
    code: "SGP",
    nameVi: "Singapore (PSA Port)",
    nameEn: "Singapore (PSA Terminal)",
    portName: "PSA Singapore Terminal",
    flag: "🇸🇬",
    ftaBadge: "ATIGA (Form D)",
  },
];

const INCOTERM_OPTIONS: Array<{
  code: "EXW" | "FOB" | "CFR" | "CIF" | "DDP";
  descVi: string;
  descEn: string;
}> = [
  { code: "EXW", descVi: "Giao tại xưởng Bình Dương", descEn: "Ex Works Factory" },
  { code: "FOB", descVi: "Giao lên tàu Cảng Cát Lái", descEn: "Free On Board Cat Lai" },
  { code: "CFR", descVi: "Tiền hàng & Cước biển", descEn: "Cost and Freight" },
  { code: "CIF", descVi: "Tiền hàng, Bảo hiểm & Cước", descEn: "Cost, Insurance & Freight" },
  { code: "DDP", descVi: "Giao hàng đã nộp thuế tận kho", descEn: "Delivered Duty Paid" },
];

export const LandedCostCalculator: React.FC<LandedCostCalculatorProps> = ({
  productId,
  hsCode,
  productName,
  quantity,
  unitPriceUsd,
  defaultIncoterm = "CIF",
  defaultDestinationCountry = "JPN",
}) => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isVi = language === "vi";

  const [destinationCountry, setDestinationCountry] = useState<string>(defaultDestinationCountry);
  const [incotermCode, setIncotermCode] = useState<"EXW" | "FOB" | "CFR" | "CIF" | "DDP">(defaultIncoterm);
  const [applyFtaCertificate, setApplyFtaCertificate] = useState<boolean>(true);
  const [result, setResult] = useState<LandedCostResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const estimatedCartons = Math.max(1, Math.ceil(quantity / 12));
  const estimatedCbm = Number((estimatedCartons * 0.084).toFixed(2));
  const estimatedGwKg = Number((estimatedCartons * 11.2).toFixed(1));
  const suggestedContainerLabel =
    estimatedCbm < 15
      ? "LCL Consolidation"
      : estimatedCbm <= 28
      ? "1x20ft GP"
      : "1x40ft HC";

  const runCalculation = useCallback(async () => {
    setIsCalculating(true);
    const targetMarket =
      DESTINATION_MARKETS.find((m) => m.code === destinationCountry) || DESTINATION_MARKETS[0];
    try {
      const res = await pricingApi.calculateLandedCost({
        productId,
        hsCode,
        quantity: Math.max(1, quantity),
        unitPriceUsd,
        incotermCode,
        portOfLoading: "Cat Lai Port, Ho Chi Minh City",
        destinationCountryCode: destinationCountry,
        portOfDischarge: targetMarket.portName,
        totalCbm: estimatedCbm,
        totalGrossWeightKg: estimatedGwKg,
        applyFtaCertificate,
      });
      setResult(res);
    } finally {
      setIsCalculating(false);
    }
  }, [
    productId,
    hsCode,
    quantity,
    unitPriceUsd,
    incotermCode,
    destinationCountry,
    estimatedCbm,
    estimatedGwKg,
    applyFtaCertificate,
  ]);

  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  if (!result) {
    return (
      <div className="border border-black bg-white p-6 text-xs font-mono text-neutral-500 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-[#0E4B94]" />
        <span>
          {isVi
            ? "Đang tính toán biểu thuế xuất nhập khẩu & Landed Cost..."
            : "Computing FTA customs tariff & Door-to-Door Landed Cost..."}
        </span>
      </div>
    );
  }

  const totalBase = Math.max(1, result.totalLandedCostUsd);
  const exwPct = (result.fobGoodsValueUsd / totalBase) * 100;
  const originPct = (result.originLocalChargesUsd / totalBase) * 100;
  const oceanPct = ((result.oceanFreightUsd + result.marineInsuranceUsd) / totalBase) * 100;
  const dutyDestPct =
    ((result.estimatedImportDutyUsd +
      result.customsProcessingFeeUsd +
      result.destinationLocalAndInlandUsd) /
      totalBase) *
    100;
  const vatPct = (result.estimatedImportVatUsd / totalBase) * 100;

  return (
    <div className="border border-black bg-white p-6 space-y-6 rounded shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest bg-[#0E4B94] text-white px-2 py-0.5 font-bold rounded">
              INCOTERMS 2020 & FTA TARIFF ENGINE
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              HS CODE: <strong className="text-black">{result.hsCode}</strong>
            </span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black mt-1 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#0E4B94]" />
            {isVi
              ? "Tính Giá Vốn Nhập Khẩu Tận Kho (Landed Cost) & Ưu Đãi Thuế C/O FTA"
              : "Door-to-Door Landed Cost & FTA Preferential Duty Simulator"}
          </h2>
          <p className="text-xs font-mono text-neutral-600 mt-0.5">
            {productName} •{" "}
            <strong>
              {result.quantity.toLocaleString()} {isVi ? "đơn vị" : "units"}
            </strong>{" "}
            ({estimatedCartons} {isVi ? "thùng" : "ctns"} / {estimatedCbm.toFixed(2)} CBM /{" "}
            {suggestedContainerLabel})
          </p>
        </div>

        <button
          type="button"
          onClick={runCalculation}
          disabled={isCalculating}
          className="self-start md:self-auto inline-flex items-center gap-1.5 border border-black bg-neutral-100 hover:bg-black hover:text-white px-3.5 py-2 text-xs font-mono font-bold uppercase transition-colors rounded"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? "animate-spin" : ""}`} />
          <span>{isVi ? "Cập nhật biểu phí" : "Recalculate"}</span>
        </button>
      </div>

      {/* Controls Row: Market + Incoterm + FTA Toggle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-neutral-50 p-4 border border-neutral-300 rounded">
        {/* Destination Market */}
        <div className="lg:col-span-5">
          <label className="block text-[11px] font-mono font-bold uppercase text-neutral-700 mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#0E4B94]" />
            {isVi ? "1. Quốc gia & Cảng nhập khẩu đích (POD)" : "1. Destination Country & Port (POD)"}
          </label>
          <select
            value={destinationCountry}
            onChange={(e) => setDestinationCountry(e.target.value)}
            className="w-full border border-black bg-white px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0E4B94] rounded"
          >
            {DESTINATION_MARKETS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.flag} {isVi ? m.nameVi : m.nameEn} [{m.ftaBadge}]
              </option>
            ))}
          </select>
        </div>

        {/* Incoterm 2020 */}
        <div className="lg:col-span-4">
          <label className="block text-[11px] font-mono font-bold uppercase text-neutral-700 mb-1.5 flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-[#0E4B94]" />
            {isVi ? "2. Điều kiện Incoterms 2020" : "2. Incoterms 2020 Rule"}
          </label>
          <div className="grid grid-cols-5 gap-1">
            {INCOTERM_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setIncotermCode(opt.code)}
                title={isVi ? opt.descVi : opt.descEn}
                className={`py-2 text-xs font-mono font-bold uppercase border rounded transition-all ${
                  incotermCode === opt.code
                    ? "border-[#0E4B94] bg-[#0E4B94] text-white shadow-sm"
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-black"
                }`}
              >
                {opt.code}
              </button>
            ))}
          </div>
        </div>

        {/* FTA C/O Toggle */}
        <div className="lg:col-span-3 flex flex-col justify-between">
          <label className="block text-[11px] font-mono font-bold uppercase text-neutral-700 mb-1.5 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-700" />
            {isVi ? "3. Áp dụng C/O ưu đãi FTA" : "3. Apply FTA Origin C/O"}
          </label>
          <button
            type="button"
            onClick={() => setApplyFtaCertificate(!applyFtaCertificate)}
            className={`w-full py-2 px-3 border text-xs font-mono font-bold uppercase flex items-center justify-between rounded transition-colors ${
              applyFtaCertificate
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-neutral-400 bg-white text-neutral-700"
            }`}
          >
            <span>
              {applyFtaCertificate
                ? isVi
                  ? "Có C/O (Miễn/Giảm thuế)"
                  : "With FTA C/O (Preferential)"
                : isVi
                ? "Không C/O (Thuế MFN)"
                : "No C/O (Standard MFN)"}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20">
              {applyFtaCertificate ? `${result.ftaPreferentialDutyRatePercent}%` : `${result.mfnDutyRatePercent}%`}
            </span>
          </button>
        </div>
      </div>

      {/* FTA Tariff Savings Banner */}
      <div
        className={`p-4 border rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          result.ftaDutySavingsUsd > 0 && applyFtaCertificate
            ? "border-emerald-600 bg-emerald-50/90 text-emerald-950"
            : "border-neutral-300 bg-neutral-100 text-neutral-800"
        }`}
      >
        <div className="flex items-start gap-3">
          <ShieldCheck
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              result.ftaDutySavingsUsd > 0 && applyFtaCertificate ? "text-emerald-700" : "text-[#0E4B94]"
            }`}
          />
          <div className="space-y-0.5 text-xs font-mono">
            <div className="font-bold uppercase flex flex-wrap items-center gap-2">
              <span>{result.applicableFtaCode}</span>
              <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded">
                {result.requiredCertificateOfOrigin}
              </span>
            </div>
            <p className="text-neutral-700">
              {isVi ? (
                <>
                  Thuế MFN thông thường: <strong>{result.mfnDutyRatePercent}%</strong> → Thuế ưu đãi FTA Việt Nam:{" "}
                  <strong className="text-emerald-700">{result.ftaPreferentialDutyRatePercent}%</strong> (Áp dụng:{" "}
                  <strong>{result.appliedDutyRatePercent}%</strong>)
                </>
              ) : (
                <>
                  Standard MFN Duty: <strong>{result.mfnDutyRatePercent}%</strong> → Vietnam FTA Preferential:{" "}
                  <strong className="text-emerald-700">{result.ftaPreferentialDutyRatePercent}%</strong> (Applied:{" "}
                  <strong>{result.appliedDutyRatePercent}%</strong>)
                </>
              )}
            </p>
          </div>
        </div>

        <div className="sm:text-right font-mono shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
          <span className="text-[10px] uppercase block text-neutral-600">
            {isVi ? "Tiết kiệm thuế nhập khẩu nhờ C/O" : "FTA Import Duty Savings"}
          </span>
          <span className="text-lg font-black text-emerald-700">
            {result.ftaDutySavingsUsd > 0
              ? `-${formatPrice(result.ftaDutySavingsUsd)} (${result.ftaDutySavingsUsd.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })})`
              : isVi
              ? "$0.00 (Không chênh lệch)"
              : "$0.00 (MFN Rate)"}
          </span>
        </div>
      </div>

      {/* Visual Cost Waterfall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[11px] font-mono text-neutral-600">
          <span className="font-bold uppercase text-black">
            {isVi
              ? "Cấu trúc tỷ trọng chi phí Door-to-Door Landed Cost"
              : "Door-to-Door Landed Cost Structure Breakdown"}
          </span>
          <span>
            100% ={" "}
            <strong className="text-black">
              ${result.totalLandedCostUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
            </strong>
          </span>
        </div>

        <div className="w-full h-5 bg-neutral-200 rounded overflow-hidden flex border border-black">
          <div
            style={{ width: `${exwPct}%` }}
            title={`FOB/EXW Cargo: ${exwPct.toFixed(1)}%`}
            className="bg-[#0E4B94] h-full transition-all"
          />
          <div
            style={{ width: `${originPct}%` }}
            title={`Origin Local Charges: ${originPct.toFixed(1)}%`}
            className="bg-sky-500 h-full transition-all"
          />
          <div
            style={{ width: `${oceanPct}%` }}
            title={`Ocean Freight & Insurance: ${oceanPct.toFixed(1)}%`}
            className="bg-amber-500 h-full transition-all"
          />
          <div
            style={{ width: `${dutyDestPct}%` }}
            title={`Import Duty & Destination Port Fees: ${dutyDestPct.toFixed(1)}%`}
            className="bg-rose-600 h-full transition-all"
          />
          <div
            style={{ width: `${vatPct}%` }}
            title={`Import VAT / GST: ${vatPct.toFixed(1)}%`}
            className="bg-neutral-700 h-full transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-4 text-[11px] font-mono pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block bg-[#0E4B94]" />
            {isVi ? "Tiền hàng FOB/EXW" : "Merchandise Value"} ({exwPct.toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block bg-sky-500" />
            {isVi ? "Phí nội địa VN" : "Origin Charges"} ({originPct.toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block bg-amber-500" />
            {isVi ? "Cước biển & Bảo hiểm (CIF)" : "Ocean Freight & Ins."} ({oceanPct.toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block bg-rose-600" />
            {isVi ? "Thuế NK & Phí cảng đích" : "Import Duty & Dest. Port"} ({dutyDestPct.toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 inline-block bg-neutral-700" />
            {isVi ? `${result.importVatName} (${result.importVatRatePercent}%)` : `${result.importVatName} (${result.importVatRatePercent}%)`}{" "}
            ({vatPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Main Breakdown Grid: Waterfall Table + Unit Economics & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left 7 Cols: Detailed Cost Waterfall Table */}
        <div className="lg:col-span-7 border border-neutral-300 rounded overflow-hidden">
          <div className="bg-neutral-900 text-white px-4 py-2.5 text-xs font-mono font-bold uppercase flex justify-between items-center">
            <span>
              {isVi ? "Bảng kê chi tiết Giá trị Hợp đồng & Landed Cost" : "Itemized Incoterms & Landed Cost Schedule"}
            </span>
            <span>USD / Local</span>
          </div>
          <table className="w-full text-xs font-mono divide-y divide-neutral-200">
            <tbody className="divide-y divide-neutral-200">
              <tr className="bg-white">
                <td className="p-2.5 text-neutral-700">
                  1. {isVi ? "Trị giá hàng hóa cơ sở (FOB / EXW)" : "Base Merchandise Value (FOB / EXW)"}
                </td>
                <td className="p-2.5 text-right font-bold text-black">{formatPrice(result.fobGoodsValueUsd)}</td>
              </tr>
              <tr className="bg-neutral-50">
                <td className="p-2.5 text-neutral-700">
                  2. {isVi ? "Chi phí kéo cont, THC & Hải quan xuất khẩu (nếu EXW)" : "Origin Trucking, THC & Export Customs"}
                </td>
                <td className="p-2.5 text-right text-black">+{formatPrice(result.originLocalChargesUsd)}</td>
              </tr>
              <tr className="bg-white">
                <td className="p-2.5 text-neutral-700">
                  3. {isVi ? `Cước vận tải biển quốc tế (${suggestedContainerLabel})` : `International Ocean Freight (${suggestedContainerLabel})`}
                </td>
                <td className="p-2.5 text-right text-black">+{formatPrice(result.oceanFreightUsd)}</td>
              </tr>
              <tr className="bg-neutral-50">
                <td className="p-2.5 text-neutral-700">
                  4. {isVi ? "Bảo hiểm hàng hải quốc tế ICC (A) (110% CIF)" : "Marine Cargo Insurance ICC(A)"}
                </td>
                <td className="p-2.5 text-right text-black">+{formatPrice(result.marineInsuranceUsd)}</td>
              </tr>
              <tr className="bg-blue-50/60 font-bold">
                <td className="p-2.5 text-[#0E4B94]">
                  = {isVi ? `Trị giá tính thuế CIF (${result.portOfDischarge})` : `CIF Customs Valuation (${result.portOfDischarge})`}
                </td>
                <td className="p-2.5 text-right text-[#0E4B94]">{formatPrice(result.cifValueUsd)}</td>
              </tr>
              <tr className="bg-white">
                <td className="p-2.5 text-neutral-700">
                  5.{" "}
                  {isVi
                    ? `Thuế nhập khẩu (${result.appliedDutyRatePercent}% - ${
                        applyFtaCertificate ? result.requiredCertificateOfOrigin : "MFN"
                      })`
                    : `Import Customs Duty (${result.appliedDutyRatePercent}%)`}
                </td>
                <td className="p-2.5 text-right font-bold text-rose-700">
                  +{formatPrice(result.estimatedImportDutyUsd)}
                </td>
              </tr>
              <tr className="bg-neutral-50">
                <td className="p-2.5 text-neutral-700">
                  6. {isVi ? "Lệ phí hải quan (MPF/HMF) & D/O, THC cảng đích" : "Customs Processing (MPF/HMF) & Dest. THC"}
                </td>
                <td className="p-2.5 text-right text-black">
                  +{formatPrice(result.customsProcessingFeeUsd + result.destinationLocalAndInlandUsd)}
                </td>
              </tr>
              <tr className="bg-white">
                <td className="p-2.5 text-neutral-700">
                  7. {isVi ? `Thuế ${result.importVatName} (${result.importVatRatePercent}%)` : `${result.importVatName} (${result.importVatRatePercent}%)`}
                </td>
                <td className="p-2.5 text-right text-neutral-700">+{formatPrice(result.estimatedImportVatUsd)}</td>
              </tr>
              <tr className="bg-neutral-900 text-white font-black text-sm">
                <td className="p-3">
                  {isVi
                    ? `TỔNG GIÁ VỐN NHẬP KHẨU LANDED COST (ĐÃ GỒM VAT)`
                    : `TOTAL DOOR-TO-DOOR LANDED COST (INCL. VAT)`}
                </td>
                <td className="p-3 text-right text-amber-300">{formatPrice(result.totalLandedCostUsd)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right 5 Cols: Unit Economics & Mandatory Documents */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Unit Economics & Profit Margin Card */}
          <div className="border-2 border-black bg-neutral-50 p-4 space-y-3 rounded">
            <div className="flex items-center justify-between border-b border-neutral-300 pb-2">
              <span className="text-[11px] font-mono font-bold uppercase text-[#0E4B94] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                {isVi ? "Phân tích Giá vốn Đơn vị & Biên lợi nhuận" : "Unit Economics & Importer Margin"}
              </span>
              <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 rounded">
                Incoterm: {result.incotermCode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="bg-white border border-neutral-200 p-2.5 rounded">
                <span className="text-[10px] text-neutral-500 uppercase block">
                  {isVi ? "Giá mua tại VN / sp" : "VN Export Price / unit"}
                </span>
                <span className="text-base font-black text-black">{formatPrice(result.unitPriceUsd)}</span>
              </div>

              <div className="bg-white border border-neutral-200 p-2.5 rounded">
                <span className="text-[10px] text-neutral-500 uppercase block">
                  {isVi ? "Tổng vốn trước VAT" : "Landed Total (Ex-VAT)"}
                </span>
                <span className="text-base font-black text-[#0E4B94]">
                  {formatPrice(result.totalLandedCostExcludingVatUsd)}
                </span>
              </div>

              <div className="bg-white border border-neutral-900 p-2.5 rounded">
                <span className="text-[10px] text-neutral-500 uppercase block">
                  {isVi ? "Giá vốn tại kho đích / sp" : "Landed Cost / unit (Ex-VAT)"}
                </span>
                <span className="text-lg font-black text-emerald-700">
                  {formatPrice(result.landedCostPerUnitExcludingVatUsd)}
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  ({formatPrice(result.landedCostPerUnitUsd)} {isVi ? "gồm VAT" : "incl. VAT"})
                </span>
              </div>

              <div className="bg-emerald-950 text-white p-2.5 rounded">
                <span className="text-[10px] text-emerald-300 uppercase block">
                  {isVi ? "Giá bán mục tiêu / sp" : "Suggested Retail / unit"}
                </span>
                <span className="text-lg font-black text-white">
                  {formatPrice(result.suggestedRetailPriceUsd)}
                </span>
                <span className="text-[10px] text-emerald-300 block">
                  {isVi ? "Biên gộp:" : "Gross Margin:"} ~{result.estimatedGrossMarginPercent}%
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[11px] font-mono text-neutral-600 bg-white p-2.5 border border-neutral-200 rounded">
              <Info className="w-4 h-4 text-[#0E4B94] shrink-0 mt-0.5" />
              <span>
                {isVi
                  ? "Thuế VAT/GST hàng nhập khẩu thường được khấu trừ thuế đầu vào (Input Tax Credit) khi doanh nghiệp phân phối tại nước sở tại."
                  : "Import VAT/GST is generally recoverable as an input tax credit for registered corporate importers."}
              </span>
            </div>
          </div>

          {/* Mandatory Import Compliance Documents */}
          <div className="border border-neutral-300 bg-white p-4 space-y-2.5 rounded">
            <h3 className="text-xs font-mono font-bold uppercase text-black flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-[#0E4B94]" />
              {isVi
                ? `Hồ sơ thông quan bắt buộc tại ${result.destinationCountryName}`
                : `Mandatory Customs Clearance Docs (${result.destinationCountryName})`}
            </h3>
            <ul className="space-y-1.5 text-xs font-mono text-neutral-700">
              {result.complianceNotes.map((doc: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
