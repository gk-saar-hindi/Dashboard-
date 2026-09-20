/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ToastProvider, useToast } from "./components/Toast";
import { Header } from "./components/Header";
import { FirebaseConfigCard } from "./components/FirebaseConfigCard";
import { SingleNewsTab } from "./components/SingleNewsTab";
import { StoryAiTab } from "./components/StoryAiTab";
import { YouTubeTranscriptTab } from "./components/YouTubeTranscriptTab";
import { PublishedNewsList } from "./components/PublishedNewsList";
import { MobileCardPreview } from "./components/MobileCardPreview";
import { FirestoreRulesModal } from "./components/FirestoreRulesModal";
import { PermissionDeniedAlert } from "./components/PermissionDeniedAlert";
import { CreatorLoginModal } from "./components/CreatorLoginModal";
import { FirebaseDirectService } from "./services/firebaseDirectService";
import { NewsItem, AuthStateInfo } from "./types";
import { 
  FileText, 
  Scissors, 
  Tv, 
  Layers, 
  Database, 
  Smartphone, 
  Info,
  CheckCircle2,
  Lock,
  Unlock,
  Key
} from "lucide-react";

function AppContent() {
  const { showToast } = useToast();

  // Mode Selector State (0: Single News, 1: Raw Story AI Split, 2: YouTube Transcript, 3: Published List)
  const [adminTabMode, setAdminTabMode] = useState<number>(0);

  // News items fetched from Firebase or local fallback
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(FirebaseDirectService.isConfigured());
  const [authState, setAuthState] = useState<AuthStateInfo>(FirebaseDirectService.getAuthState());

  // Firestore Rules 403 modal, Creator Login modal, and alert states
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isCreatorLoginOpen, setIsCreatorLoginOpen] = useState<boolean>(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState<boolean>(false);

  // Mobile preview card state (live updates from form or selection)
  const [previewItem, setPreviewItem] = useState<{
    title: string;
    category: string;
    points: string[] | string;
    relatedTopic?: string;
    sourceLink?: string;
    timestamp?: number;
  }>({
    title: '"अमेरिकी कांग्रेस द्वारा पारित 100% टैरिफ कानून के बावजूद विदेश मंत्रालय ने ऊर्जा खरीद को राष्ट्रीय हित के अधीन बताया है।"',
    category: "POLICY",
    relatedTopic: "अमेरिकी कानून और भारत की ऊर्जा सुरक्षा",
    points: [
      "भारत अपने 140 करोड़ नागरिकों की ऊर्जा जरूरतों को पूरा करने के लिए स्रोतों का विविधीकरण जारी रखेगा। विदेश मंत्रालय के अनुसार, ऊर्जा सुरक्षा पर निर्णय किसी बाहरी दबाव के बजाय देश की आर्थिक स्थिरता पर आधारित होंगे। यह नीति भारत-अमेरिका द्विपक्षीय संबंधों के भविष्य को प्रभावित कर सकती है। 📌 Related: Energy Security 2026"
    ],
    sourceLink: "",
    timestamp: Date.now()
  });

  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(true);

  // Listen for permission denied events and auth state
  useEffect(() => {
    const unsubPerm = FirebaseDirectService.onPermissionDenied(() => {
      setShowPermissionAlert(true);
    });
    const unsubAuth = FirebaseDirectService.onAuthChange((st) => {
      setAuthState(st);
    });
    return () => {
      unsubPerm();
      unsubAuth();
    };
  }, []);

  // Load news from database on mount or refresh
  const loadNews = async () => {
    setIsLoadingNews(true);
    try {
      const items = await FirebaseDirectService.fetchNews(40);
      setNewsList(items);
      setIsFirebaseActive(FirebaseDirectService.isConfigured());
      if (items.length > 0 && adminTabMode === 3) {
        setPreviewItem(items[0]);
      }
    } catch (e: any) {
      console.error("Error fetching news:", e);
      showToast("खबरें लोड करने में समस्या: " + e.message, "error");
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleConfigSaved = () => {
    setIsFirebaseActive(FirebaseDirectService.isConfigured());
    loadNews();
  };

  const handleSuccessPublish = () => {
    loadNews();
  };

  const handleFormChange = (data: {
    title: string;
    category: string;
    points: string;
    sourceLink: string;
    relatedTopic?: string;
  }) => {
    setPreviewItem({
      title: data.title,
      category: data.category,
      points: data.points,
      sourceLink: data.sourceLink,
      relatedTopic: data.relatedTopic,
    });
  };

  const handleSelectItemForPreview = (item: {
    title: string;
    category: string;
    points: string[] | string;
    sourceLink?: string;
  }) => {
    setPreviewItem(item);
    setShowMobilePreview(true);
  };

  // Tabs matching the Jetpack Compose app
  const tabs = [
    { id: 0, title: "📌 सिंगल खबर", icon: FileText, label: "Single News" },
    { id: 1, title: "✂️ स्टोरी AI", icon: Scissors, label: "Story AI" },
    { id: 2, title: "📺 यूट्यूब", icon: Tv, label: "YouTube" },
    { id: 3, title: "📚 प्रकाशित खबरें", icon: Database, label: `Published (${newsList.length})` },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937] flex flex-col">
      {/* Top Navbar */}
      <Header
        isFirebaseActive={isFirebaseActive}
        totalNewsCount={newsList.length}
        onRefresh={loadNews}
        isRefreshing={isLoadingNews}
        showMobilePreview={showMobilePreview}
        onToggleMobilePreview={() => setShowMobilePreview(!showMobilePreview)}
        onOpenCreatorLogin={() => setIsCreatorLoginOpen(true)}
        authState={authState}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Creator Login Callout Banner when not authenticated */}
        {!authState.isAuthenticated && (
          <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                🔐
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>क्रिएटर लॉगिन: अपनी आईडी और पासवर्ड से सीधे अनलॉक करें</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                    आसान व सुरक्षित
                  </span>
                </h4>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  यदि आपके पास क्रिएटर ईमेल और पासवर्ड है, तो लॉगिन करते ही स्टूडियो और रीयल-टाइम क्लाउड सिंक तुरंत खुल जाएगा।
                </p>
              </div>
            </div>
            <button
              id="open-creator-login-banner-btn"
              type="button"
              onClick={() => setIsCreatorLoginOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
            >
              <Key className="w-3.5 h-3.5" />
              <span>🔑 आईडी & पासवर्ड दर्ज करें</span>
            </button>
          </div>
        )}

        {/* Permission Denied 403 Alert Bar if triggered */}
        {showPermissionAlert && (
          <PermissionDeniedAlert
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
            onDismiss={() => setShowPermissionAlert(false)}
          />
        )}

        {/* Firebase Config Bar */}
        <FirebaseConfigCard 
          onConfigSaved={handleConfigSaved} 
          onOpenRulesModal={() => setIsRulesModalOpen(true)}
          onOpenCreatorLogin={() => setIsCreatorLoginOpen(true)}
        />

        {/* Studio Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center Column: Creator Admin Panel */}
          <div
            className={`${
              showMobilePreview ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"
            } space-y-5`}
          >
            {/* Main Admin Box styled like Jetpack Compose Column */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#1E3A8A]/20 p-4 sm:p-6 shadow-sm space-y-5">
              {/* Header inside Box */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1E3A8A]/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">👑</span>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-[#1E3A8A] uppercase tracking-wide">
                      GKSAAR CREATOR STUDIO
                    </h2>
                    <p className="text-[11px] text-[#4B5563]">
                      कंटेंट पब्लिशिंग व सिंक कंट्रोल
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    Android App Sync:
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isFirebaseActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isFirebaseActive ? "● लाइव डेटाबेस कनेक्टेड" : "○ लोकल मोड"}
                  </span>
                </div>
              </div>

              {/* Tab Switcher - Exactly matching Jetpack Compose Row */}
              <div className="bg-[#E5E7EB] p-1 rounded-xl flex items-center gap-1">
                {tabs.map((tab) => {
                  const isSelected = adminTabMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAdminTabMode(tab.id)}
                      className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center select-none truncate ${
                        isSelected
                          ? "bg-white text-[#1E3A8A] shadow-xs"
                          : "text-[#4B5563] hover:text-[#1F2937] hover:bg-white/40"
                      }`}
                    >
                      <span>{tab.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="pt-2">
                {adminTabMode === 0 && (
                  <SingleNewsTab
                    onSuccessPublish={handleSuccessPublish}
                    onFormChange={handleFormChange}
                  />
                )}

                {adminTabMode === 1 && (
                  <StoryAiTab
                    onSuccessPublish={handleSuccessPublish}
                    onPreviewItem={handleSelectItemForPreview}
                  />
                )}

                {adminTabMode === 2 && (
                  <YouTubeTranscriptTab
                    onSuccessPublish={handleSuccessPublish}
                    onPreviewItem={handleSelectItemForPreview}
                  />
                )}

                {adminTabMode === 3 && (
                  <PublishedNewsList
                    newsList={newsList}
                    isLoading={isLoadingNews}
                    onRefresh={loadNews}
                    onSelectItem={handleSelectItemForPreview}
                    onOpenRulesModal={() => setIsRulesModalOpen(true)}
                  />
                )}
              </div>
            </div>

            {/* Sync Instructions Callout */}
            <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-xs text-[#4B5563] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[#1F2937]">
                <Info className="w-4 h-4 text-[#1E3A8A]" />
                <span>GKSAAR Android App Synchronization</span>
              </div>
              <p>
                इस वेबपेज से पब्लिश की गई कोई भी खबर सीधे आपके Firebase Firestore संग्रह में सेव होती है। आपका एंड्रॉइड ऐप (<code>package com.example</code>) इसे रीयल-टाइम में प्राप्त कर लेता है।
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1 text-slate-500">
                <span>• पैकेज: <code>com.example</code></span>
                <span>• संग्रह (Collection): <code>{FirebaseDirectService.getConfig().collectionName || "news"}</code></span>
                <span>• AI मॉडल: <code>gemini-3.8-flash</code></span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Mobile Card Live Preview */}
          {showMobilePreview && (
            <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#1E3A8A]/15 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#1E3A8A]" />
                    <h3 className="text-xs font-black text-[#1E3A8A] uppercase tracking-wider">
                      लाइव मोबाइल प्रीव्यू (GKSAAR App)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Live Sync
                  </span>
                </div>

                {/* Mobile Mockup */}
                <MobileCardPreview item={previewItem} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Rules Guidance Modal */}
      <FirestoreRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        onRulesUpdated={loadNews}
      />

      {/* Creator Login Portal Modal */}
      <CreatorLoginModal
        isOpen={isCreatorLoginOpen}
        onClose={() => setIsCreatorLoginOpen(false)}
        onLoginSuccess={() => {
          loadNews();
          showToast("क्रिएटर स्टूडियो पूरी तरह अनलॉक हो चुका है!", "success");
        }}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/60 py-4 px-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 GKSAAR Creator Studio • सुरक्षित एडमिन कंसोल</p>
          <p className="text-[11px] text-slate-400">
            Powered by Firebase Direct Sync & Google Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
