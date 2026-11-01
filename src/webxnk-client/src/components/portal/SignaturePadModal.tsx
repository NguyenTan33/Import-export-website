"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  X,
  RotateCcw,
  CheckCircle,
  ShieldCheck,
  Edit3,
} from "lucide-react";

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    signatureData: string,
    signerName: string,
    signerTitle: string,
    includeCompanyStamp?: boolean
  ) => void;
  title?: string;
  role: "SELLER" | "BUYER";
  defaultSignerName?: string;
  defaultSignerTitle?: string;
  isSubmitting?: boolean;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Ký Điện Tử Hợp Đồng Ngoại Thương",
  role,
  defaultSignerName = "",
  defaultSignerTitle = "",
  isSubmitting = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerTitle, setSignerTitle] = useState(defaultSignerTitle);
  const [penColor, setPenColor] = useState<string>("#0E4B94"); // Royal Navy default for international contracts
  const [includeCompanyStamp, setIncludeCompanyStamp] = useState(role === "SELLER");

  useEffect(() => {
    if (defaultSignerName) setSignerName(defaultSignerName);
    if (defaultSignerTitle) setSignerTitle(defaultSignerTitle);
  }, [defaultSignerName, defaultSignerTitle]);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI displays
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [isOpen, penColor]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    if (!signerName.trim() || !signerTitle.trim()) {
      alert("Vui lòng nhập Họ tên và Chức danh người ký đại diện pháp luật!");
      return;
    }

    const signatureData = canvas.toDataURL("image/png");
    onConfirm(signatureData, signerName.trim(), signerTitle.trim(), includeCompanyStamp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-xs text-blue-200">
                {role === "SELLER" ? "Đại diện Bên Bán (Exporter)" : "Đại diện Bên Mua (Importer)"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Signer Info inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và Tên Người Ký <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="VD: Nguyen Van An"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chức Vụ / Đại Diện <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                placeholder="VD: Managing Director"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Color & Controls toolbar */}
          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Màu mực:</span>
              <button
                type="button"
                onClick={() => setPenColor("#0E4B94")}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  penColor === "#0E4B94" ? "border-blue-600 ring-2 ring-blue-300" : "border-transparent"
                }`}
                style={{ backgroundColor: "#0E4B94" }}
                title="Màu Xanh Mực Ký Hợp Đồng (Royal Navy)"
              />
              <button
                type="button"
                onClick={() => setPenColor("#111827")}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  penColor === "#111827" ? "border-slate-800 ring-2 ring-slate-400" : "border-transparent"
                }`}
                style={{ backgroundColor: "#111827" }}
                title="Màu Đen (Black Ink)"
              />
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 transition font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xóa làm lại
            </button>
          </div>

          {/* Drawing Canvas */}
          <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 overflow-hidden group hover:border-blue-400 transition">
            <canvas
              ref={canvasRef}
              width={460}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[180px] touch-none cursor-crosshair bg-white"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1.5">
                <Edit3 className="w-8 h-8 opacity-40" />
                <span className="text-xs">Dùng chuột hoặc cảm ứng để ký tên vào khung này</span>
              </div>
            )}
            <div className="absolute bottom-2 left-3 pointer-events-none text-[10px] text-slate-400">
              * Vùng ký điện tử được bảo mật mã hóa
            </div>
          </div>

          {/* Corporate Seal toggle (Seller only) */}
          {role === "SELLER" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full border-2 border-red-600 flex items-center justify-center text-[10px] font-black text-red-600">
                  DẤU
                </div>
                <div>
                  <div className="text-xs font-bold text-red-900">
                    Đóng dấu mộc đỏ pháp nhân công ty
                  </div>
                  <div className="text-[11px] text-red-700">
                    CÔNG TY CỔ PHẦN XUẤT NHẬP KHẨU VIỆT NAM (MSDN: 0318999888)
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeCompanyStamp}
                onChange={(e) => setIncludeCompanyStamp(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
            </div>
          )}

          {/* Legal Compliance Banner */}
          <div className="text-[11px] text-slate-500 bg-slate-100 p-2.5 rounded-lg leading-relaxed">
            <span className="font-semibold text-slate-700">Pháp lý:</span> Tuân thủ{" "}
            <span className="font-medium text-slate-800">Luật Giao dịch điện tử 2023</span> & Quy chuẩn ICC
            e-Rules. Khóa băm mật mã SHA-256 sẽ tự động sinh và niêm phong tính toàn vẹn của hợp đồng sau khi
            hai bên hoàn tất ký.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasDrawn || isSubmitting || !signerName.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xác thực & ký...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Xác nhận ký điện tử
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
