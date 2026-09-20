import React, { useState } from "react";
import { Send, Sparkles, Link as LinkIcon, AlertCircle, FileText, CheckCircle2, RotateCcw } from "lucide-react";
import { FirebaseDirectService } from "../services/firebaseDirectService";
import { useToast } from "./Toast";

interface SingleNewsTabProps {
  onSuccessPublish: () => void;
  onFormChange?: (data: { 
    title: string; 
    category: string; 
    points: string; 
    sourceLink: string;
    relatedTopic?: string;
  }) => void;
}

const CATEGORY_SUGGESTIONS = [
  "POLICY",
  "राष्ट्रीय",
  "अंतर्राष्ट्रीय",
  "खेल",
  "विज्ञान एवं प्रौद्योगिकी",
  "अर्थव्यवस्था",
  "सरकारी योजना",
  "पर्यावरण व पारिस्थितिकी",
  "विविध"
];

export const SingleNewsTab: React.FC<SingleNewsTabProps> = ({
  onSuccessPublish,
  onFormChange,
}) => {
  const { showToast } = useToast();

  const [inputTitle, setInputTitle] = useState<string>("");
  const [inputCategory, setInputCategory] = useState<string>("POLICY");
  const [inputRelatedTopic, setInputRelatedTopic] = useState<string>("अमेरिकी कानून और भारत की ऊर्जा सुरक्षा");
  const [inputPointsText, setInputPointsText] = useState<string>("");
  const [inputSourceLink, setInputSourceLink] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const notifyChange = (
    title: string,
    category: string,
    points: string,
    sourceLink: string,
    relatedTopic?: string
  ) => {
    if (onFormChange) {
      onFormChange({ title, category, points, sourceLink, relatedTopic });
    }
  };

  const handleTitleChange = (val: string) => {
    setInputTitle(val);
    notifyChange(val, inputCategory, inputPointsText, inputSourceLink, inputRelatedTopic);
  };

  const handleCategoryChange = (val: string) => {
    setInputCategory(val);
    notifyChange(inputTitle, val, inputPointsText, inputSourceLink, inputRelatedTopic);
  };

  const handleRelatedTopicChange = (val: string) => {
    setInputRelatedTopic(val);
    notifyChange(inputTitle, inputCategory, inputPointsText, inputSourceLink, val);
  };

  const handlePointsChange = (val: string) => {
    setInputPointsText(val);
    notifyChange(inputTitle, inputCategory, val, inputSourceLink, inputRelatedTopic);
  };

  const handleSourceChange = (val: string) => {
    setInputSourceLink(val);
    notifyChange(inputTitle, inputCategory, inputPointsText, val, inputRelatedTopic);
  };

  const loadSampleNews = () => {
    const sTitle = '"अमेरिकी कांग्रेस द्वारा पारित 100% टैरिफ कानून के बावजूद विदेश मंत्रालय ने ऊर्जा खरीद को राष्ट्रीय हित के अधीन बताया है।"';
    const sCategory = "POLICY";
    const sTopic = "अमेरिकी कानून और भारत की ऊर्जा सुरक्षा";
    const sPoints = "भारत अपने 140 करोड़ नागरिकों की ऊर्जा जरूरतों को पूरा करने के लिए स्रोतों का विविधीकरण जारी रखेगा। विदेश मंत्रालय के अनुसार, ऊर्जा सुरक्षा पर निर्णय किसी बाहरी दबाव के बजाय देश की आर्थिक स्थिरता पर आधारित होंगे। यह नीति भारत-अमेरिका द्विपक्षीय संबंधों के भविष्य को प्रभावित कर सकती है। 📌 Related: Energy Security 2026";
    const sSource = "";

    setInputTitle(sTitle);
    setInputCategory(sCategory);
    setInputRelatedTopic(sTopic);
    setInputPointsText(sPoints);
    setInputSourceLink(sSource);
    notifyChange(sTitle, sCategory, sPoints, sSource, sTopic);
    showToast("GKSAAR स्क्रीनशॉट प्रारूप का नमूना लोड किया गया!", "info");
  };

  const handleReset = () => {
    setInputTitle("");
    setInputCategory("POLICY");
    setInputRelatedTopic("");
    setInputPointsText("");
    setInputSourceLink("");
    notifyChange("", "POLICY", "", "", "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputTitle.trim() || !inputPointsText.trim()) {
      showToast("कृपया शीर्षक और विस्तृत जानकारी भरें।", "error");
      return;
    }

    // Auto-wrap title in quotes if missing
    let finalTitle = inputTitle.trim();
    if (!finalTitle.startsWith('"') && !finalTitle.startsWith('“')) {
      finalTitle = `"${finalTitle}"`;
    }

    const pointsList = inputPointsText
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (pointsList.length === 0) {
      showToast("विस्तृत जानकारी का विवरण होना अनिवार्य है।", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await FirebaseDirectService.addNewsItem({
        title: finalTitle,
        category: inputCategory.trim() || "POLICY",
        relatedTopic: inputRelatedTopic.trim() || inputCategory.trim(),
        points: pointsList,
        sourceLink: inputSourceLink.trim(),
        timestamp: Date.now(),
      });

      if (res.syncedToFirebase) {
        showToast("🔥 समाचार सीधे Firebase Firestore में पब्लिश हो गया!", "success");
        setInputTitle("");
        setInputPointsText("");
        setInputSourceLink("");
        notifyChange("", inputCategory, "", "", inputRelatedTopic);
        onSuccessPublish();
      } else if (res.permissionDenied) {
        showToast("⚠️ 403 PERMISSION_DENIED: खबर लोकल में सुरक्षित है, लेकिन Firebase Rules ने ब्लॉक किया!", "warning");
        setInputTitle("");
        setInputPointsText("");
        setInputSourceLink("");
        notifyChange("", inputCategory, "", "", inputRelatedTopic);
        onSuccessPublish();
      } else if (res.success) {
        showToast("✨ समाचार लोकल मोड में सहेज लिया गया!", "info");
        setInputTitle("");
        setInputPointsText("");
        setInputSourceLink("");
        notifyChange("", inputCategory, "", "", inputRelatedTopic);
        onSuccessPublish();
      } else {
        showToast(`प्रकाशन त्रुटि: ${res.error || "अज्ञात समस्या"}`, "error");
      }
    } catch (err: any) {
      showToast(`त्रुटि: ${err.message || "पब्लिश नहीं हो सका"}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#1E3A8A]" />
          <h2 className="text-sm font-bold text-[#1F2937]">
            समाचार विवरण भरें (GKSAAR App Format)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSampleNews}
            className="text-xs text-[#1E3A8A] hover:underline font-semibold flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            ऐप स्क्रीनशॉट नमूना भरें
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            साफ करें
          </button>
        </div>
      </div>

      {/* GKSAAR Screen Protection Notice */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
        <span className="text-base shrink-0 mt-0.5">💡</span>
        <div className="leading-relaxed">
          <span className="font-bold">मोबाइल स्क्रीन ओवरफ्लो से बचाव: </span>
          मोबाइल का पूरा पेज टेक्स्ट से न भरे, इसलिए खबर को कॉम्पैक्ट रखें — <strong>शीर्षक (1-2 वाक्य उद्धरण)</strong> और <strong>विस्तृत जानकारी (1 संक्षिप्त पैराग्राफ 45-60 शब्द)</strong> रखें।
        </div>
      </div>

      {/* Field: News Title (Quote) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#1F2937]">
          1. मुख्य पंक्ति / उद्धरण (Quote Title) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={inputTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder='"अमेरिकी कांग्रेस द्वारा पारित 100% टैरिफ कानून के बावजूद..."'
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all bg-white font-medium"
        />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>यह मोबाइल में पीले बॉक्स 💡 में दिखता है (डबल कोट्स &quot;...&quot; में)</span>
          <span>{inputTitle.length} अक्षर</span>
        </div>
      </div>

      {/* Field: Detailed Information (विस्तृत जानकारी) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-[#1E3A8A] flex items-center gap-1.5">
            <span>📋 2. विस्तृत जानकारी (Details - केवल 1 संक्षिप्त पैराग्राफ)</span>
            <span className="text-red-500">*</span>
          </label>
          <span className="text-[11px] text-slate-500 font-medium">
            {inputPointsText.split(/\s+/).filter(Boolean).length} शब्द
          </span>
        </div>
        <textarea
          value={inputPointsText}
          onChange={(e) => handlePointsChange(e.target.value)}
          placeholder={"भारत अपने 140 करोड़ नागरिकों की ऊर्जा जरूरतों को पूरा करने के लिए स्रोतों का विविधीकरण जारी रखेगा। विदेश मंत्रालय के अनुसार, ऊर्जा सुरक्षा पर निर्णय किसी बाहरी दबाव के बजाय देश की आर्थिक स्थिरता पर आधारित होंगे। 📌 Related: Energy Security 2026"}
          rows={4}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all bg-white font-normal leading-relaxed resize-y"
        />
        <p className="text-[11px] text-slate-500">
          सुझाव: केवल 40 से 60 शब्द लिखें ताकि मोबाइल स्क्रीन संतुलित रहे। अंत में <strong>📌 Related: [विषय]</strong> जोड़ें।
        </p>
      </div>

      {/* Grid: Related Topic & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Field: Related Topic (Blue Pill) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1F2937] flex items-center gap-1">
            <span>⚛️ 3. संबंधित विषय (Related Topic - नीले पिल के लिए)</span>
          </label>
          <input
            type="text"
            value={inputRelatedTopic}
            onChange={(e) => handleRelatedTopicChange(e.target.value)}
            placeholder="जैसे: अमेरिकी कानून और भारत की ऊर्जा सुरक्षा"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all bg-white"
          />
          <p className="text-[10px] text-slate-400">यह मोबाइल में नीले पिल (Pill) में दिखता है</p>
        </div>

        {/* Field: Category (Green Pill) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1F2937] flex items-center gap-1">
            <span>📅 4. कैटेगरी (Category - हरे पिल के लिए)</span>
          </label>
          <input
            type="text"
            value={inputCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            placeholder="जैसे: POLICY, SCIENCE, NATIONAL..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all bg-white font-semibold uppercase"
          />
          <div className="flex flex-wrap gap-1 pt-1">
            {CATEGORY_SUGGESTIONS.slice(0, 5).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                  inputCategory === cat
                    ? "bg-[#1E3A8A] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Field: Source Link */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
          <LinkIcon className="w-3.5 h-3.5 text-[#1E3A8A]" />
          <span>स्रोत लिंक (Source Link - वैकल्पिक)</span>
        </label>
        <input
          type="url"
          value={inputSourceLink}
          onChange={(e) => handleSourceChange(e.target.value)}
          placeholder="https://pib.gov.in/..."
          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all bg-white font-mono"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2 space-y-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>पब्लिश हो रहा है...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>🚀 GKSAAR खबर पब्लिश करें (Firestore Sync)</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-slate-500 font-medium">
          💾 यह खबर सीधे आपके Firestore कलेक्शन <span className="font-mono font-bold text-[#1E3A8A] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">news_stories</span> में 10-अंकीय ID के साथ सुरक्षित सेव होगी।
        </p>
      </div>
    </form>
  );
};
