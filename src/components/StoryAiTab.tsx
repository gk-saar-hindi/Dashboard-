import React, { useState } from "react";
import { 
  Scissors, 
  Sparkles, 
  Layers, 
  Check, 
  Send, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  Copy, 
  ChevronRight,
  RefreshCw 
} from "lucide-react";
import { FirebaseDirectService } from "../services/firebaseDirectService";
import { AIProcessedItem } from "../types";
import { useToast } from "./Toast";

interface StoryAiTabProps {
  onSuccessPublish: () => void;
  onPreviewItem?: (item: { title: string; category: string; points: string[]; sourceLink?: string }) => void;
}

const SAMPLE_STORY = `प्रधानमंत्री नरेंद्र मोदी की अध्यक्षता में केंद्रीय मंत्रिमंडल ने 'बायो-ई3' (Bio-E3: Biotechnology for Economy, Environment and Employment) नीति को औपचारिक मंजूरी दे दी है। जैव प्रौद्योगिकी विभाग द्वारा तैयार की गई इस नीति का लक्ष्य भारत में उच्च मूल्य वाले जैव-आधारित रसायनों, बायो-पॉलिमर, स्मार्ट प्रोटीन और कार्बन कैप्चर उत्पादों के निर्माण को बढ़ावा देना है। 

इस नीति के तहत देश भर में आधुनिक 'बायो-फाउंड्री' और बायो-मैन्युफैक्चरिंग हब स्थापित किए जाएंगे। सरकार का अनुमान है कि 2030 तक भारत की जैव-अर्थव्यवस्था (Bio-Economy) 300 अरब डॉलर तक पहुंच जाएगी। पर्यावरण के अनुकूल प्रौद्योगिकियों के विकास से रोजगार के लाखों नए अवसर सृजित होंगे और शुद्ध-शून्य (Net Zero) उत्सर्जन के 2070 लक्ष्य को गति मिलेगी।`;

