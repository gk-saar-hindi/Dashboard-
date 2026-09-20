import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  limit, 
  Firestore,
  setDoc
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User, 
  Auth 
} from "firebase/auth";
import { 
  FirebaseConfig, 
  NewsItem, 
  NewNewsInput, 
  AddNewsResult, 
  BatchPublishResult,
  AuthStateInfo 
} from "../types";

export type { AuthStateInfo };

const STORAGE_KEY = "gksaar_firebase_config";
const LOCAL_NEWS_KEY = "gksaar_local_news_fallback";
export const DEFAULT_COLLECTION_NAME = "news_stories";

// Maps UI category to uppercase relatedWord (e.g. NATIONAL, SCIENCE, SPORTS, POLICY)
export function mapCategoryToRelatedWord(category: string): string {
  const c = (category || "").trim().toLowerCase();
  if (c.includes("policy") || c.includes("नीति") || c.includes("पॉलिसी") || c.includes("कानून") || c.includes("नियम")) {
    return "POLICY";
  }
  if (c.includes("विज्ञान") || c.includes("science") || c.includes("tech") || c.includes("प्रौद्योगिकी")) {
    return "SCIENCE";
  }
  if (c.includes("खेल") || c.includes("sport")) {
    return "SPORTS";
  }
  if (c.includes("अंतर्राष्ट्रीय") || c.includes("विदेश") || c.includes("global") || c.includes("international")) {
    return "INTERNATIONAL";
  }
  if (c.includes("अर्थ") || c.includes("व्यापार") || c.includes("इकोनॉमी") || c.includes("business") || c.includes("economy")) {
    return "ECONOMY";
  }
  if (c.includes("रक्षा") || c.includes("सेना") || c.includes("defence") || c.includes("defense")) {
    return "DEFENCE";
  }
  if (c.includes("पर्यावरण") || c.includes("climate") || c.includes("environment")) {
    return "ENVIRONMENT";
  }
  if (c.includes("राज्य") || c.includes("state")) {
    return "STATE";
  }
  if (c.includes("राजनीति") || c.includes("politic")) {
    return "POLITICS";
  }
  if (c.includes("राष्ट्रीय") || c.includes("देश") || c.includes("national") || c.includes("भारत")) {
    return "NATIONAL";
  }
  const clean = category.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
  return clean || "NATIONAL";
}

// Maps uppercase relatedWord back to friendly Hindi category
export function mapRelatedWordToCategory(relatedWord?: string): string {
  const w = (relatedWord || "").trim().toUpperCase();
  switch (w) {
    case "POLICY": return "POLICY (नीति)";
    case "NATIONAL": return "राष्ट्रीय";
    case "INTERNATIONAL": return "अंतर्राष्ट्रीय";
    case "SCIENCE": return "विज्ञान एवं प्रौद्योगिकी";
    case "SPORTS": return "खेल";
    case "ECONOMY": return "अर्थव्यवस्था";
    case "DEFENCE": return "रक्षा";
    case "ENVIRONMENT": return "पर्यावरण";
    case "STATE": return "राज्य";
    case "POLITICS": return "राजनीति";
    default: return relatedWord || "सामान्य";
  }
}

