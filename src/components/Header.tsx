import React from "react";
import { Sparkles, RefreshCw, Smartphone, Database, Lock, Unlock, UserCheck } from "lucide-react";
import { AuthStateInfo } from "../types";

interface HeaderProps {
  isFirebaseActive: boolean;
  totalNewsCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  showMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  onOpenCreatorLogin: () => void;
  authState: AuthStateInfo;
}

export const Header: React.FC<HeaderProps> = ({
  isFirebaseActive,
  totalNewsCount,
  onRefresh,
  isRefreshing,
  showMobilePreview,
  onToggleMobilePreview,
  onOpenCreatorLogin,
  authState,
}) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-[#1E3A8A]/15 sticky top-0 z-30 px-4 sm:px-6 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#172554] flex items-center justify-center text-xl shadow-md border border-[#1E3A8A]/20">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#1E3A8A] uppercase">
                GKSAAR Creator Studio
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#1E3A8A]/10 text-[#1E3A8A]">
                <Sparkles className="w-3 h-3 text-amber-500" /> Web Panel
              </span>
            </div>
            <p className="text-xs text-[#4B5563] font-medium flex items-center gap-2">
              <span>कंटेंट पब्लिशिंग व सिंक कंट्रोल</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">Android App: com.example (GKSAAR)</span>
            </p>
          </div>
        </div>

        {/* Right status & actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Creator Login Button / Status */}
          <button
            id="header-creator-login-btn"
            type="button"
            onClick={onOpenCreatorLogin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs ${
              authState.isAuthenticated
                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border border-amber-600 shadow-sm"
            }`}
            title="क्रिएटर लॉगिन पोर्टल"
          >
            {authState.isAuthenticated ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="max-w-[120px] sm:max-w-[160px] truncate">
                  {authState.isAnonymous ? "अनाम क्रिएटर" : (authState.email || "क्रिएटर")}
                </span>
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-md font-extrabold">
                  अनलॉक ✓
                </span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>🔐 क्रिएटर लॉगिन</span>
              </>
            )}
          </button>

          {/* Status badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isFirebaseActive
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isFirebaseActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="hidden sm:inline">{isFirebaseActive ? "Firebase Live Connected" : "Local Test Mode"}</span>
            <span className="sm:hidden">{isFirebaseActive ? "Live" : "Local"}</span>
          </div>

          {/* News counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#1E3A8A]/15 text-xs text-[#1F2937] font-medium">
            <Database className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span className="hidden sm:inline">कुल खबरें:</span>
            <span className="font-bold text-[#1E3A8A]">{totalNewsCount}</span>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="रिफ्रेश करें"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#1E3A8A]" : ""}`} />
            <span className="hidden sm:inline">रिफ्रेश</span>
          </button>

          {/* Toggle mobile preview */}
          <button
            onClick={onToggleMobilePreview}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
              showMobilePreview
                ? "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showMobilePreview ? "ऐप प्रीव्यू सक्रिय" : "ऐप प्रीव्यू देखें"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
