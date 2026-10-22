"use client";

import React, { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  isVi?: boolean;
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  isVi = true,
  itemLabel,
  className = "",
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Generate page numbers with ellipsis window
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");

      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [safePage, totalPages]);

  if (totalItems <= 0) return null;

  const defaultItemLabel = isVi ? "mục" : "items";
  const label = itemLabel || defaultItemLabel;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 bg-white px-4 py-3 sm:px-6 rounded-b-lg ${className}`}
    >
      {/* Information text */}
      <div className="text-xs text-slate-500 font-medium">
        {isVi ? (
          <span>
            Hiển thị <strong className="text-slate-800">{startItem}</strong> -{" "}
            <strong className="text-slate-800">{endItem}</strong> trên tổng số{" "}
            <strong className="text-[#0E4B94]">{totalItems}</strong> {label}
          </span>
        ) : (
          <span>
            Showing <strong className="text-slate-800">{startItem}</strong> to{" "}
            <strong className="text-slate-800">{endItem}</strong> of{" "}
            <strong className="text-[#0E4B94]">{totalItems}</strong> {label}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Page size selector if enabled */}
        {onPageSizeChange && pageSizeOptions.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mr-2">
            <span>{isVi ? "Số lượng:" : "Per page:"}</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400 focus:border-[#0E4B94] focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5 shadow-sm">
          {/* First page */}
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(1)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={isVi ? "Trang đầu" : "First page"}
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          {/* Previous page */}
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={isVi ? "Trang trước" : "Previous page"}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Page numbers */}
          <div className="hidden sm:flex items-center gap-0.5">
            {pageNumbers.map((p, idx) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs text-slate-400 font-semibold"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-[28px] rounded px-2 py-1 text-xs font-bold transition-all ${
                    safePage === p
                      ? "bg-[#0E4B94] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Mobile page indicator */}
          <span className="sm:hidden px-2 text-xs font-bold text-slate-700">
            {safePage} / {totalPages}
          </span>

          {/* Next page */}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={isVi ? "Trang sau" : "Next page"}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Last page */}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={isVi ? "Trang cuối" : "Last page"}
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
