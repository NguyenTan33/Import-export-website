"use client";

import React from "react";
import {
  Ship,
  Clock,
  CheckCircle2,
  Compass,
  Navigation,
  Box,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { MarineRouteMap } from "./MarineRouteMap";

export interface ShipmentMilestone {
  stage: "FACTORY_READY" | "CUSTOMS_CLEARED" | "VESSEL_DEPARTED" | "ON_SEA" | "PORT_ARRIVED" | "DELIVERED";
  titleVi: string;
  titleEn: string;
  location: string;
  timestamp: string;
  isCompleted: boolean;
  isCurrent: boolean;
  notesVi?: string;
  notesEn?: string;
  notes?: string;
}

export interface ContainerDetail {
  containerNumber: string;
  sizeType: "20GP" | "40GP" | "40HC";
  sealNumber: string;
  cargoDescriptionVi?: string;
  cargoDescriptionEn?: string;
  cargoDescription: string;
  vgmWeightKg: number;
  tareWeightKg: number;
  statusVi?: string;
  statusEn?: string;
  status: string;
}

export interface ShipmentData {
  blNumber: string;
  bookingNumber: string;
  carrierName: string;
  vesselName: string;
  voyageNumber: string;
  imoNumber: string;
  callSign: string;
  portOfLoadingVi?: string;
  portOfLoadingEn?: string;
  portOfLoading: string;
  portOfDischargeVi?: string;
  portOfDischargeEn?: string;
  portOfDischarge: string;
  etd: string;
  eta: string;
  currentCoordinates?: { lat: number; lng: number };
  speedKnots?: number;
  routeProgressPercent: number;
  containers: ContainerDetail[];
  milestones: ShipmentMilestone[];
}

interface VesselTrackingTimelineProps {
  shipment: ShipmentData;
}

export const VesselTrackingTimeline: React.FC<VesselTrackingTimelineProps> = ({ shipment }) => {
  const { t, language } = useLanguage();

  const isVi = language === "vi";

  return (
    <div className="space-y-6">
      {/* Vessel Header & Live Status Card */}
      <div className="border border-neutral-300 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#0E4B94] text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider rounded">
                {isVi ? "VẬN ĐƠN ĐƯỜNG BIỂN B/L" : "OCEAN FREIGHT B/L"}
              </span>
              <span className="font-mono text-xs font-bold text-neutral-500">
                {isVi ? "Mã đặt chỗ tàu" : "Booking"}: {shipment.bookingNumber}
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-black font-mono tracking-tight text-neutral-900">
              {shipment.blNumber}
            </h2>
            <p className="text-xs text-neutral-600 font-mono">
              {isVi ? "Hãng vận tải:" : "Carrier:"}{" "}
              <strong className="text-black">{shipment.carrierName}</strong> •{" "}
              {isVi ? "Tàu vận tải:" : "Vessel:"}{" "}
              <strong className="text-[#0E4B94]">{shipment.vesselName}</strong> (
              {isVi ? "Chuyến" : "Voyage"} {shipment.voyageNumber})
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">
              {t("tracking.eta")}
            </span>
            <div className="flex items-center gap-1.5 text-[#0E4B94] font-mono font-black text-lg">
              <Clock className="w-4 h-4" />
              <span>{shipment.eta}</span>
            </div>
            <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("tracking.onSchedule")}
            </span>
          </div>
        </div>

        {/* Route Details Matrix */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-50 p-4 border border-neutral-200 text-xs font-mono">
          <div>
            <span className="text-[10px] text-neutral-500 block uppercase">
              {t("tracking.pol")}
            </span>
            <strong className="text-neutral-900 block truncate">
              {isVi && shipment.portOfLoadingVi ? shipment.portOfLoadingVi : shipment.portOfLoading}
            </strong>
            <span className="text-[10px] text-neutral-500">
              {t("tracking.etd")} {shipment.etd}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-neutral-500 block uppercase">
              {t("tracking.pod")}
            </span>
            <strong className="text-neutral-900 block truncate">
              {isVi && shipment.portOfDischargeVi ? shipment.portOfDischargeVi : shipment.portOfDischarge}
            </strong>
            <span className="text-[10px] text-neutral-500">
              {t("tracking.eta")}: {shipment.eta}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-neutral-500 block uppercase">
              {t("tracking.currentNav")}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Compass className="w-3.5 h-3.5 text-[#0E4B94]" />
              <strong className="text-[#0E4B94]">
                {shipment.speedKnots
                  ? `${shipment.speedKnots} ${t("tracking.knots")}`
                  : isVi ? "Đang neo đậu tại cảng" : "Berthed at Terminal"}
              </strong>
            </div>
            {shipment.currentCoordinates && (
              <span className="text-[10px] text-neutral-500 block">
                {shipment.currentCoordinates.lat.toFixed(2)}°N, {shipment.currentCoordinates.lng.toFixed(2)}°E
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] text-neutral-500 block uppercase">
              {t("tracking.progress")}
            </span>
            <div className="flex items-center justify-between text-xs font-bold mt-1">
              <span>{shipment.routeProgressPercent}% {t("tracking.completed")}</span>
            </div>
            <div className="mt-1 h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0E4B94] rounded-full transition-all duration-500"
                style={{ width: `${shipment.routeProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Marine AIS Route Map */}
      <MarineRouteMap
        blNumber={shipment.blNumber}
        initialProgressPercent={shipment.routeProgressPercent}
        carrierName={shipment.carrierName}
        vesselName={shipment.vesselName}
        voyageNumber={shipment.voyageNumber}
      />

      {/* 6-Stage Milestone Timeline */}
      <div className="border border-neutral-300 bg-white p-6 shadow-sm">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black border-b border-neutral-200 pb-3 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-[#0E4B94]" />
          {t("tracking.milestoneTitle")}
        </h3>

        <div className="mt-6 relative">
          <div className="space-y-6">
            {shipment.milestones.map((m, idx) => {
              const title = isVi ? m.titleVi : m.titleEn;
              const notes = isVi
                ? m.notesVi || m.notes
                : m.notesEn || m.notes;

              return (
                <div key={idx} className="flex items-start gap-4 relative">
                  {/* Left Icon Node */}
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border-2 font-mono text-xs font-bold z-10 ${
                      m.isCompleted
                        ? "bg-[#0E4B94] border-[#0E4B94] text-white"
                        : m.isCurrent
                        ? "bg-[#C9252C] border-[#C9252C] text-white animate-pulse"
                        : "bg-white border-neutral-300 text-neutral-400"
                    }`}
                  >
                    {m.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : m.isCurrent ? (
                      <Ship className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Right Content */}
                  <div
                    className={`flex-1 p-3.5 rounded border transition-colors ${
                      m.isCurrent
                        ? "bg-blue-50/60 border-[#0E4B94] shadow-sm"
                        : m.isCompleted
                        ? "bg-neutral-50/50 border-neutral-200"
                        : "bg-white border-dashed border-neutral-300 text-neutral-400"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-neutral-900 block">
                          {title}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-500">
                          {m.location}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-neutral-800 block">
                          {m.timestamp}
                        </span>
                        {m.isCurrent && (
                          <span className="inline-block bg-[#C9252C] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                            {t("tracking.currentStage")}
                          </span>
                        )}
                      </div>
                    </div>

                    {notes && (
                      <p className="mt-2 text-xs text-neutral-600 font-mono bg-white/80 p-2 rounded border border-neutral-200">
                        {notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Container Specification Table */}
      <div className="border border-neutral-300 bg-white p-6 shadow-sm">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black border-b border-neutral-200 pb-3 flex items-center gap-2">
          <Box className="w-4 h-4 text-[#0E4B94]" />
          {t("tracking.containerTitle")}
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-700 uppercase font-bold text-[11px]">
                <th className="p-3">{t("tracking.containerNo")}</th>
                <th className="p-3">{t("tracking.containerType")}</th>
                <th className="p-3">{t("tracking.sealNo")}</th>
                <th className="p-3">{t("tracking.cargoDesc")}</th>
                <th className="p-3 text-right">{t("tracking.vgmWeight")} (kg)</th>
                <th className="p-3 text-center">{t("tracking.status")}</th>
              </tr>
            </thead>
            <tbody>
              {shipment.containers.map((c, i) => {
                const desc = isVi
                  ? c.cargoDescriptionVi || c.cargoDescription
                  : c.cargoDescriptionEn || c.cargoDescription;
                const status = isVi
                  ? c.statusVi || c.status
                  : c.statusEn || c.status;

                return (
                  <tr key={i} className="border-b border-neutral-200 hover:bg-neutral-50">
                    <td className="p-3 font-bold text-[#0E4B94]">{c.containerNumber}</td>
                    <td className="p-3">{c.sizeType}</td>
                    <td className="p-3 text-neutral-600">{c.sealNumber}</td>
                    <td className="p-3">{desc}</td>
                    <td className="p-3 text-right font-bold">{c.vgmWeightKg.toLocaleString()} kg</td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Carrier Legal Disclaimer */}
        <div className="mt-4 border-t border-neutral-200 pt-3 flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-500">
          <span>
            {isVi
              ? "Dữ liệu hải trình được tích hợp từ Hệ thống Vệ tinh AIS & Cổng EDI Cảng Cát Lái."
              : "Vessel position telemetry synchronized with AIS Satellite & Terminal EDI networks."}
          </span>
          <span className="text-[#0E4B94] font-semibold">
            {isVi
              ? "CÔNG TY TNHH SX & TM DV XNK QUANG TẤN HOÀNG"
              : "QUANG TAN HOANG IMPORT EXPORT CO., LTD"}
          </span>
        </div>
      </div>
    </div>
  );
};