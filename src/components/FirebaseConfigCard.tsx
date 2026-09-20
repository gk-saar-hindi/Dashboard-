import React, { useState, useEffect } from "react";
import { 
  Key, 
  FolderKanban, 
  Layers, 
  Check, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Wifi, 
  Database,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  UserCheck,
  Lock,
  LogOut,
  ExternalLink
} from "lucide-react";
import { FirebaseDirectService } from "../services/firebaseDirectService";
import { FirebaseConfig, AuthStateInfo } from "../types";
import { useToast } from "./Toast";

interface FirebaseConfigCardProps {
  onConfigSaved: () => void;
  onOpenRulesModal: () => void;
  onOpenCreatorLogin?: () => void;
}

export const FirebaseConfigCard: React.FC<FirebaseConfigCardProps> = ({ 
  onConfigSaved,
  onOpenRulesModal,
  onOpenCreatorLogin
}) => {
  const { showToast } = useToast();
  const currentConfig = FirebaseDirectService.getConfig();

  const [isExpanded, setIsExpanded] = useState<boolean>(!FirebaseDirectService.isConfigured());
  const [apiKey, setApiKey] = useState<string>(currentConfig.apiKey);
  const [projectId, setProjectId] = useState<string>(currentConfig.projectId);
  const [appId, setAppId] = useState<string>(currentConfig.appId);
  const [collectionName, setCollectionName] = useState<string>(currentConfig.collectionName || "news_stories");
  
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ 
    success: boolean; 
    message: string; 
    writeOk?: boolean;
    permissionDenied?: boolean;
  } | null>(null);

  const [authState, setAuthState] = useState<AuthStateInfo>(FirebaseDirectService.getAuthState());
  const [showAuthSection, setShowAuthSection] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  useEffect(() => {
    const unsub = FirebaseDirectService.onAuthChange((st) => {
      setAuthState(st);
    });
    return unsub;
  }, []);

  const isActive = FirebaseDirectService.isConfigured();

  const handleSave = () => {
    FirebaseDirectService.updateCredentials(apiKey, projectId, appId, collectionName);
    showToast("✅ Firebase क्रेडेंशियल्स सुरक्षित सहेज लिए गए!", "success");
    setTestResult(null);
    onConfigSaved();
  };

  const handleTestConnection = async () => {
    FirebaseDirectService.updateCredentials(apiKey, projectId, appId, collectionName);
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await FirebaseDirectService.testConnection();
      setTestResult(res);
      if (res.writeOk) {
        showToast("🔥 " + res.message, "success");
      } else if (res.permissionDenied) {
        showToast("⚠️ 403 PERMISSION_DENIED: राइट अनुमति ब्लॉक है।", "error");
      } else {
        showToast("⚠️ " + res.message, "error");
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || "परीक्षण विफल रहा" });
      showToast("त्रुटि: " + (e.message || "परीक्षण विफल"), "error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await FirebaseDirectService.signInAnonymous();
      if (res.success) {
        showToast(res.message, "success");
        handleTestConnection();
      } else {
        showToast(res.message, "error");
      }
    } catch (e: any) {
      showToast("लॉगिन त्रुटि: " + e.message, "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      showToast("ईमेल और पासवर्ड दोनों दर्ज करें।", "warning");
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await FirebaseDirectService.signInWithEmail(emailInput, passwordInput);
      if (res.success) {
        showToast(res.message, "success");
        setEmailInput("");
        setPasswordInput("");
        handleTestConnection();
      } else {
        showToast(res.message, "error");
      }
    } catch (e: any) {
      showToast("ईमेल लॉगिन त्रुटि: " + e.message, "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await FirebaseDirectService.signOutUser();
    showToast("सफलतापूर्वक लॉगआउट किया गया।", "info");
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isActive
          ? "bg-[#1E3A8A]/[0.03] border-[#1E3A8A]/25"
          : "bg-[#DC2626]/[0.03] border-[#DC2626]/25"
      }`}
    >
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 sm:px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-black/[0.02] select-none"
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
              isActive
                ? "bg-[#1E3A8A]/10 text-[#1E3A8A]"
                : "bg-[#DC2626]/10 text-[#DC2626]"
            }`}
          >
            {isActive ? "🔥" : "⚠️"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs sm:text-sm font-bold ${
                  isActive ? "text-[#1E3A8A]" : "text-[#DC2626]"
                }`}
              >
                {isActive ? "Firebase Real-time Direct Sync" : "Firebase सिंक सेट करें"}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isActive
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isActive ? "लाइव सिंक चालू" : "कॉन्फ़िगरेशन आवश्यक"}
              </span>
              {authState.isAuthenticated && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold hidden sm:inline-flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  {authState.isAnonymous ? "Anonymous Auth" : authState.email}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#4B5563] hidden sm:block">
              {isActive
                ? `प्रोजेक्ट ID: ${projectId || "Set"} • कलेक्शन: '${collectionName}'`
                : "Android GKSAAR ऐप में तुरंत डेटा भेजने हेतु Firebase क्रेडेंशियल्स दर्ज करें"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenRulesModal();
            }}
            className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
            title="Firestore Rules 403 ठीक करें"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden md:inline">Rules गाइड (403 Fix)</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] bg-white px-3 py-1.5 rounded-lg border border-[#1E3A8A]/20 shadow-xs">
            <span>{isExpanded ? "छिपाएं" : "बदलें / देखें ⚙️"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Expandable Form Body */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-200/60 bg-white/70 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            {/* API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F2937] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  Firebase API Key
                </span>
                <span className="text-[10px] text-slate-400 font-normal">apiKey</span>
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSyXXXXXXXXXXXX..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none font-mono transition-all bg-white"
              />
            </div>

            {/* Project ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F2937] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  Firebase Project ID
                </span>
                <span className="text-[10px] text-slate-400 font-normal">projectId</span>
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="short-news-app-12345"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none font-mono transition-all bg-white"
              />
            </div>

            {/* App ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F2937] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  Firebase App ID
                </span>
                <span className="text-[10px] text-slate-400 font-normal">appId</span>
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:1234567890:android:abcde12345"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none font-mono transition-all bg-white"
              />
            </div>

            {/* Collection Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F2937] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  Firestore संग्रह (Collection)
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Android ऐप: news_stories
                </span>
              </label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="news_stories"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none font-mono transition-all bg-white"
              />
              <p className="text-[10px] text-slate-500">
                ⚡ GKSAAR Android ऐप डेटाबेस स्कीमा: <code>news_stories</code> (ID प्रारूप: <code>-1019728490</code>)
              </p>
            </div>
          </div>

          {/* Test connection result notice if available */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border ${
                testResult.writeOk
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : testResult.permissionDenied
                  ? "bg-red-50 text-red-950 border-red-300"
                  : "bg-amber-50 text-amber-900 border-amber-200"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {testResult.writeOk ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{testResult.message}</div>
                  {testResult.permissionDenied && (
                    <div className="text-[11px] text-red-700 mt-1">
                      Firestore Rules में <code>allow write: if true;</code> जोड़ें अथवा Anonymous Auth से लॉगिन करें।
                    </div>
                  )}
                </div>
              </div>

              {testResult.permissionDenied && (
                <button
                  type="button"
                  onClick={onOpenRulesModal}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0 transition-colors flex items-center gap-1 shadow-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>नियम गाइड देखें व ठीक करें</span>
                </button>
              )}
            </div>
          )}

          {/* Authentication Panel Toggle (for request.auth != null rules) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span className="text-xs font-bold text-[#1F2937]">
                  Firebase ऑथेंटिकेशन (Security Rules Auth Support)
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    authState.isAuthenticated
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {authState.isAuthenticated
                    ? authState.isAnonymous
                      ? "✓ अनाम लॉगिन सक्रिय"
                      : `✓ ${authState.email}`
                    : "अनऑथेंटिकेटेड"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {authState.isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-xs text-red-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>लॉगआउट</span>
                  </button>
                ) : (
                  <>
                    {onOpenCreatorLogin && (
                      <button
                        type="button"
                        onClick={onOpenCreatorLogin}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Lock className="w-3 h-3" />
                        <span>क्रिएटर पोर्टल</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAnonymousLogin}
                      disabled={isLoggingIn || !apiKey}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#1E3A8A] text-white hover:bg-[#172554] transition-colors disabled:opacity-50 hidden sm:inline-flex"
                    >
                      ⚡ त्वरित अनाम
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowAuthSection(!showAuthSection)}
                  className="text-xs text-[#1E3A8A] hover:underline font-semibold"
                >
                  {showAuthSection ? "छिपाएं" : "सीधा फॉर्म"}
                </button>
              </div>
            </div>

            {/* Email/Password expansion */}
            {showAuthSection && !authState.isAuthenticated && (
              <form onSubmit={handleEmailLogin} className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@example.com"
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="पासवर्ड"
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  {isLoggingIn ? "लॉगिन हो रहा है..." : "ईमेल से लॉगिन करें"}
                </button>
              </form>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Android ऐप की <code>google-services.json</code> से ये मान मिलते हैं।</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onOpenRulesModal}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>Rules गाइड (403 Fix)</span>
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !apiKey || !projectId}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Wifi className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-[#1E3A8A]" : ""}`} />
                <span>{isTesting ? "जांच रहे हैं..." : "कनेक्शन व राइट टेस्ट"}</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>क्रेडेंशियल्स सेव व कनेक्ट करें</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
