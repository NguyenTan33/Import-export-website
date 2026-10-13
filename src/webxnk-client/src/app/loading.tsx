import React from "react";

export default function Loading() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[60vh] py-16 px-4">
      {/* Top indeterminate animated progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-100 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#0E4B94] via-blue-500 to-[#C9252C] animate-[progress_1s_ease-in-out_infinite]" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-[#0E4B94] animate-spin" />
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">
          WebXNK • Loading...
        </span>
      </div>
    </div>
  );
}