// Generates a 10-digit negative integer ID like -1019728490 matching Firestore screenshot
export function generateStoryDocId(title: string, timestamp: number = Date.now()): string {
  let hash = 0;
  const str = `${title.trim()}_${timestamp}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const absVal = Math.abs(hash);
  const num = (absVal % 1147483647) + 1000000000;
  return `-${num}`;
}

// Sample initial news for demonstration and offline mode matching GKSAAR app layout
const INITIAL_DEMO_NEWS: NewsItem[] = [
  {
    id: "demo-1",
    title: '"अमेरिकी कांग्रेस द्वारा पारित 100% टैरिफ कानून के बावजूद विदेश मंत्रालय ने ऊर्जा खरीद को राष्ट्रीय हित के अधीन बताया है।"',
    category: "POLICY",
    relatedTopic: "अमेरिकी कानून और भारत की ऊर्जा सुरक्षा",
    relatedWord: "POLICY",
    points: [
      "भारत अपने 140 करोड़ नागरिकों की ऊर्जा जरूरतों को पूरा करने के लिए स्रोतों का विविधीकरण जारी रखेगा। विदेश मंत्रालय के अनुसार, ऊर्जा सुरक्षा पर निर्णय किसी बाहरी दबाव के बजाय देश की आर्थिक स्थिरता पर आधारित होंगे। यह नीति भारत-अमेरिका द्विपक्षीय संबंधों के भविष्य को प्रभावित कर सकती है। 📌 Related: Energy Security 2026"
    ],
    sourceLink: "",
    timestamp: Date.now() - 3600000 * 2,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    publishedBy: "GKSAAR Web Studio",
    syncedToFirebase: false
  },
  {
    id: "demo-2",
    title: '"चंद्रयान-4 मिशन: चंद्रमा की सतह से नमूने वापस लाने के लिए केंद्रीय मंत्रिमंडल ने 2104 करोड़ रुपये की वित्तीय स्वीकृति दी।"',
    category: "SCIENCE",
    relatedTopic: "चंद्रयान-4 और अंतरिक्ष विज्ञान",
    relatedWord: "SCIENCE",
    points: [
      "मिशन का प्राथमिक उद्देश्य चंद्रमा की सतह पर उतरना और चंद्र मिट्टी के नमूने एकत्र कर सुरक्षित पृथ्वी पर वापस लाना है। यह मिशन 2027 तक लॉन्च किया जाएगा जो भारतीय अंतरिक्ष स्टेशन के लिए मील का पत्थर साबित होगा। 📌 Related: Space Exploration 2026"
    ],
    sourceLink: "https://isro.gov.in",
    timestamp: Date.now() - 3600000 * 12,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    publishedBy: "GKSAAR Web Studio",
    syncedToFirebase: false
  },
  {
    id: "demo-3",
    title: '"पेरिस पैरालंपिक में भारत ने जीते ऐतिहासिक 29 पदक, पदक तालिका में 18वां स्थान हासिल किया।"',
    category: "SPORTS",
    relatedTopic: "पेरिस पैरालंपिक 2024",
    relatedWord: "SPORTS",
    points: [
      "भारत ने 7 स्वर्ण, 9 रजत और 13 कांस्य पदक जीतकर इतिहास रचा। अवनी लेखरा दो पैरालंपिक में 2 स्वर्ण जीतने वाली पहली भारतीय महिला निशानेबाज बनीं। 📌 Related: Indian Sports 2026"
    ],
    sourceLink: "",
    timestamp: Date.now() - 3600000 * 24,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    publishedBy: "GKSAAR Web Studio",
    syncedToFirebase: false
  }
];

class FirebaseDirectServiceManager {
  private config: FirebaseConfig = {
    apiKey: "",
    projectId: "",
    appId: "",
    collectionName: DEFAULT_COLLECTION_NAME
  };

  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private auth: Auth | null = null;
  private currentUser: User | null = null;

  // Stored Creator Session (REST / SDK persistence)
  private restAuthToken: string | null = null;
  private restAuthEmail: string | null = null;
  private restAuthUid: string | null = null;
  private restAuthExpiresAt: number = 0;

  private authListeners: Array<(auth: AuthStateInfo) => void> = [];
  private permissionListeners: Array<(denied: boolean, error?: string) => void> = [];
  private lastPermissionDenied: boolean = false;
  private lastPermissionErrorText: string = "";

  constructor() {
    this.loadConfig();
    this.loadSavedCreatorSession();
    this.initFirebase();
  }

  private loadSavedCreatorSession() {
    try {
      const savedToken = localStorage.getItem("gksaar_creator_token");
      const savedEmail = localStorage.getItem("gksaar_creator_email");
      const savedUid = localStorage.getItem("gksaar_creator_uid");
      const savedExp = localStorage.getItem("gksaar_creator_exp");
      if (savedToken && savedEmail && savedExp && Number(savedExp) > Date.now()) {
        this.restAuthToken = savedToken;
        this.restAuthEmail = savedEmail;
        this.restAuthUid = savedUid || null;
        this.restAuthExpiresAt = Number(savedExp);
      }
    } catch (e) {
      console.warn("Could not load saved creator session", e);
    }
  }

  public loadConfig(): FirebaseConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const rawCol = parsed.collectionName || "";
        // Migrate "news" to "news_stories" to match the actual Firestore screenshot
        const col = (!rawCol || rawCol === "news") ? DEFAULT_COLLECTION_NAME : rawCol;
        this.config = {
          apiKey: parsed.apiKey || "",
          projectId: parsed.projectId || "",
          appId: parsed.appId || "",
          collectionName: col
        };
      }
    } catch (e) {
      console.error("Error reading stored Firebase config", e);
    }
    return this.config;
  }

  public getConfig(): FirebaseConfig {
    return { ...this.config };
  }

  public updateCredentials(
    apiKey: string,
    projectId: string,
    appId: string,
    collectionName: string = DEFAULT_COLLECTION_NAME
  ): void {
    this.config = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      appId: appId.trim(),
      collectionName: collectionName.trim() || DEFAULT_COLLECTION_NAME
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    this.clearPermissionDenied();
    this.initFirebase();
  }

  public isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.projectId);
  }

  private initFirebase() {
    if (!this.config.apiKey || !this.config.projectId) {
      this.app = null;
      this.db = null;
      this.auth = null;
      this.currentUser = null;
      this.notifyAuthListeners();
      return;
    }

    try {
      const appName = "gksaar-web-panel";
      const existingApps = getApps();
      const current = existingApps.find(a => a.name === appName);
      if (current) {
        this.app = current;
      } else {
        this.app = initializeApp(
          {
            apiKey: this.config.apiKey,
            projectId: this.config.projectId,
            appId: this.config.appId || undefined,
          },
          appName
        );
      }
      this.db = getFirestore(this.app);
      
      // Initialize Auth
      try {
        this.auth = getAuth(this.app);
        onAuthStateChanged(this.auth, (user) => {
          this.currentUser = user;
          this.notifyAuthListeners();
        });
      } catch (authErr) {
        console.warn("Auth initialization notice:", authErr);
      }
    } catch (err) {
      console.warn("Firebase direct init error, will fallback to REST if needed", err);
      this.db = null;
    }
  }

  // Auth State & Methods
  public getAuthState(): AuthStateInfo {
    if (this.currentUser) {
      return {
        isAuthenticated: true,
        isAnonymous: Boolean(this.currentUser.isAnonymous),
        uid: this.currentUser.uid,
        email: this.currentUser.email || null,
      };
    }
    if (this.restAuthToken && this.restAuthEmail && this.restAuthExpiresAt > Date.now()) {
      return {
        isAuthenticated: true,
        isAnonymous: false,
        uid: this.restAuthUid,
        email: this.restAuthEmail,
      };
    }
    return {
      isAuthenticated: false,
      isAnonymous: false,
      uid: null,
      email: null,
    };
  }

  public onAuthChange(cb: (auth: AuthStateInfo) => void): () => void {
    this.authListeners.push(cb);
    cb(this.getAuthState());
    return () => {
      this.authListeners = this.authListeners.filter(l => l !== cb);
    };
  }

  private notifyAuthListeners() {
    const state = this.getAuthState();
    this.authListeners.forEach(cb => cb(state));
  }

  public async getIdToken(): Promise<string | null> {
    if (this.currentUser) {
      try {
        const token = await this.currentUser.getIdToken();
        if (token) return token;
      } catch (e) {
        console.warn("Failed to get ID token from SDK user", e);
      }
    }
    if (this.restAuthToken && this.restAuthExpiresAt > Date.now()) {
      return this.restAuthToken;
    }
    return null;
  }

  public async signInAnonymous(): Promise<{ success: boolean; message: string }> {
    if (!this.auth) {
      this.initFirebase();
    }
    if (!this.auth) {
      return { success: false, message: "Firebase Auth इनिशियलाइज़ नहीं हुआ। पहले API Key व Project ID सहेजें।" };
    }
    try {
      const cred = await signInAnonymously(this.auth);
      this.clearPermissionDenied();
      return { 
        success: true, 
        message: `अनाम लॉगिन सफल! UID: ${cred.user.uid.slice(0, 8)}...` 
      };
    } catch (e: any) {
      console.error("Anonymous login error:", e);
      return { 
        success: false, 
        message: `लॉगिन त्रुटि (${e.code || "unknown"}): ${e.message}. Firebase Console > Authentication में 'Anonymous' प्रोवाइडर सक्षम करें।` 
      };
    }
  }

  public async signInWithEmail(email: string, pass: string): Promise<{ success: boolean; message: string; user?: any }> {
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, message: "कृपया क्रिएटर ईमेल और पासवर्ड दोनों दर्ज करें।" };
    }

    // 1. First attempt: Firebase Auth SDK
    if (!this.auth) {
      this.initFirebase();
    }

    let sdkError = "";
    if (this.auth) {
      try {
        const cred = await signInWithEmailAndPassword(this.auth, cleanEmail, cleanPass);
        this.clearPermissionDenied();
        this.restAuthEmail = cred.user.email || cleanEmail;
        this.restAuthUid = cred.user.uid;
        try {
          const tok = await cred.user.getIdToken();
          this.restAuthToken = tok;
          this.restAuthExpiresAt = Date.now() + 3600 * 1000;
          localStorage.setItem("gksaar_creator_token", tok);
          localStorage.setItem("gksaar_creator_email", this.restAuthEmail);
          if (this.restAuthUid) localStorage.setItem("gksaar_creator_uid", this.restAuthUid);
          localStorage.setItem("gksaar_creator_exp", String(this.restAuthExpiresAt));
        } catch {}

        this.notifyAuthListeners();
        return { 
          success: true, 
          message: `🎉 क्रिएटर लॉगिन सफल! स्वागत है, ${cred.user.email || cleanEmail}`,
          user: { email: cred.user.email, uid: cred.user.uid }
        };
      } catch (e: any) {
        console.warn("Firebase SDK email login failed, attempting REST API fallback:", e);
        sdkError = e.code || e.message || "";
      }
    }

    // 2. Second attempt: Direct Google Identity Toolkit REST API Fallback
    if (this.config.apiKey) {
      try {
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.config.apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password: cleanPass,
            returnSecureToken: true
          })
        });

        if (res.ok) {
          const data = await res.json();
          this.restAuthToken = data.idToken;
          this.restAuthEmail = data.email || cleanEmail;
          this.restAuthUid = data.localId;
          const expiresInSec = Number(data.expiresIn) || 3600;
          this.restAuthExpiresAt = Date.now() + expiresInSec * 1000;

          localStorage.setItem("gksaar_creator_token", data.idToken);
          if (this.restAuthEmail) localStorage.setItem("gksaar_creator_email", this.restAuthEmail);
          if (this.restAuthUid) localStorage.setItem("gksaar_creator_uid", this.restAuthUid);
          localStorage.setItem("gksaar_creator_exp", String(this.restAuthExpiresAt));

          this.clearPermissionDenied();
          this.notifyAuthListeners();
          return {
            success: true,
            message: `🎉 क्रिएटर लॉगिन सफल! स्वागत है, ${this.restAuthEmail}`,
            user: { email: this.restAuthEmail, uid: this.restAuthUid }
          };
        } else {
          const errJson = await res.json().catch(() => ({}));
          const errCode = errJson?.error?.message || "";
          let friendlyMsg = "लॉगिन विफल रहा।";
          if (
            errCode === "INVALID_LOGIN_CREDENTIALS" || 
            errCode.includes("INVALID_PASSWORD") || 
            errCode.includes("EMAIL_NOT_FOUND")
          ) {
            friendlyMsg = "गलत क्रिएटर ईमेल या पासवर्ड। कृपया सही ईमेल व पासवर्ड दर्ज करें।";
          } else if (errCode.includes("USER_DISABLED")) {
            friendlyMsg = "यह क्रिएटर खाता Firebase में ब्लॉक / डिसेबल किया गया है।";
          } else if (errCode.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
            friendlyMsg = "अनेक असफल प्रयासों के कारण यह अस्थायी रूप से लॉक है। कुछ देर बाद प्रयास करें।";
          } else if (errCode.includes("OPERATION_NOT_ALLOWED")) {
            friendlyMsg = "Firebase Console > Authentication में 'Email/Password' प्रोवाइडर सक्षम करें।";
          } else if (errCode) {
            friendlyMsg = `Firebase Auth एरर: ${errCode}`;
          }
          return { success: false, message: friendlyMsg };
        }
      } catch (restErr: any) {
        console.error("REST Auth API error:", restErr);
      }
    }

    // Friendly error messaging
    let friendly = "लॉगिन नहीं हो सका। कृपया अपने क्रेडेंशियल्स जांचें।";
    if (sdkError.includes("user-not-found") || sdkError.includes("wrong-password") || sdkError.includes("invalid-credential")) {
      friendly = "गलत क्रिएटर ईमेल अथवा पासवर्ड। कृपया पुनः जांचें।";
    } else if (sdkError.includes("operation-not-allowed")) {
      friendly = "Firebase Console > Authentication में 'Email/Password' प्रोवाइडर चालू करें।";
    } else if (sdkError) {
      friendly = `लॉगिन त्रुटि: ${sdkError}`;
    }

    return { 
      success: false, 
      message: friendly
    };
  }

  public async signOutUser(): Promise<void> {
    if (this.auth) {
      try {
        await signOut(this.auth);
      } catch (e) {
        console.warn("SDK sign out error", e);
      }
    }
    this.currentUser = null;
    this.restAuthToken = null;
    this.restAuthEmail = null;
    this.restAuthUid = null;
    this.restAuthExpiresAt = 0;

    try {
      localStorage.removeItem("gksaar_creator_token");
      localStorage.removeItem("gksaar_creator_email");
      localStorage.removeItem("gksaar_creator_uid");
      localStorage.removeItem("gksaar_creator_exp");
    } catch {}

    this.notifyAuthListeners();
  }

  // Permission Denied Event System
  public onPermissionDenied(cb: (denied: boolean, error?: string) => void): () => void {
    this.permissionListeners.push(cb);
    if (this.lastPermissionDenied) {
      cb(true, this.lastPermissionErrorText);
    }
    return () => {
      this.permissionListeners = this.permissionListeners.filter(l => l !== cb);
    };
  }

  private setPermissionDenied(error: string) {
    this.lastPermissionDenied = true;
    this.lastPermissionErrorText = error;
    this.permissionListeners.forEach(cb => cb(true, error));
  }

  public clearPermissionDenied() {
    this.lastPermissionDenied = false;
    this.lastPermissionErrorText = "";
    this.permissionListeners.forEach(cb => cb(false));
  }

  public hasPermissionDenied(): boolean {
    return this.lastPermissionDenied;
  }

  public getLastPermissionError(): string {
    return this.lastPermissionErrorText;
  }

  // Test live connection & write permissions to Firestore
  public async testConnection(): Promise<{ 
    success: boolean; 
    message: string; 
    count?: number; 
    writeOk?: boolean;
    permissionDenied?: boolean;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: "Firebase API Key और Project ID दर्ज नहीं हैं।"
      };
    }

    let readSuccess = false;
    let docsCount = 0;
    let writeAllowed = false;
    let permissionError = false;
    let detailedError = "";

    // 1. Test Read with SDK
    if (this.db) {
      try {
        const colRef = collection(this.db, this.config.collectionName);
        const q = query(colRef, limit(5));
        const snap = await getDocs(q);
        readSuccess = true;
        docsCount = snap.size;
      } catch (sdkError: any) {
        console.warn("SDK read test notice, trying REST:", sdkError);
        if (sdkError.code === "permission-denied" || String(sdkError).includes("permission")) {
          permissionError = true;
          detailedError = sdkError.message;
        }
      }
    }

    // Fallback Read with REST API
    if (!readSuccess) {
      try {
        const token = await this.getIdToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/${this.config.collectionName}?key=${this.config.apiKey}&pageSize=5`;
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          readSuccess = true;
          docsCount = data.documents ? data.documents.length : 0;
        } else {
          const errText = await res.text();
          if (res.status === 403 || errText.includes("PERMISSION_DENIED")) {
            permissionError = true;
            detailedError = "403 PERMISSION_DENIED (Read permission rejected by Firestore rules)";
          } else {
            detailedError = `REST error (${res.status}): ${res.statusText}`;
          }
        }
      } catch (restErr: any) {
        detailedError = restErr.message || "Network error";
      }
    }

    // 2. Test Write Permission (Safe Probe)
    try {
      const probeDocId = `_probe_${Date.now()}`;
      const token = await this.getIdToken();

      if (this.db) {
        try {
          const testRef = doc(this.db, this.config.collectionName, probeDocId);
          await setDoc(testRef, { _probe: true, timestamp: Date.now() });
          writeAllowed = true;
          // Clean up probe
          deleteDoc(testRef).catch(() => {});
        } catch (sdkWriteErr: any) {
          if (sdkWriteErr.code === "permission-denied" || String(sdkWriteErr).includes("permission")) {
            permissionError = true;
            detailedError = "403 PERMISSION_DENIED (Write permission rejected by Firestore rules)";
          }
        }
      }

      if (!writeAllowed) {
        // Test write via REST
        const writeUrl = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/${this.config.collectionName}/${probeDocId}?key=${this.config.apiKey}`;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const writeRes = await fetch(writeUrl, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ fields: { _probe: { booleanValue: true } } })
        });
        if (writeRes.ok) {
          writeAllowed = true;
          // Delete test probe
          fetch(writeUrl, { method: "DELETE", headers }).catch(() => {});
        } else {
          const errBody = await writeRes.text();
          if (writeRes.status === 403 || errBody.includes("PERMISSION_DENIED")) {
            permissionError = true;
            detailedError = "403 PERMISSION_DENIED: Firestore Security Rules ने डेटा लिखने से मना कर दिया।";
          }
        }
      }
    } catch (writeErr: any) {
      console.warn("Probe write error:", writeErr);
    }

    if (permissionError) {
      this.setPermissionDenied(detailedError);
      return {
        success: false,
        permissionDenied: true,
        writeOk: false,
        message: "⚠️ 403 PERMISSION_DENIED: Firestore Security Rules लिखने की अनुमति नहीं दे रहे हैं। नीचे 'नियम ठीक करें' गाइड देखें।"
      };
    }

    if (readSuccess && writeAllowed) {
      this.clearPermissionDenied();
      return {
        success: true,
        writeOk: true,
        count: docsCount,
        message: `सफलतापूर्वक कनेक्टेड! रीड व राइट दोनों अनुमतियां सक्रिय हैं। (${docsCount} दस्तावेज़ मिले)`
      };
    }

    if (readSuccess && !writeAllowed) {
      this.setPermissionDenied("Write permission rejected");
      return {
        success: false,
        permissionDenied: true,
        writeOk: false,
        count: docsCount,
        message: `रीड अनुमति चालू है, लेकिन राइट (लिखने) की अनुमति 403 PERMISSION_DENIED से ब्लॉक है। कृपया Firestore Rules अपडेट करें।`
      };
    }

    return {
      success: false,
      permissionDenied: false,
      message: `कनेक्शन त्रुटि: ${detailedError || "कृपया Project ID व API Key जांचें।"}`
    };
  }

  // Add a single news item
  public async addNewsItem(news: NewNewsInput): Promise<AddNewsResult> {
    const timestamp = news.timestamp || Date.now();
    const cleanItem = {
      title: news.title.trim(),
      category: news.category.trim() || "सामान्य",
      points: news.points.map(p => p.trim()).filter(Boolean),
      sourceLink: news.sourceLink?.trim() || "",
      timestamp: news.timestamp || timestamp,
      createdAt: new Date().toISOString(),
      publishedBy: "GKSAAR Web Creator Studio"
    };

    // Prepare fields exactly matching the Android app and Firestore screenshot
    const formattedPoints = cleanItem.points.map(pt => {
      const trimmed = pt.trim();
      return trimmed.startsWith("*") ? trimmed : `*${trimmed}`;
    });
    const pointsJsonString = JSON.stringify(formattedPoints);
    const relatedWord = mapCategoryToRelatedWord(cleanItem.category);
    // Generate negative 10-digit ID like -1019728490 matching Firestore screenshot
    const docId = generateStoryDocId(cleanItem.title, cleanItem.timestamp);

    // Exact schema matching Firestore screenshot:
    // customGenerated: true (boolean)
    // englishPointsJson: null (null)
    // englishTitle: null (null)
    // pointsJson: string (e.g. '["*विदेश..."]')
    // relatedWord: string (e.g. 'NATIONAL')
    // saved: false (boolean)
    // timestamp: int64 (number)
    // title: string
    const exactDocData = {
      customGenerated: true,
      englishPointsJson: null,
      englishTitle: null,
      pointsJson: pointsJsonString,
      relatedWord: relatedWord,
      saved: false,
      timestamp: cleanItem.timestamp,
      title: cleanItem.title,
      relatedTopic: news.relatedTopic || cleanItem.category,
      // Helper fields for web client
      category: cleanItem.category,
      points: cleanItem.points,
      sourceLink: cleanItem.sourceLink,
      createdAt: cleanItem.createdAt,
      publishedBy: cleanItem.publishedBy
    };

    let hadPermissionDenied = false;
    let lastError: string | undefined = undefined;

    // If Firebase configured, try to write to Firestore with exact docId
    if (this.isConfigured()) {
      // 1. Try Firebase SDK setDoc with exact negative 10-digit docId
      if (this.db) {
        try {
          const docRef = doc(this.db, this.config.collectionName, docId);
          await setDoc(docRef, exactDocData);
          this.clearPermissionDenied();
          // Save also in local cache
          this.cacheSingleItem({
            ...cleanItem,
            id: docId,
            pointsJson: pointsJsonString,
            relatedWord: relatedWord,
            customGenerated: true,
            saved: false,
            syncedToFirebase: true
          });
          return { success: true, id: docId, syncedToFirebase: true };
        } catch (e: any) {
          console.warn("Firestore SDK setDoc error:", e);
          const isPerm = e.code === "permission-denied" || (e.message && e.message.toLowerCase().includes("permission"));
          if (isPerm) {
            hadPermissionDenied = true;
            lastError = "Firebase Permission Denied (403): Firestore Security Rules ने डेटा लिखने से मना कर दिया।";
          }
        }
      }

      // 2. Try REST API fallback (PATCH method creates document with specific ID)
      try {
        const token = await this.getIdToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/${this.config.collectionName}/${docId}?key=${this.config.apiKey}`;
        const restFields = {
          fields: {
            customGenerated: { booleanValue: true },
            englishPointsJson: { nullValue: null },
            englishTitle: { nullValue: null },
            pointsJson: { stringValue: pointsJsonString },
            relatedWord: { stringValue: relatedWord },
            saved: { booleanValue: false },
            timestamp: { integerValue: String(cleanItem.timestamp) },
            title: { stringValue: cleanItem.title },
            category: { stringValue: cleanItem.category },
            sourceLink: { stringValue: cleanItem.sourceLink },
            createdAt: { stringValue: cleanItem.createdAt },
            publishedBy: { stringValue: cleanItem.publishedBy },
            points: {
              arrayValue: {
                values: cleanItem.points.map(pt => ({ stringValue: pt }))
              }
            }
          }
        };
        const res = await fetch(url, {
          method: "PATCH",
          headers,
          body: JSON.stringify(restFields)
        });

        if (res.ok) {
          this.clearPermissionDenied();
          this.cacheSingleItem({
            ...cleanItem,
            id: docId,
            pointsJson: pointsJsonString,
            relatedWord: relatedWord,
            customGenerated: true,
            saved: false,
            syncedToFirebase: true
          });
          return { success: true, id: docId, syncedToFirebase: true };
        } else {
          const errData = await res.text();
          console.error("REST API error writing news:", errData);
          if (res.status === 403 || errData.includes("PERMISSION_DENIED") || errData.includes("insufficient permissions")) {
            hadPermissionDenied = true;
            lastError = "403 PERMISSION_DENIED: Missing or insufficient permissions. Firestore Security Rules ने राइट ब्लॉक किया।";
          } else {
            lastError = `REST API (${res.status}): ${res.statusText}`;
          }
        }
      } catch (restErr: any) {
        console.error("REST API write exception:", restErr);
        lastError = restErr.message;
      }
    }

    if (hadPermissionDenied) {
      this.setPermissionDenied(lastError || "403 PERMISSION_DENIED: Missing or insufficient permissions.");
    }

    // Save locally with negative 10-digit ID so format is always identical
    const fullItem: NewsItem = {
      ...cleanItem,
      id: docId,
      pointsJson: pointsJsonString,
      relatedWord: relatedWord,
      customGenerated: true,
      saved: false,
      syncedToFirebase: false
    };
    this.cacheSingleItem(fullItem);

    return {
      success: true,
      id: docId,
      syncedToFirebase: false,
      permissionDenied: hadPermissionDenied,
      error: hadPermissionDenied 
        ? "403 PERMISSION_DENIED: खबर लोकल में सुरक्षित है, पर Firebase Rules ने लिखने की अनुमति नहीं दी।"
        : (this.isConfigured() ? lastError : "लोकल मोड में सहेजा गया")
    };
  }

  // Batch publish multiple news items
  public async batchPublish(items: Array<NewNewsInput>): Promise<BatchPublishResult> {
    let publishedCount = 0;
    let syncedToFirebaseCount = 0;
    let anyPermissionDenied = false;
    let errorMsg: string | undefined = undefined;

    for (const item of items) {
      try {
        const res = await this.addNewsItem(item);
        if (res.success) {
          publishedCount++;
          if (res.syncedToFirebase) {
            syncedToFirebaseCount++;
          }
          if (res.permissionDenied) {
            anyPermissionDenied = true;
            errorMsg = res.error;
          }
        }
      } catch (err: any) {
        console.error("Failed item publish in batch:", err);
        errorMsg = err.message;
      }
    }

    return { 
      success: publishedCount > 0, 
      publishedCount,
      syncedToFirebaseCount,
      syncedToFirebase: syncedToFirebaseCount === publishedCount && publishedCount > 0,
      permissionDenied: anyPermissionDenied,
      error: errorMsg,
      errors: errorMsg ? [errorMsg] : []
    };
  }

  // Sync any locally stored items to Firebase
  public async syncLocalItemsToFirebase(): Promise<{ total: number; synced: number; failed: number; permissionDenied?: boolean }> {
    const all = this.getLocalNews();
    const unsynced = all.filter(n => !n.syncedToFirebase || n.id.startsWith("local-") || n.id.startsWith("demo-"));
    
    if (unsynced.length === 0) {
      return { total: 0, synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    let permDenied = false;

    for (const item of unsynced) {
      const res = await this.addNewsItem({
        title: item.title,
        category: item.category,
        points: item.points,
        sourceLink: item.sourceLink,
        timestamp: item.timestamp
      });

      if (res.syncedToFirebase) {
        synced++;
        // Remove old local item from cache
        this.removeLocalItemById(item.id);
      } else {
        failed++;
        if (res.permissionDenied) {
          permDenied = true;
        }
      }
    }

    return { total: unsynced.length, synced, failed, permissionDenied: permDenied };
  }

  // Fetch recent news from Firestore or local
  public async fetchNews(limitCount: number = 40): Promise<NewsItem[]> {
    const fetchedItems: NewsItem[] = [];
    const localItems = this.getLocalNews();

    // 1. Try Firestore SDK fetch
    if (this.isConfigured() && this.db) {
      try {
        const colRef = collection(this.db, this.config.collectionName);
        const q = query(colRef, limit(limitCount));
        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.forEach(docSnap => {
            const data = docSnap.data();

            // Support pointsJson (JSON string) or points (array)
            let pointsList: string[] = [];
            if (typeof data.pointsJson === "string" && data.pointsJson.trim()) {
              try {
                const parsed = JSON.parse(data.pointsJson);
                if (Array.isArray(parsed)) {
                  pointsList = parsed.map((p: any) => String(p).replace(/^\*\s*/, "").trim());
                }
              } catch {
                pointsList = [data.pointsJson];
              }
            } else if (Array.isArray(data.points)) {
              pointsList = data.points;
            } else if (typeof data.points === "string") {
              pointsList = [data.points];
            }

            const relatedWord = data.relatedWord || "";
            const category = data.category || (relatedWord ? mapRelatedWordToCategory(relatedWord) : "राष्ट्रीय");

            fetchedItems.push({
              id: docSnap.id,
              title: data.title || "बिना शीर्षक",
              category,
              points: pointsList.length > 0 ? pointsList : ["सार बिंदु उपलब्ध नहीं"],
              sourceLink: data.sourceLink || "",
              timestamp: Number(data.timestamp) || Date.now(),
              createdAt: data.createdAt || "",
              publishedBy: data.publishedBy || "Android / Web",
              syncedToFirebase: true,
              relatedTopic: data.relatedTopic || data.category || (relatedWord ? mapRelatedWordToCategory(relatedWord) : ""),
              pointsJson: data.pointsJson,
              relatedWord: data.relatedWord,
              customGenerated: data.customGenerated ?? true,
              saved: data.saved ?? false,
              englishTitle: data.englishTitle ?? null,
              englishPointsJson: data.englishPointsJson ?? null
            });
          });
        }
      } catch (sdkErr: any) {
        console.warn("SDK fetch notice, checking REST:", sdkErr);
        if (sdkErr.code === "permission-denied" || String(sdkErr).includes("permission")) {
          this.setPermissionDenied("Firestore Rules ने रीड अस्वीकार किया (403 PERMISSION_DENIED)");
        }
      }
    }

    // 2. REST fetch fallback
    if (this.isConfigured() && fetchedItems.length === 0) {
      try {
        const token = await this.getIdToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/${this.config.collectionName}?key=${this.config.apiKey}&pageSize=${limitCount}`;
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.documents && Array.isArray(data.documents)) {
            data.documents.forEach((d: any) => {
              const docId = d.name.split("/").pop();
              const fields = d.fields || {};

              // Parse pointsJson or points
              let pointsArr: string[] = [];
              if (fields.pointsJson?.stringValue) {
                try {
                  const parsed = JSON.parse(fields.pointsJson.stringValue);
                  if (Array.isArray(parsed)) {
                    pointsArr = parsed.map((p: any) => String(p).replace(/^\*\s*/, "").trim());
                  }
                } catch {
                  pointsArr = [fields.pointsJson.stringValue];
                }
              } else if (fields.points?.arrayValue?.values) {
                fields.points.arrayValue.values.forEach((v: any) => {
                  if (v.stringValue) pointsArr.push(v.stringValue);
                });
              }

              const relatedWord = fields.relatedWord?.stringValue || "";
              const category = fields.category?.stringValue || (relatedWord ? mapRelatedWordToCategory(relatedWord) : "राष्ट्रीय");

              fetchedItems.push({
                id: docId,
                title: fields.title?.stringValue || "बिना शीर्षक",
                category,
                points: pointsArr.length > 0 ? pointsArr : ["सार बिंदु उपलब्ध नहीं"],
                sourceLink: fields.sourceLink?.stringValue || "",
                timestamp: Number(fields.timestamp?.integerValue) || Date.now(),
                createdAt: fields.createdAt?.stringValue || "",
                publishedBy: fields.publishedBy?.stringValue || "Android / Web",
                syncedToFirebase: true,
                relatedTopic: fields.relatedTopic?.stringValue || fields.category?.stringValue || "",
                pointsJson: fields.pointsJson?.stringValue,
                relatedWord,
                customGenerated: fields.customGenerated?.booleanValue ?? true,
                saved: fields.saved?.booleanValue ?? false,
                englishTitle: fields.englishTitle?.stringValue ?? null,
                englishPointsJson: fields.englishPointsJson?.stringValue ?? null
              });
            });
          }
        } else {
          const errBody = await res.text();
          if (res.status === 403 || errBody.includes("PERMISSION_DENIED")) {
            this.setPermissionDenied("Firestore Rules ने रीड अस्वीकार किया (403 PERMISSION_DENIED)");
          }
        }
      } catch (restErr) {
        console.warn("REST fetch exception:", restErr);
      }
    }

    // Combine with unsynced local items so creator never loses view of offline/pending items
    const unsyncedLocals = localItems.filter(l => !l.syncedToFirebase || l.id.startsWith("local-") || l.id.startsWith("demo-"));
    const combined = [...unsyncedLocals, ...fetchedItems];
    
    // Deduplicate by ID
    const seen = new Set<string>();
    const unique = combined.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    unique.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (unique.length === 0) {
      return this.getLocalNews();
    }
    return unique;
  }

  // Delete news item
  public async deleteNewsItem(id: string): Promise<boolean> {
    if (this.isConfigured() && this.db && !id.startsWith("local-") && !id.startsWith("demo-")) {
      try {
        const docRef = doc(this.db, this.config.collectionName, id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn("Firestore delete failed, trying REST:", e);
      }
    } else if (this.isConfigured() && !id.startsWith("local-") && !id.startsWith("demo-")) {
      try {
        const token = await this.getIdToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/${this.config.collectionName}/${id}?key=${this.config.apiKey}`;
        await fetch(url, { method: "DELETE", headers });
      } catch (e) {
        console.warn("REST delete failed:", e);
      }
    }

    this.removeLocalItemById(id);
    return true;
  }

  // Local storage management helpers
  public getCachedNews(): NewsItem[] {
    return this.getLocalNews();
  }

  public getLocalNews(): NewsItem[] {
    try {
      const saved = localStorage.getItem(LOCAL_NEWS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Local news load error", e);
    }
    this.saveLocalNews(INITIAL_DEMO_NEWS);
    return INITIAL_DEMO_NEWS;
  }

  public saveLocalNews(items: NewsItem[]): void {
    try {
      localStorage.setItem(LOCAL_NEWS_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Local news save error", e);
    }
  }

  private cacheSingleItem(item: NewsItem) {
    const list = this.getLocalNews().filter(n => n.id !== item.id);
    list.unshift(item);
    this.saveLocalNews(list);
  }

  private removeLocalItemById(id: string) {
    const list = this.getLocalNews().filter(n => n.id !== id);
    this.saveLocalNews(list);
  }
}

export const FirebaseDirectService = new FirebaseDirectServiceManager();
