import React from "react";
import Link from "next/link";
import { ShieldCheck, Anchor, Truck, FileCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-black text-white border-t border-neutral-800 mt-20">
      {/* Top Highlights Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-b border-neutral-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-white shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold tracking-wide uppercase">Tiêu chuẩn xuất khẩu</h4>
              <p className="text-xs text-neutral-400 mt-1">Đạt chuẩn kiểm định ISO, CE, FDA cho các thị trường EU, Hoa Kỳ, Nhật Bản.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Anchor className="w-6 h-6 text-white shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold tracking-wide uppercase">Cảng xuất phát chính</h4>
              <p className="text-xs text-neutral-400 mt-1">Cảng Tân Cảng Cát Lái (TP.HCM) và Hệ thống Cảng Quốc Tế Cái Mép - Thị Vải.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="w-6 h-6 text-white shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold tracking-wide uppercase">Incoterms 2020</h4>
              <p className="text-xs text-neutral-400 mt-1">Hỗ trợ đầy đủ điều kiện thương mại quốc tế: FOB, CIF, CFR, EXW, DDP.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileCheck className="w-6 h-6 text-white shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold tracking-wide uppercase">Chứng từ tự động</h4>
              <p className="text-xs text-neutral-400 mt-1">Tự sinh 3 bộ chứng từ Proforma Invoice, Commercial Invoice và Packing List.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <p className="font-bold text-white text-sm">
            CÔNG TY TNHH SX & TM DV XUẤT NHẬP KHẨU QUANG TẤN HOÀNG
          </p>
          <p className="text-neutral-400">
            QUANG TAN HOANG IMPORT EXPORT PRODUCTION TRADING SERVICES CO., LTD
          </p>
          <p className="text-neutral-500 text-[11px] mt-0.5">
            Trụ sở nhà máy: KCN VSIP 1, TP. Thuận An, Tỉnh Bình Dương & Văn phòng đại diện: Cảng Cát Lái, TP. Thủ Đức, TP.HCM
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-white transition-colors">Catalog B2C</Link>
          <Link href="/portal" className="hover:text-white transition-colors">B2B RFQ Portal</Link>
          <Link href="/cbm-calculator" className="hover:text-white transition-colors">CBM Container</Link>
          <Link href="/admin" className="hover:text-white transition-colors">Admin ERP</Link>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-neutral-900 py-4 text-center text-[11px] text-neutral-500">
        © 2026 QUANG TẤN HOÀNG EXPORT - IMPORT. All rights reserved. Tiêu chuẩn thương mại quốc tế ISO 9001.
      </div>
    </footer>
  );
};
