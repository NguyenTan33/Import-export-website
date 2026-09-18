"use client";

import React from "react";
import { Category } from "@/types";
import { Search, Filter } from "lucide-react";

interface ProductFilterProps {
  categories: Category[];
  selectedCategoryId?: number;
  onSelectCategory: (categoryId?: number) => void;
  searchKeyword: string;
  onSearchChange: (keyword: string) => void;
}

export const ProductFilter: React.FC<ProductFilterProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchKeyword,
  onSearchChange,
}) => {
  return (
    <div className="w-full border-b border-black/10 bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Search Input */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, mã HS (VD: 6404.11)..."
              className="w-full pl-9 pr-4 py-2 border border-black/20 text-sm focus:border-black focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase">
            <Filter className="w-3.5 h-3.5 text-black" />
            <span>6 Ngành hàng xuất khẩu chủ lực</span>
          </div>
        </div>

        {/* Category Filter Pills (Monochrome High-Contrast) */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => onSelectCategory(undefined)}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors border ${
              selectedCategoryId === undefined
                ? "bg-black text-white border-black"
                : "bg-white text-black border-black/20 hover:border-black"
            }`}
          >
            Tất cả sản phẩm
          </button>

          {categories.map((cat) => {
            const name = cat.translations.find((t) => t.languageCode === "vi")?.name || cat.slug;
            const isSelected = selectedCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors border ${
                  isSelected
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black/20 hover:border-black"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
