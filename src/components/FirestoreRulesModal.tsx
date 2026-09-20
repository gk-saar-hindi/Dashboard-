import React, { useState } from "react";
import { 
  ShieldAlert, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Lock, 
  Unlock, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  UserCheck
} from "lucide-react";
import { FirebaseDirectService } from "../services/firebaseDirectService";
import { useToast } from "./Toast";

interface FirestoreRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesUpdated?: () => void;
}

export const FirestoreRulesModal: React.FC<FirestoreRulesModalProps> = ({
  isOpen,
  onClose,
  onRulesUpdated,
}) => {
  const { showToast } = useToast();
  const config = FirebaseDirectService.getConfig();
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; writeOk?: boolean } | null>(null);
  const [isLoggingInAnon, setIsLoggingInAnon] = useState<boolean>(false);

  if (!isOpen) return null;

  const projectId = config.projectId || "your-firebase-project-id";
  const collectionName = config.collectionName || "news_stories";

  // Rule 1: Allow write to news_stories and custom collection
  const recommendedRule = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // GKSAAR Android App news_stories Collection
    match /news_stories/{document=**} {
      allow read, write: if true;
    }
    // Also allow ${collectionName} if different
    ${collectionName !== "news_stories" ? `match /${collectionName}/{document=**} {\n      allow read, write: if true;\n    }` : ""}
  }
}`;

  // Rule 2: Auth-based rule
  const authBasedRule = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated creators
    match /news_stories/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    showToast("📋 नियम कॉपी हो गया! अब इसे Firebase Console में पेस्ट करें।", "success");
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleRetest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await FirebaseDirectService.testConnection();
      setTestResult(res);
      if (res.writeOk) {
        showToast("🎉 बधाई! Firestore में राइट अनुमति सफलतापूर्वक मिल गई!", "success");
        if (onRulesUpdated) onRulesUpdated();
      } else {
        showToast(res.message, "error");
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || "परीक्षण विफल रहा" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsLoggingInAnon(true);
    try {
      const res = await FirebaseDirectService.signInAnonymous();
      if (res.success) {
        showToast(res.message, "success");
        handleRetest();
      } else {
        showToast(res.message, "error");
      }
    } catch (e: any) {
      showToast("लॉगिन त्रुटि: " + e.message, "error");
    } finally {
      setIsLoggingInAnon(false);
    }
  };

  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore/rules`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-red-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Firebase Firestore 403 PERMISSION_DENIED हल करें
              </h3>
              <p className="text-xs text-slate-600">
                Firestore Security Rules ने वेब स्टूडियो से डेटा लिखने की अनुमति रोक दी है।
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 text-slate-700 text-xs">
          {/* Quick Explanation */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">कारण:</span> Firebase Firestore में डिफ़ॉल्ट रूप से राइटिंग बंद (<code>allow write: if false;</code>) रहती है। इसे ठीक करने के लिए आपको Firebase Console में 1 मिनट में नियम अपडेट करने होंगे।
            </div>
          </div>

          {/* Step by Step Guide */}
          <div className="space-y-3">
            <h4 className="font-black text-sm text-[#1E3A8A] uppercase tracking-wide flex items-center gap-1.5">
              <span>🚀 1 मिनट में नियम अपडेट करने के 3 आसान चरण:</span>
            </h4>

            <ol className="space-y-2.5 list-decimal list-inside text-slate-700">
              <li className="font-medium">
                नीचे दिए गए बटन पर क्लिक करके सीधे अपने Firebase Console के <b>Rules</b> पेज पर जाएं:
                <div className="mt-1.5 ml-4">
                  <a
                    href={consoleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1E3A8A] text-white rounded-lg font-bold text-xs hover:bg-[#172554] transition-all shadow-xs"
                  >
                    <span>Firebase Console खोलें ({projectId})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </li>

              <li className="font-medium">
                वहां मौजूद पुराने कोड को हटाकर नीचे दिया गया <b>सक्रिय नियम (Working Rule)</b> कॉपी करके पेस्ट करें:
              </li>
            </ol>
          </div>

          {/* Option 1 Code Box: Recommended Simple Rule */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100">
            <div className="px-3.5 py-2 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <span className="font-mono text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                <Unlock className="w-3.5 h-3.5" />
                अनुशंसित नियम (Direct App Publishing Rule)
              </span>
              <button
                onClick={() => handleCopy(recommendedRule, "rec")}
                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                {copiedType === "rec" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">कॉपी हो गया!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>नियम कॉपी करें</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 font-mono text-[11px] overflow-x-auto text-slate-200 leading-relaxed">
              {recommendedRule}
            </pre>
          </div>

          {/* Step 3: Click Publish */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800">3. </span>
            Firebase Console में ऊपर नीले रंग का <span className="font-bold text-[#1E3A8A]">"Publish"</span> बटन दबाएं। नियम तुरंत लागू हो जाते हैं।
          </div>

          {/* Alternative: If using Auth-based rules */}
          <div className="border-t border-slate-100 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                वैकल्पिक: यदि आपके नियम लॉगिन आधारित (request.auth != null) हैं:
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              यदि आप Firestore में पब्लिक राइट नहीं खोलना चाहते, तो 1-क्लिक में अनाम (Anonymous) लॉगिन करके भी डेटा पब्लिश कर सकते हैं:
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={handleAnonymousSignIn}
                disabled={isLoggingInAnon}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <UserCheck className={`w-3.5 h-3.5 ${isLoggingInAnon ? "animate-spin" : ""}`} />
                <span>{isLoggingInAnon ? "लॉगिन हो रहा है..." : "⚡ 1-क्लिक अनाम लॉगिन करें (Anonymous Sign-In)"}</span>
              </button>
              
              <button
                onClick={() => handleCopy(authBasedRule, "auth")}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1"
              >
                {copiedType === "auth" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Auth नियम कॉपी करें</span>
              </button>
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl flex items-start gap-2.5 border ${
                testResult.writeOk
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {testResult.writeOk ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{testResult.message}</div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleRetest}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
            <span>{isTesting ? "जांच रहे हैं..." : "राइट परमिशन पुनः जांचें (Retest)"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
