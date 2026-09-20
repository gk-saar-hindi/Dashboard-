import React, { useState } from "react";
import { 
  Tv, 
  Sparkles, 
  Send, 
  RefreshCw, 
  Eye, 
  Trash2, 
  Youtube, 
  CheckCircle2, 
  Video 
} from "lucide-react";
import { FirebaseDirectService } from "../services/firebaseDirectService";
import { AIProcessedItem } from "../types";
import { useToast } from "./Toast";

interface YouTubeTranscriptTabProps {
  onSuccessPublish: () => void;
  onPreviewItem?: (item: { title: string; category: string; points: string[]; sourceLink?: string }) => void;
}

const SAMPLE_YOUTUBE_TRANSCRIPT = `00:01 नमस्कार साथियों, आज के डेली करंट अफेयर्स शो में आप सभी का स्वागत है।
00:15 सबसे पहले बड़ी खबर: भारत सरकार ने 'पीएम सूर्य घर: मुफ्त बिजली योजना' में नया मील का पत्थर हासिल किया है।
00:32 इस योजना के तहत अब तक 1.3 करोड़ से अधिक परिवारों ने रूफटॉप सोलर लगाने के लिए रजिस्ट्रेशन कराया है।
00:48 इस योजना का कुल बजट 75,021 करोड़ रुपये है जिसमें हर महीने 300 यूनिट तक मुफ्त बिजली देने का लक्ष्य है।
01:10 दूसरी बड़ी खबर खेल जगत से है: भारतीय महिला टेबल टेनिस टीम ने एशियाई चैंपियनशिप में पहली बार कांस्य पदक जीत कर इतिहास रच दिया है।
01:30 मनिका बत्रा और अहिका मुखर्जी ने शानदार प्रदर्शन किया।
01:50 तो दोस्तों चैनल को लाइक और सब्सक्राइब जरूर करें, मिलते हैं कल के सेशन में।`;

export const YouTubeTranscriptTab: React.FC<YouTubeTranscriptTabProps> = ({
  onSuccessPublish,
  onPreviewItem,
}) => {
  const { showToast } = useToast();

  const [rawTranscriptText, setRawTranscriptText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedItems, setExtractedItems] = useState<AIProcessedItem[]>([]);
  const [isBatchPublishing, setIsBatchPublishing] = useState<boolean>(false);

  const handleLoadSample = () => {
    setRawTranscriptText(SAMPLE_YOUTUBE_TRANSCRIPT);
    showToast("नमूना यूट्यूब ट्रांसक्रिप्ट लोड की गई!", "info");
  };

  // Direct Parse & Publish (Matches Compose viewModel.parseTranscriptAndPublishBatch)
  const handleParseAndPublish = async () => {
    if (!rawTranscriptText.trim()) {
      showToast("कृपया ट्रांसक्रिप्ट पेस्ट करें।", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/ai/parse-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawTranscriptText }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `सर्वर त्रुटि: ${response.status}`);
      }

      if (!data.success || !Array.isArray(data.items) || data.items.length === 0) {
        throw new Error(data.error || "ट्रांसक्रिप्ट पार्स नहीं हो सकी");
      }

      if (data.warning) {
        showToast(data.warning, "info");
      }

      const publishRes = await FirebaseDirectService.batchPublish(data.items);
      if (publishRes.success) {
        showToast(
          `🎉 ट्रांसक्रिप्ट पार्स कर ${publishRes.publishedCount} बैच न्यूज़ पब्लिश हो गई!`,
          "success"
        );
        setRawTranscriptText("");
        setExtractedItems([]);
        onSuccessPublish();
      } else {
        showToast("पार्सिंग सफल रही पर डेटाबेस में सेव नहीं हो सका।", "error");
      }
    } catch (err: any) {
      showToast(`त्रुटि: ${err.message || "प्रक्रिया विफल"}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Preview first
  const handleAnalyzeAndPreview = async () => {
    if (!rawTranscriptText.trim()) {
      showToast("कृपया ट्रांसक्रिप्ट पेस्ट करें।", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/ai/parse-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawTranscriptText }),
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
        showToast(`✨ ट्रांसक्रिप्ट से ${withSelection.length} GK कार्ड्स निकाले गए!`, "success");
        if (withSelection[0] && onPreviewItem) {
          onPreviewItem(withSelection[0]);
        }
      }
    } catch (err: any) {
      showToast(`त्रुटि: ${err.message || "पार्सिंग विफल"}`, "error");
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
        setRawTranscriptText("");
        onSuccessPublish();
      } else if (res.permissionDenied) {
        showToast(`⚠️ 403 PERMISSION_DENIED: ${res.publishedCount} खबरें लोकल में सुरक्षित हैं, लेकिन Firebase Rules ने डेटाबेस में लिखने से मना किया!`, "warning");
        setExtractedItems([]);
        setRawTranscriptText("");
        onSuccessPublish();
      } else if (res.success) {
        showToast(`✨ ${res.publishedCount} खबरें लोकल में सुरक्षित कर दी गईं!`, "info");
        setExtractedItems([]);
        setRawTranscriptText("");
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
          <div className="text-[#DC2626]">
            <Youtube className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-[#1F2937]">
            यूट्यूब वीडियो ट्रांसक्रिप्ट बैच (YouTube Transcript Batch)
          </h2>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          className="text-xs text-[#1E3A8A] hover:underline font-semibold flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          नमूना ट्रांसक्रिप्ट लोड करें
        </button>
      </div>

      {/* Input Textarea */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#1F2937]">
          यूट्यूब वीडियो ट्रांसक्रिप्ट पेस्ट करें:
        </label>
        <textarea
          value={rawTranscriptText}
          onChange={(e) => setRawTranscriptText(e.target.value)}
          placeholder="YouTube ट्रांसक्रिप्ट यहां पेस्ट करें... (YouTube वीडियो के नीचे 'Show transcript' दबाकर कॉपी करें। टाइमस्टैम्प्स को अपने आप हटा दिया जाएगा)"
          rows={6}
          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all bg-white font-normal leading-relaxed resize-y font-mono"
        />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>यूट्यूब के करंट अफेयर्स वीडियो की ऑटो-जनरेटेड ट्रांसक्रिप्ट यहाँ काम करेगी</span>
          <span>{rawTranscriptText.length} वर्ण</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleAnalyzeAndPreview}
          disabled={isProcessing || !rawTranscriptText.trim()}
          className="py-2.5 px-4 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border-2 border-[#1E3A8A] text-[#1E3A8A] transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>ट्रांसक्रिप्ट पार्स हो रही है...</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>कार्ड्स पूर्वावलोकन देखें</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleParseAndPublish}
          disabled={isProcessing || !rawTranscriptText.trim()}
          className="py-2.5 px-4 rounded-xl text-xs font-bold bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>पार्स व पब्लिश कर रहा है...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>🚀 ट्रांसक्रिप्ट पार्स कर पब्लिश करें</span>
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
                यूट्यूब से निकाले गए समाचार कार्ड्स ({extractedItems.length})
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
