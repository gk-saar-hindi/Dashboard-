import React, { useState } from "react";
import { 
  Trash2, 
  Eye, 
  Search, 
  ExternalLink, 
  Calendar, 
  Database, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { NewsItem } from "../types";
import { FirebaseDirectService } from "../services/firebaseDirectService";
import { useToast } from "./Toast";

interface PublishedNewsListProps {
  newsList: NewsItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectItem: (item: NewsItem) => void;
  onOpenRulesModal?: () => void;
}

export const PublishedNewsList: React.FC<PublishedNewsListProps> = ({
  newsList,
  isLoading,
  onRefresh,
  onSelectItem,
  onOpenRulesModal,
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resyncingId, setResyncingId] = useState<string | null>(null);
  const [isResyncingAll, setIsResyncingAll] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique categories
  const categories = Array.from(new Set(newsList.map((n) => n.category))).filter(Boolean);

  const unsyncedItems = newsList.filter((item) => item.syncedToFirebase === false);

  const filteredNews = newsList.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.points.some((pt) => pt.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`क्या आप इस खबर को हटाना चाहते हैं?\n"${title}"`)) {
      return;
    }

    setDeletingId(id);
    try {
      await FirebaseDirectService.deleteNewsItem(id);
      showToast("🗑️ खबर सफलतापूर्वक हटा दी गई!", "success");
      onRefresh();
    } catch (e: any) {
      showToast("हटाने में त्रुटि: " + e.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetrySyncItem = async (item: NewsItem) => {
    setResyncingId(item.id);
    try {
      const res = await FirebaseDirectService.addNewsItem({
        title: item.title,
        category: item.category,
        points: item.points,
        sourceLink: item.sourceLink,
        timestamp: item.timestamp,
        publishedBy: item.publishedBy,
      });

      if (res.syncedToFirebase) {
        showToast("🔥 खबर सीधे Firestore में सिंक हो गई!", "success");
        onRefresh();
      } else if (res.permissionDenied) {
        showToast("⚠️ 403 PERMISSION_DENIED: Firestore Security Rules ने अभी भी लिखने से रोका है।", "error");
        if (onOpenRulesModal) onOpenRulesModal();
      } else {
        showToast(res.error || "सिंक विफल", "error");
      }
    } catch (e: any) {
      showToast("सिंक त्रुटि: " + e.message, "error");
    } finally {
      setResyncingId(null);
    }
  };

  const handleResyncAllUnsynced = async () => {
    if (unsyncedItems.length === 0) return;
    setIsResyncingAll(true);
    try {
      const res = await FirebaseDirectService.batchPublish(
        unsyncedItems.map((item) => ({
          title: item.title,
          category: item.category,
          points: item.points,
          sourceLink: item.sourceLink,
        }))
      );

      if (res.syncedToFirebase) {
        showToast(`🎉 सभी ${res.publishedCount} खबरें Firestore में सिंक हो गईं!`, "success");
        onRefresh();
      } else if (res.permissionDenied) {
        showToast("⚠️ 403 PERMISSION_DENIED: Firebase Rules अपडेट करें।", "error");
        if (onOpenRulesModal) onOpenRulesModal();
      } else {
        showToast("सिंक प्रक्रिया पूर्ण", "info");
        onRefresh();
      }
    } catch (e: any) {
      showToast("पुनः सिंक त्रुटि: " + e.message, "error");
    } finally {
      setIsResyncingAll(false);
    }
  };

  const handleCopy = (item: NewsItem) => {
    const text = `${item.title}\n[${item.category}]\n${item.points.map((p, i) => `${i + 1}. ${p}`).join("\n")}${item.sourceLink ? `\nस्रोत: ${item.sourceLink}` : ""}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    showToast("📋 खबर कॉपी की गई!", "info");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "हाल ही में";
    const date = new Date(timestamp);
    return date.toLocaleDateString("hi-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="शीर्षक, कैटेगरी या बिंदु खोजें..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all bg-white"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 outline-none focus:border-[#1E3A8A]"
          >
            <option value="all">सभी श्रेणियां ({newsList.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({newsList.filter((n) => n.category === cat).length})
              </option>
            ))}
          </select>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all active:scale-95 disabled:opacity-50"
            title="रिफ्रेश करें"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#1E3A8A]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Unsynced Notice Banner */}
      {unsyncedItems.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <b>{unsyncedItems.length} खबरें</b> स्थानीय रूप से सहेजी गई हैं, लेकिन Firestore Rules 403 के कारण लाइव सिंक नहीं हुईं।
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenRulesModal && (
              <button
                type="button"
                onClick={onOpenRulesModal}
                className="px-2.5 py-1 text-[11px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg transition-colors"
              >
                नियम गाइड
              </button>
            )}
            <button
              type="button"
              onClick={handleResyncAllUnsynced}
              disabled={isResyncingAll}
              className="px-3 py-1 text-[11px] font-bold bg-[#1E3A8A] text-white hover:bg-[#172554] rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isResyncingAll ? "animate-spin" : ""}`} />
              <span>{isResyncingAll ? "सिंक हो रहा है..." : "सभी पुनः सिंक करें"}</span>
            </button>
          </div>
        </div>
      )}

      {/* News Cards List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1E3A8A]" />
          <p className="text-xs font-medium">डेटाबेस से खबरें लोड हो रही हैं...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6">
          <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">कोई खबर नहीं मिली</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== "all"
              ? "दिए गए फिल्टर के अनुसार कोई परिणाम नहीं मिला। फ़िल्टर बदलें।"
              : "अभी तक कोई खबर प्रकाशित नहीं हुई है। 'सिंगल खबर', 'स्टोरी AI' या 'यूट्यूब' टैब से खबर पब्लिश करें!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredNews.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white border border-[#1E3A8A]/15 hover:border-[#1E3A8A]/40 transition-all shadow-xs space-y-2.5"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1E3A8A]/10 text-[#1E3A8A]">
                    {item.category}
                  </span>

                  {item.relatedTopic && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                      ⚛️ {item.relatedTopic}
                    </span>
                  )}

                  {item.relatedWord && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.relatedWord}
                    </span>
                  )}
                  
                  {item.syncedToFirebase === false ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      लोकल (Rules 403)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Live Firestore
                    </span>
                  )}

                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500 bg-slate-50 border border-slate-200">
                    ID: {item.id}
                  </span>

                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.timestamp)}
                  </span>
                  {item.publishedBy && (
                    <span className="text-[10px] text-slate-400">
                      • {item.publishedBy}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {item.syncedToFirebase === false && (
                    <button
                      onClick={() => handleRetrySyncItem(item)}
                      disabled={resyncingId === item.id}
                      title="Firestore में पुनः सिंक करें"
                      className="px-2 py-1 text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${resyncingId === item.id ? "animate-spin" : ""}`} />
                      <span>सिंक करें</span>
                    </button>
                  )}
                  <button
                    onClick={() => onSelectItem(item)}
                    title="मोबाइल स्क्रीन में देखें"
                    className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopy(item)}
                    title="टेक्स्ट कॉपी करें"
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={deletingId === item.id}
                    title="हटाएं (Delete)"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold text-[#1F2937] leading-snug">
                {item.title}
              </h3>

              {/* Points */}
              <div className="space-y-1.5 pl-2 border-l-2 border-[#1E3A8A]/20">
                {item.points.map((pt, idx) => (
                  <div key={idx} className="text-xs text-[#4B5563] leading-relaxed flex items-start gap-1.5">
                    <span className="font-bold text-[#1E3A8A] text-[11px] shrink-0 mt-0.5">
                      {idx + 1}.
                    </span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>

              {/* Footer source */}
              {item.sourceLink && (
                <div className="pt-1 text-[11px] text-[#1E3A8A] flex items-center gap-1 font-medium truncate">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <a
                    href={item.sourceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline truncate"
                  >
                    {item.sourceLink}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