export const StoryAiTab: React.FC<StoryAiTabProps> = ({
  onSuccessPublish,
  onPreviewItem,
}) => {
  const { showToast } = useToast();

  const [rawStoryText, setRawStoryText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedItems, setExtractedItems] = useState<AIProcessedItem[]>([]);
  const [isBatchPublishing, setIsBatchPublishing] = useState<boolean>(false);

  const handleLoadSample = () => {
    setRawStoryText(SAMPLE_STORY);
    showToast("नमूना प्रेस विज्ञप्ति लोड की गई!", "info");
  };

  // Direct AI Divide and Batch Publish (Matches Compose viewModel.autoDivideAndPublishRawStory)
  const handleAutoDivideAndPublish = async () => {
    if (!rawStoryText.trim()) {
      showToast("कृपया स्टोरी का टेक्स्ट पेस्ट करें।", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/ai/split-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawStoryText }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `सर्वर त्रुटि: ${response.status}`);
      }

      if (!data.success || !Array.isArray(data.items) || data.items.length === 0) {
        throw new Error(data.error || "खबरों को विभाजित नहीं किया जा सका");
      }

      if (data.warning) {
        showToast(data.warning, "info");
      }

      // Publish directly to Firebase
      const publishRes = await FirebaseDirectService.batchPublish(data.items);
      if (publishRes.success) {
        showToast(
          `🎉 AI ने खबरों को विभाजित कर ${publishRes.publishedCount} खबरें पब्लिश कर दीं!`,
          "success"
        );
        setRawStoryText("");
        setExtractedItems([]);
        onSuccessPublish();
      } else {
        showToast("विभाजन हुआ लेकिन डेटाबेस में सहेजा नहीं जा सका।", "error");
      }
    } catch (err: any) {
      showToast(`त्रुटि: ${err.message || "प्रक्रिया विफल"}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Divide and Review First
  const handleAnalyzeAndPreview = async () => {
    if (!rawStoryText.trim()) {
      showToast("कृपया स्टोरी का टेक्स्ट पेस्ट करें।", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/ai/split-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawStoryText }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `सर्वर त्रुटि: ${response.status}`);
      }

      if (data.warning) {
        showToast(data.warning, "info");
      }

      if (data.success && Array.isArray(data.items)) {
        const withSelection = data.items.map((it: any) => ({
          ...it,
          selected: true,
        }));
        setExtractedItems(withSelection);
        showToast(`✨ AI ने ${withSelection.length} समाचार कार्ड तैयार किए हैं!`, "success");
        if (withSelection[0] && onPreviewItem) {
          onPreviewItem(withSelection[0]);
        }
      }
    } catch (err: any) {
      showToast(`त्रुटि: ${err.message || "विश्लेषण विफल"}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setExtractedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setExtractedItems((prev) => prev.filter((_, i) => i !== index));
    showToast("कार्ड हटाया गया", "info");
  };

  const handlePublishSelected = async () => {
    const selected = extractedItems.filter((i) => i.selected);
    if (selected.length === 0) {
      showToast("कम से कम एक कार्ड का चयन करें।", "warning");
      return;
    }

    setIsBatchPublishing(true);
    try {
      const res = await FirebaseDirectService.batchPublish(selected);
      if (res.syncedToFirebase) {
        showToast(`🎉 सफलतापूर्वक ${res.publishedCount} खबरें सीधे Firebase Firestore में पब्लिश हो गईं!`, "success");
        setExtractedItems([]);
        setRawStoryText("");
        onSuccessPublish();
      } else if (res.permissionDenied) {
        showToast(`⚠️ 403 PERMISSION_DENIED: ${res.publishedCount} खबरें लोकल में सुरक्षित हैं, लेकिन Firebase Rules ने डेटाबेस में लिखने से मना किया!`, "warning");
        setExtractedItems([]);
        setRawStoryText("");
        onSuccessPublish();
      } else if (res.success) {
        showToast(`✨ ${res.publishedCount} खबरें लोकल में सुरक्षित कर दी गईं!`, "info");
        setExtractedItems([]);
        setRawStoryText("");
        onSuccessPublish();
      } else {
        showToast("पब्लिशिंग त्रुटि: " + (res.errors?.[0] || res.error || "विफल"), "error");
      }
    } catch (e: any) {
      showToast("पब्लिशिंग त्रुटि: " + e.message, "error");
    } finally {
      setIsBatchPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-[#1E3A8A]" />
          <h2 className="text-sm font-bold text-[#1F2937]">
            स्टोरी AI स्प्लिटर (Raw Story AI Split)
          </h2>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          className="text-xs text-[#1E3A8A] hover:underline font-semibold flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          नमूना स्टोरी लोड करें
        </button>
      </div>

      {/* Input Textarea */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#1F2937]">
          पूरी स्टोरी / प्रेस रिलीज़ पेस्ट करें (AI इसे खुद विभाजित करेगा):
        </label>
        <textarea
          value={rawStoryText}
          onChange={(e) => setRawStoryText(e.target.value)}
          placeholder="यहां पूरा लेख, सरकारी प्रेस रिलीज़ (PIB) या न्यूज़ आर्टिकल पेस्ट करें... AI इसमें से परीक्षा-उपयोगी तथ्य निकाल कर GKSAAR कार्ड्स बनाएगा।"
          rows={6}
          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all bg-white font-normal leading-relaxed resize-y"
        />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>PIB, द हिंदू, दैनिक जागरण या सरकारी गैजेट से लंबा लेख पेस्ट करें</span>
          <span>{rawStoryText.length} वर्ण</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleAnalyzeAndPreview}
          disabled={isProcessing || !rawStoryText.trim()}
          className="py-2.5 px-4 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border-2 border-[#1E3A8A] text-[#1E3A8A] transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>AI विश्लेषण कर रहा है...</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>पूर्वावलोकन व समीक्षा करें</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleAutoDivideAndPublish}
          disabled={isProcessing || !rawStoryText.trim()}
          className="py-2.5 px-4 rounded-xl text-xs font-bold bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>AI प्रोसेस व पब्लिश कर रहा है...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>🚀 AI से विभाजित कर बैच पब्लिश करें</span>
            </>
          )}
        </button>
      </div>

      {/* Extracted Review Cards if previewed */}
      {extractedItems.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-extrabold text-[#1F2937] uppercase tracking-wider">
                AI द्वारा तैयार किए गए समाचार कार्ड ({extractedItems.length})
              </h3>
            </div>
            <button
              onClick={handlePublishSelected}
              disabled={isBatchPublishing}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>चयनित कार्ड पब्लिश करें ({extractedItems.filter((i) => i.selected).length})</span>
            </button>
          </div>

          <div className="space-y-3">
            {extractedItems.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.selected
                    ? "bg-white border-[#1E3A8A]/40 shadow-xs"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => handleToggleSelect(idx)}
                      className="w-4 h-4 rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1E3A8A]/10 text-[#1E3A8A]">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onPreviewItem && onPreviewItem(item)}
                      title="मोबाइल में देखें"
                      className="p-1 text-slate-500 hover:text-[#1E3A8A] rounded hover:bg-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      title="हटाएं"
                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-[#1F2937] mt-2 mb-1.5">
                  {item.title}
                </h4>

                <div className="space-y-1 text-[11px] text-slate-600 pl-2 border-l-2 border-[#1E3A8A]/20">
                  {item.points.map((pt, pIdx) => (
                    <div key={pIdx} className="leading-snug">
                      • {pt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
