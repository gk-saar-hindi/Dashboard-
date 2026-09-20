import React from "react";
import { 
  RotateCw, 
  Scale, 
  Share2, 
  Bookmark, 
  Play, 
  ArrowUp, 
  Lightbulb, 
  ClipboardList, 
  Atom, 
  Calendar,
  ExternalLink 
} from "lucide-react";

interface MobileCardPreviewProps {
  item: {
    title: string;
    category: string;
    points: string[] | string;
    relatedTopic?: string;
    sourceLink?: string;
    timestamp?: number;
  };
}

export const MobileCardPreview: React.FC<MobileCardPreviewProps> = ({ item }) => {
  const pointsList = Array.isArray(item.points)
    ? item.points.filter((p) => p.trim().length > 0)
    : item.points
        .split("\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

  const rawTitle = item.title?.trim() || "मुख्य समाचार का उद्धरण / हेडलाइन यहाँ दिखाई देगा";
  // Ensure quotes around title to match GKSAAR format
  const displayTitle = rawTitle.startsWith('"') && rawTitle.endsWith('"')
    ? rawTitle
    : `"${rawTitle.replace(/^["“”']|["“”']$/g, "")}"`;

  const displayCategory = (item.category?.trim() || "POLICY").toUpperCase();
  const displayRelatedTopic =
    item.relatedTopic?.trim() ||
    item.category?.trim() ||
    "राष्ट्रीय घटनाक्रम";

  // Format today's date in Hindi style e.g. "20 सित॰ 2026"
  const now = item.timestamp ? new Date(item.timestamp) : new Date();
  const day = now.getDate();
  const hindiMonths = ["जन॰", "फ़र॰", "मार्च", "अप्रैल", "मई", "जून", "जुल॰", "अग॰", "सित॰", "अक्तू॰", "नव॰", "दिस॰"];
  const monthStr = hindiMonths[now.getMonth()];
  const yearStr = now.getFullYear();
  const datePillText = `${day} ${monthStr} ${yearStr} • ${displayCategory}`;

  // Join points into clean paragraph if multiple lines, or display single crisp paragraph
  const fullDetailText = pointsList.length > 0 
    ? pointsList.join(" ") 
    : "भारत अपने 140 करोड़ नागरिकों की ऊर्जा जरूरतों को पूरा करने के लिए स्रोतों का विविधीकरण जारी रखेगा। विदेश मंत्रालय के अनुसार निर्णय आर्थिक स्थिरता पर आधारित होंगे। 📌 Related: Energy Security 2026";

  return (
    <div className="flex flex-col items-center select-none">
      {/* Phone Frame Mockup */}
      <div className="w-full max-w-[360px] rounded-[44px] bg-[#0F172A] p-3.5 shadow-2xl border-[5px] border-slate-700 relative">
        {/* Speaker / Camera Punch Hole */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full flex items-center justify-center gap-1.5 z-30">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
          <div className="w-6 h-1 bg-slate-800 rounded-full" />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[11px] text-slate-400 font-medium z-20 relative">
          <span className="font-bold text-slate-200">7:25</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px]">0.20 KB/s</span>
            <span className="font-bold text-[10px] text-emerald-400">5G</span>
            <div className="w-4 h-2 rounded-sm border border-slate-400 flex items-center p-0.5">
              <div className="w-full h-full bg-slate-200 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Screen Container */}
        <div className="rounded-[32px] overflow-hidden bg-white min-h-[580px] flex flex-col justify-between border border-slate-200/80 relative shadow-inner">
          
          {/* Top Section */}
          <div>
            {/* GKSAAR Top Header Bar */}
            <div className="px-3.5 pt-3.5 pb-2.5 flex items-center justify-between bg-white border-b-2 border-[#1E3A8A]">
              {/* App Identity */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#1D3557] flex items-center justify-center text-white font-black text-lg shadow-sm">
                  G
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-extrabold text-sm text-[#0F172A] tracking-tight">GKSAAR</span>
                    <span className="text-[11px] font-semibold text-slate-500">HINDI</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium leading-none mt-0.5">
                    समसामयिकी और सामान्य ज्ञान
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg border border-slate-300 bg-slate-50/80 text-[10px] font-semibold text-slate-700 flex items-center gap-1 shadow-2xs hover:bg-slate-100"
                >
                  <RotateCw className="w-2.5 h-2.5 text-slate-600" />
                  <span>रिफ्रेश</span>
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg border border-slate-300 bg-slate-50/80 text-[10px] font-semibold text-slate-700 flex items-center gap-1 shadow-2xs hover:bg-slate-100"
                >
                  <Scale className="w-2.5 h-2.5 text-slate-600" />
                  <span>प्राइवेसी</span>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="p-3.5 space-y-3.5">
              
              {/* 1. Highlight Quote Card (Yellow/Amber box with lightbulb) */}
              <div className="bg-[#FEF9E7] border-l-4 border-[#D97706] rounded-r-xl p-3 shadow-2xs relative">
                <div className="w-6 h-6 rounded-full bg-amber-200/80 flex items-center justify-center mb-1.5 text-amber-600">
                  <Lightbulb className="w-3.5 h-3.5 fill-amber-400 text-amber-700" />
                </div>
                <h2 className="text-[13px] font-bold text-[#111827] leading-snug">
                  {displayTitle}
                </h2>
              </div>

              {/* 2. विस्तृत जानकारी Section */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#1E3A8A]">
                  <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-blue-700">
                    <ClipboardList className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-extrabold tracking-wide">
                    विस्तृत जानकारी
                  </h3>
                </div>

                <div className="text-[12px] text-slate-800 leading-relaxed font-normal bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  {fullDetailText}
                </div>
              </div>

              {/* 3. Badges / Pills */}
              <div className="space-y-2 pt-1">
                {/* Blue Pill: Related Topic */}
                <div className="w-full bg-[#1E3A8A] text-white px-3 py-2 rounded-full flex items-center gap-2 shadow-xs">
                  <div className="w-5 h-5 rounded-full bg-blue-800/80 flex items-center justify-center shrink-0">
                    <Atom className="w-3 h-3 text-cyan-300" />
                  </div>
                  <span className="text-[11px] font-semibold truncate">
                    {displayRelatedTopic} –
                  </span>
                </div>

                {/* Green Pill: Date and Policy Category */}
                <div className="w-full bg-[#16A34A] text-white px-3 py-2 rounded-full flex items-center gap-2 shadow-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-800/80 flex items-center justify-center shrink-0">
                    <Calendar className="w-3 h-3 text-emerald-200" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {datePillText}
                  </span>
                </div>
              </div>

              {/* Optional Source Link */}
              {item.sourceLink && (
                <div className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 pt-1 truncate">
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">स्रोत: {item.sourceLink}</span>
                </div>
              )}

            </div>
          </div>

          {/* Bottom Floating Bar inside Screen */}
          <div className="px-3.5 py-3 border-t border-slate-100 bg-white/95 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700 flex items-center gap-1 hover:bg-slate-100 shadow-2xs"
              >
                <span>📤</span>
                <span>शेयर</span>
              </button>
              <button
                type="button"
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700 flex items-center gap-1 hover:bg-slate-100 shadow-2xs"
              >
                <span>📑</span>
                <span>सहेजें</span>
              </button>
              <button
                type="button"
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700 flex items-center gap-1 hover:bg-slate-100 shadow-2xs"
              >
                <span>▶</span>
                <span>ऑटो</span>
              </button>
            </div>

            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border-2 border-blue-400 bg-blue-50/80 text-[11px] font-bold text-blue-700 flex items-center gap-1 shadow-2xs hover:bg-blue-100"
            >
              <span>↑</span>
              <span>अगली खबर</span>
            </button>
          </div>

        </div>

        {/* Android Navigation Bar */}
        <div className="flex items-center justify-around pt-2 px-8 text-slate-500">
          <div className="w-3.5 h-3.5 flex flex-col justify-between py-0.5">
            <div className="w-full h-0.5 bg-slate-600 rounded-full" />
            <div className="w-full h-0.5 bg-slate-600 rounded-full" />
            <div className="w-full h-0.5 bg-slate-600 rounded-full" />
          </div>
          <div className="w-3 h-3 rounded-full border-2 border-slate-600" />
          <div className="text-slate-600 text-[10px] font-bold">〈</div>
        </div>

      </div>

      <div className="text-center mt-2.5">
        <p className="text-xs font-bold text-slate-700">
          📱 GKSAAR HINDI Android ऐप का वास्तविक दृश्य
        </p>
        <p className="text-[11px] text-slate-400">
          (संक्षिप्त उद्धरण + विस्तृत जानकारी + 2 पिल्स)
        </p>
      </div>
    </div>
  );
};
