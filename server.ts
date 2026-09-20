import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Sleep utility with jitter
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper for cleaning JSON response from Gemini
function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/i, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/```\s*$/i, "");
  }
  cleaned = cleaned.trim();

  // Try finding array boundaries if there is preamble text
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  } else {
    // If it's a single object
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  // Remove trailing commas in JSON
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  return cleaned.trim();
}

// Robust Gemini content generation with intelligent multi-model pool and instant failover
async function generateWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string; modelUsed: string }> {
  // Fast, highly available model priority pool
  const candidateModels = [
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-3.8-flash"
  ];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      const text = response.text;
      if (text && text.trim().length > 0) {
        return { text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isHighDemand =
        errMsg.includes("503") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("high demand") ||
        errMsg.includes("429") ||
        errMsg.includes("RESOURCE_EXHAUSTED");

      // Silently switch to the next candidate model in the pool
      if (isHighDemand) {
        continue;
      }

      // If it's a transient socket/network blip, try one quick re-attempt
      try {
        await sleep(300);
        const retryRes = await ai.models.generateContent({
          model,
          contents: prompt,
          config: systemInstruction ? { systemInstruction } : undefined,
        });
        const retryText = retryRes.text;
        if (retryText && retryText.trim().length > 0) {
          return { text: retryText, modelUsed: model };
        }
      } catch (retryErr) {
        lastError = retryErr;
      }
    }
  }

  throw lastError || new Error("Gemini AI models are currently experiencing high demand.");
}

// Rule-based heuristic fallback for Raw Story split if AI services fail (Matches GKSAAR compact layout)
function extractFallbackFromStory(text: string, defaultCategory: string = "राष्ट्रीय") {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const chunks = paragraphs.length > 0 ? paragraphs.slice(0, 3) : [text.trim()];

  return chunks.map((para, idx) => {
    const rawSentences = para
      .split(/[।!?\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    let title = rawSentences[0]?.slice(0, 85) || `मुख्य समाचार संक्षेप #${idx + 1}`;
    if (!title.startsWith('"')) title = `"${title}"`;

    const detailText = rawSentences.slice(1, 3).join("। ");
    const points = [
      (detailText.length > 20 ? detailText : para.slice(0, 160)) + "। 📌 Related: समसामयिकी 2026"
    ];

    return {
      title,
      category: defaultCategory || "राष्ट्रीय",
      points,
      relatedTopic: rawSentences[0]?.slice(0, 40) || "राष्ट्रीय घटनाक्रम",
      sourceLink: "",
    };
  });
}

// Rule-based heuristic fallback for YouTube Transcript if AI services fail (Matches GKSAAR compact layout)
function extractFallbackFromTranscript(text: string) {
  const cleanLines = text
    .split("\n")
    .map((l) =>
      l
        .replace(/\[?\d{1,2}:\d{2}(?::\d{2})?\]?/g, "")
        .replace(/\(\d{1,2}:\d{2}(?::\d{2})?\)/g, "")
        .replace(/^(?:speaker\s*\d*|वक्ता\s*\d*):/i, "")
        .trim()
    )
    .filter((l) => {
      if (l.length < 15) return false;
      const lower = l.toLowerCase();
      if (
        lower.includes("subscribe") ||
        lower.includes("सब्सक्राइब") ||
        lower.includes("लाइक") ||
        lower.includes("comment") ||
        lower.includes("bell icon") ||
        lower.includes("चैनल")
      ) {
        return false;
      }
      return true;
    });

  const cards = [];
  const chunkSize = Math.max(3, Math.ceil(cleanLines.length / 3));

  for (let i = 0; i < cleanLines.length && cards.length < 3; i += chunkSize) {
    const slice = cleanLines.slice(i, i + chunkSize);
    if (slice.length === 0) continue;

    let title = slice[0].slice(0, 80);
    if (!title.startsWith('"')) title = `"${title}"`;

    const details = slice.slice(1, 3).join("। ") + "। 📌 Related: करंट अफेयर्स 2026";

    cards.push({
      title,
      category: "राष्ट्रीय",
      points: [details],
      relatedTopic: slice[0].slice(0, 35),
      sourceLink: "",
    });
  }

  if (cards.length === 0) {
    cards.push({
      title: `"यूट्यूब व्याख्यान से संकलित मुख्य सामान्य ज्ञान व परीक्षा-उपयोगी सार"`,
      category: "राष्ट्रीय",
      points: [
        "वीडियो व्याख्यान से निकाले गए महत्वपूर्ण प्रतियोगी परीक्षा तथ्य एवं सरकारी निर्णय। 📌 Related: General Knowledge 2026"
      ],
      relatedTopic: "समसामयिकी विश्लेषण",
      sourceLink: "",
    });
  }

  return cards;
}

