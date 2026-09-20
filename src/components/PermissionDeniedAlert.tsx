import React from "react";
import { ShieldAlert, Wrench, X, UserCheck } from "lucide-react";
import { FirebaseDirectService } from "../services/firebaseDirectService";
import { useToast } from "./Toast";

interface PermissionDeniedAlertProps {
  onOpenRulesModal: () => void;
  onDismiss: () => void;
}

export const PermissionDeniedAlert: React.FC<PermissionDeniedAlertProps> = ({
  onOpenRulesModal,
  onDismiss,
}) => {
  const { showToast } = useToast();

  const handleQuickAnonLogin = async () => {
    try {
      const res = await FirebaseDirectService.signInAnonymous();
      if (res.success) {
        showToast(res.message, "success");
      } else {
        showToast(res.message, "error");
        onOpenRulesModal();
      }
    } catch (e: any) {
      showToast("लॉगिन त्रुटि: " + e.message, "error");
    }
  };

  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 sm:p-4 text-red-900 shadow-sm animate-in slide-in-from-top duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-red-950 flex items-center gap-1.5">
              <span>Firebase 403 PERMISSION_DENIED: डेटाबेस सुरक्षा नियम रुकावट</span>
            </h4>
            <p className="text-[11px] text-red-700 mt-0.5">
              आपकी खबर स्थानीय रूप से सुरक्षित है, परंतु Firestore Security Rules ने इसे लाइव पब्लिश करने से रोक दिया है।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleQuickAnonLogin}
            className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-red-200 hover:bg-red-100 text-red-800 rounded-lg transition-colors flex items-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5 text-red-600" />
            <span>अनाम लॉगिन</span>
          </button>

          <button
            type="button"
            onClick={onOpenRulesModal}
            className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>नियम ठीक करें</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 text-red-400 hover:text-red-700 rounded-lg transition-colors"
            title="बंद करें"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
