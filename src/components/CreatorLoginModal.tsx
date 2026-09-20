import React, { useState, useEffect } from "react";
import { 
  Lock, 
  Unlock, 
  Key, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Download, 
  LogOut,
  RefreshCw,
  Sparkles,
  Database
} from "lucide-react";
import { FirebaseDirectService } from "../services/firebaseDirectService";
import { AuthStateInfo } from "../types";
import { useToast } from "./Toast";

interface CreatorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  onOpenRulesModal?: () => void;
}

export const CreatorLoginModal: React.FC<CreatorLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenRulesModal,
}) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authState, setAuthState] = useState<AuthStateInfo>(FirebaseDirectService.getAuthState());
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Sync auth state
  useEffect(() => {
    const unsub = FirebaseDirectService.onAuthChange((st) => {
      setAuthState(st);
    });
    return unsub;
  }, []);

  // Pre-fill remembered email
  useEffect(() => {
    if (isOpen) {
      try {
        const remembered = localStorage.getItem("gksaar_saved_creator_email");
        if (remembered && !email) {
          setEmail(remembered);
        }
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast("कृपया अपनी क्रिएटर ईमेल आईडी दर्ज करें।", "warning");
      return;
    }
    if (!password.trim()) {
      showToast("कृपया अपना पासवर्ड दर्ज करें।", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const res = await FirebaseDirectService.signInWithEmail(email, password);
      if (res.success) {
        showToast(res.message, "success");
        if (rememberMe) {
          try {
            localStorage.setItem("gksaar_saved_creator_email", email.trim());
          } catch {}
        }
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("लॉगिन त्रुटि: " + (err.message || "अनपेक्षित समस्या"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousQuickLogin = async () => {
    setIsLoading(true);
    try {
      const res = await FirebaseDirectService.signInAnonymous();
      if (res.success) {
        showToast(res.message, "success");
        if (onLoginSuccess) onLoginSuccess();
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("अनाम लॉगिन त्रुटि: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await FirebaseDirectService.signOutUser();
    showToast("सफलतापूर्वक लॉगआउट किया गया।", "info");
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await FirebaseDirectService.testConnection();
      if (res.success) {
        showToast(res.message, "success");
      } else {
        showToast(res.message, "error");
      }
    } catch (e: any) {
      showToast("कनेक्शन टेस्ट में त्रुटि: " + e.message, "error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleDownloadBackup = () => {
    try {
      const allNews = FirebaseDirectService.getCachedNews();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allNews, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `gksaar_news_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("समाचार बैकअप डाउनलोड हो गया।", "success");
    } catch (e: any) {
      showToast("बैकअप डाउनलोड विफल: " + e.message, "error");
    }
  };

  return (
    <div 
      id="creator-login-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="creator-login-modal"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-[#172554] p-5 text-white relative">
          <button
            id="close-login-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">👑</span>
            <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> GKSAAR Creator Studio
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              FIREBASE LIVE
            </span>
          </div>

          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>🔐 क्रिएटर लॉगिन पोर्टल</span>
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            सुरक्षित क्लाउड पब्लिशिंग व सिंक अनलॉक के लिए अपनी ईमेल आईडी और पासवर्ड से लॉगिन करें।
          </p>
        </div>

        {/* Quick Actions Strip (matching screenshot) */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>⚡ क्विक ऐक्शन्स (Quick Actions)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* Sync status button */}
            <div
              className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                authState.isAuthenticated
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              {authState.isAuthenticated ? (
                <Unlock className="w-4 h-4 text-emerald-600" />
              ) : (
                <Lock className="w-4 h-4 text-amber-600" />
              )}
              <span className="text-[10px] font-bold">
                {authState.isAuthenticated ? "सिंक अनलॉक (Ready)" : "सिंक लॉक (Locked)"}
              </span>
            </div>

            {/* Download backup */}
            <button
              id="quick-download-backup-btn"
              type="button"
              onClick={handleDownloadBackup}
              className="p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-bold">डाउनलोड बैकअप</span>
            </button>

            {/* Close / Hide */}
            <button
              id="quick-hide-panel-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-bold">छिपाएं (Close)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {authState.isAuthenticated ? (
            /* Logged In State Card */
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      क्रिएटर लॉगिन सक्रिय (Active)
                    </h3>
                    <p className="text-xs text-emerald-800 font-medium">
                      {authState.isAnonymous 
                        ? "अनाम क्रिएटर मोड (Anonymous Auth)" 
                        : authState.email}
                    </p>
                    {authState.uid && (
                      <p className="text-[10px] text-emerald-600 font-mono mt-0.5">
                        UID: {authState.uid.slice(0, 12)}...
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300">
                  सत्यापित क्रिएटर
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-200/80 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>सुरक्षित सिंक पूरी तरह चालू है।</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  अब आप जो भी खबर पब्लिश करेंगे वह आपके अधिकृत क्रेडेंशियल्स के साथ सीधे Firestore कलेक्शन <span className="font-mono font-bold text-[#1E3A8A]">news_stories</span> में पहुंचेगी।
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  id="test-conn-while-auth-btn"
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-blue-600" : ""}`} />
                  <span>{isTesting ? "जांच रहे हैं..." : "सिंक कनेक्शन टेस्ट"}</span>
                </button>

                <button
                  id="signout-creator-btn"
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>लॉगआउट करें</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>क्रिएटर ईमेल (Admin Email)</span>
                </label>
                <div className="relative">
                  <input
                    id="creator-login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sr9685546@gmail.com या आपका एडमिन ईमेल"
                    className="w-full pl-3 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all bg-white"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>पासवर्ड दर्ज करें (Password)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-[#1E3A8A] hover:underline flex items-center gap-1 font-medium"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>छिपाएं</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>देखें</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="creator-login-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all bg-white font-mono"
                  />
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]/20 w-4 h-4"
                  />
                  <span>इस डिवाइस पर मुझे याद रखें (Remember Login)</span>
                </label>
              </div>

              {/* Main Submit Button */}
              <button
                id="submit-creator-login-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>लॉगिन व अनलॉक हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>🔑 सुरक्षित लॉगिन (Firebase Auth)</span>
                  </>
                )}
              </button>

              {/* Quick helper tip */}
              <p className="text-[11px] text-center text-slate-500 font-medium">
                💡 अपनी वही क्रिएटर आईडी और पासवर्ड डालें जो आपको याद है। लॉगिन होते ही ऐप का सिंक तुरंत खुल जाएगा।
              </p>

              {/* Quick Guest / Test Login Alternative */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">तुरंत टेस्ट करना चाहते हैं?</span>
                <button
                  type="button"
                  onClick={handleAnonymousQuickLogin}
                  disabled={isLoading}
                  className="text-xs font-bold text-[#1E3A8A] hover:underline"
                >
                  ⚡ त्वरित अनाम लॉगिन
                </button>
              </div>
            </form>
          )}

          {/* Rules info helper */}
          {onOpenRulesModal && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-600">
                Firestore में 403 या परमिशन एरर आ रही है?
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRulesModal();
                }}
                className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-lg hover:bg-amber-200 transition-colors"
              >
                Rules गाइड
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>एंड-टू-एंड एन्क्रिप्टेड क्रेडेंशियल्स</span>
          </div>
          <button
            id="footer-close-btn"
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