// API: AI Split Raw Story into GKSAAR news cards
app.post("/api/ai/split-story", async (req: Request, res: Response) => {
  const { text, defaultCategory } = req.body;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Story text is required" });
  }

  const ai = getGenAI();
  if (!ai) {
    // Fallback rule-based extraction if key not present
    const fallbackItems = extractFallbackFromStory(text, defaultCategory);
    return res.json({
      success: true,
      items: fallbackItems,
      note: "Fallback parsing used (Gemini API key not configured in environment)."
    });
  }

  const prompt = `आप GKSAAR (जीके सार) ऐप के संपादक हैं। 
GKSAAR ऐप मोबाइल स्क्रीन पर एक कार्ड में केवल संक्षिप्त, परीक्षा-केंद्रित सार दिखाता है।
अत्यधिक लंबा टेक्स्ट या कई बड़े बुलेट्स मत बनाएं क्योंकि इससे मोबाइल का पूरा पेज भर जाता है और स्क्रीन स्क्रॉल होने लगती है।

नियम (GKSAAR App Format):
1. "title": 1 से 2 पंक्तियों का मुख्य उद्धरण/तथ्य, अनिवार्य रूप से डबल कोट्स "..." में (अधिकतम 18-25 शब्द)। जैसे:
   "अमेरिकी कांग्रेस द्वारा पारित 100% टैरिफ कानून के बावजूद विदेश मंत्रालय ने ऊर्जा खरीद को राष्ट्रीय हित के अधीन बताया है।"
2. "points": 'विस्तृत जानकारी' के लिए ठीक 1 संक्षिप्त, सटीक पैराग्राफ (केवल 45 से 60 शब्द)। इसमें मुख्य आंकड़े, परीक्षा तथ्य और निर्णय होने चाहिए। इसके अंत में "📌 Related: [विषय]" अवश्य जोड़ें।
3. "relatedTopic": नीले पिल (Pill) के लिए 3 से 6 शब्दों का छोटा विषय शीर्षक (जैसे: "अमेरिकी कानून और भारत की ऊर्जा सुरक्षा")।
4. "category": 'POLICY' | 'NATIONAL' | 'INTERNATIONAL' | 'SCIENCE' | 'SPORTS' | 'ECONOMY'

नीचे दिए गए टेक्स्ट को 1 से 3 सटीक GKSAAR कार्ड्स में बदलें:
${text}

केवल शुद्ध JSON Array लौटाएं:
[
  {
    "title": "\\"मुख्य पंक्ति यहाँ\\"",
    "category": "POLICY",
    "points": ["संक्षिप्त 2-3 वाक्यों की विस्तृत जानकारी (40-60 शब्द)। मुख्य आंकड़े यहाँ। 📌 Related: Topic Name"],
    "relatedTopic": "संबंधित विषय का नाम",
    "sourceLink": ""
  }
]
`;

  try {
    const { text: rawText, modelUsed } = await generateWithFallback(ai, prompt);
    const cleaned = cleanJsonOutput(rawText);
    const items = JSON.parse(cleaned);

    return res.json({
      success: true,
      items: Array.isArray(items) ? items : [items],
      modelUsed,
    });
  } catch (error: any) {
    console.error("AI split-story failed, falling back to heuristic extractor:", error);
    // If Gemini model is unavailable (503) or failed after retries, seamlessly extract cards with heuristic engine
    const fallbackItems = extractFallbackFromStory(text, defaultCategory);
    return res.json({
      success: true,
      items: fallbackItems,
      warning: "AI मॉडल पर अस्थायी रूप से उच्च लोड होने के कारण बैकअप इंजन द्वारा कार्ड्स तैयार किए गए हैं।",
      fallbackUsed: true
    });
  }
});

// API: AI Parse YouTube Transcript into GKSAAR news cards
app.post("/api/ai/parse-transcript", async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Transcript text is required" });
  }

  const ai = getGenAI();
  if (!ai) {
    const fallbackItems = extractFallbackFromTranscript(text);
    return res.json({
      success: true,
      items: fallbackItems,
      note: "Fallback parsing used (Gemini API key not configured in environment)."
    });
  }

  const prompt = `आप GKSAAR (जीके सार) ऐप के संपादक हैं।
नीचे दी गई यूट्यूब वीडियो ट्रांसक्रिप्ट से फालतू बातचीत, टाइमस्टैम्प हटाकर केवल परीक्षा-उपयोगी तथ्य निकालें।
GKSAAR मोबाइल ऐप का स्क्रीन लेआउट कॉम्पैक्ट है, इसलिए बहुत लंबा टेक्स्ट न बनाएं ताकि पूरा पेज न भरे।

नियम (GKSAAR App Layout):
1. "title": 1-2 पंक्तियों का मुख्य उद्धरण, अनिवार्य रूप से डबल कोट्स "..." में (अधिकतम 18-25 शब्द)।
2. "points": 'विस्तृत जानकारी' के लिए केवल 1 संक्षिप्त, सुलझा हुआ पैराग्राफ (45 से 60 शब्द)। अंत में "📌 Related: [विषय]" जोड़ें।
3. "relatedTopic": नीले पिल के लिए 3 से 6 शब्दों का टॉपिक।
4. "category": 'POLICY' | 'NATIONAL' | 'INTERNATIONAL' | 'SCIENCE' | 'SPORTS' | 'ECONOMY'

1 से 3 कार्ड्स का शुद्ध JSON Array लौटाएं:
[
  {
    "title": "\\"मुख्य उद्धरण\\"",
    "category": "NATIONAL",
    "points": ["विस्तृत जानकारी पैराग्राफ (45-60 शब्द)। 📌 Related: Topic"],
    "relatedTopic": "संबंधित विषय",
    "sourceLink": ""
  }
]

ट्रांसक्रिप्ट टेक्स्ट:
${text}
`;

  try {
    const { text: rawText, modelUsed } = await generateWithFallback(ai, prompt);
    const cleaned = cleanJsonOutput(rawText);
    const items = JSON.parse(cleaned);

    return res.json({
      success: true,
      items: Array.isArray(items) ? items : [items],
      modelUsed,
    });
  } catch (error: any) {
    console.error("AI parse-transcript failed, falling back to heuristic extractor:", error);
    const fallbackItems = extractFallbackFromTranscript(text);
    return res.json({
      success: true,
      items: fallbackItems,
      warning: "AI मॉडल पर अस्थायी रूप से उच्च लोड होने के कारण बैकअप इंजन द्वारा कार्ड्स तैयार किए गए हैं।",
      fallbackUsed: true
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GKSAAR Creator Studio running on http://localhost:${PORT}`);
  });
}

startServer();
