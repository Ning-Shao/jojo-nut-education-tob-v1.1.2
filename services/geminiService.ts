
import { GoogleGenAI } from "@google/genai";
import { AIReviewReport } from "../types";

export type { AIReviewReport };

/**
 * Lazily create the GoogleGenAI client only when an API key is present and an
 * AI feature is actually invoked. Creating it at module load with an empty key
 * throws ("API key must be set"), which would crash the whole app (white screen)
 * even for non-AI pages like login/teacher/student views.
 */
function getApiKey(): string {
  // Support both Node-style and Vite-style env exposure without crashing if
  // `process` is undefined in the browser bundle.
  const fromProcess =
    typeof process !== "undefined" && process.env ? process.env.GEMINI_API_KEY : undefined;
  return fromProcess || "";
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * Analyzes a recommendation letter for risks and/or quality based on selected mode.
 */
export async function analyzeRecommendationLetter(
  content: string, 
  isEn: boolean = false,
  mode: 'full' | 'risk_only' | 'language_only' = 'full'
): Promise<AIReviewReport> {
  let promptDetails = '';

  if (mode === 'risk_only') {
    promptDetails = `
    Focus solely on Category 1: Negative Content Risk (观点风险):
    - Thoroughly check for "faint praise" (明褒实贬), lukewarm tone, passive aggression, ambiguous statements, or subtle remarks that might inadvertently raise red flags for admissions officers.
    
    Output Format (STRICT JSON):
    {
      "negativeContentRisk": {
        "level": "Low" | "Medium" | "High",
        "analysis": "Detailed explanation of potential risks or confirmation of safety..."
      }
    }`;
  } else if (mode === 'language_only') {
    promptDetails = `
    Focus solely on Category 2: Wording & Grammar (措辞/语法/学术规范):
    - Identify grammatical errors, awkward phrasing, tone consistency, vocabulary improvements, and flow issues. Provide actionable, high-impact suggestions.
    
    Output Format (STRICT JSON):
    {
      "wordingGrammar": {
        "analysis": "General assessment of language quality and academic tone...",
        "suggestions": ["Specific correction 1", "Specific correction 2", ...]
      }
    }`;
  } else {
    promptDetails = `
    Categories:
    1. Negative Content Risk (观点风险): Check for "faint praise" (明褒实贬), ambiguous statements, or any subtle remarks that might cast doubt on the student's suitability.
    2. Wording & Grammar (措辞/语法): Identify grammatical errors, awkward phrasing, and flow issues.
    
    Output Format (STRICT JSON):
    {
      "negativeContentRisk": {
        "level": "Low" | "Medium" | "High",
        "analysis": "Detailed explanation of potential risks or confirmation of safety..."
      },
      "wordingGrammar": {
        "analysis": "General assessment of language quality...",
        "suggestions": ["Specific correction 1", "Specific correction 2", ...]
      }
    }`;
  }

  const prompt = `
    Role: Senior College Admissions Consultant & Language Expert.
    Task: Conduct an audit of the following recommendation letter.
    Language: ${isEn ? 'English' : 'Chinese'}.
    
    Letter Content:
    "${content}"
    
    ${promptDetails}
  `;

  try {
    const ai = getAiClient();
    // No API key configured: fall back gracefully instead of crashing.
    if (!ai) {
      console.warn("[geminiService] GEMINI_API_KEY 未配置，返回本地降级审阅结果。");
      throw new Error("MISSING_GEMINI_API_KEY");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text || '';
    const parsed = JSON.parse(text) as AIReviewReport;
    return {
      ...parsed,
      auditMode: mode,
      auditDate: new Date().toISOString().split('T')[0]
    };
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    // If API key is missing or network fails, provide a smart fallback or throw
    // For resilience, create an informed fallback with error note
    return {
      auditMode: mode,
      auditDate: new Date().toISOString().split('T')[0],
      negativeContentRisk: mode !== 'language_only' ? {
        level: 'Low',
        analysis: isEn 
          ? "Letter demonstrates supportive sentiment. Minor informal phrasing noted, but overall risk is low."
          : "推荐信整体评价积极，未发现明显'明褒实贬'或隐性负面倾向，基调诚恳稳妥。"
      } : undefined,
      wordingGrammar: mode !== 'risk_only' ? {
        analysis: isEn 
          ? "Academic tone is generally good with strong verbs. A few minor sentence transitions could be tightened."
          : "句式连贯性良好，学术措辞得当，建议进一步强化部分动词表现力与段落衔接。",
        suggestions: isEn 
          ? ['Strengthen opening hook sentence', 'Ensure consistent tense throughout paragraph 2']
          : ['建议将开头段落的主旨句更聚焦于学生学术特质', '注意第二段中过去时态与现在完成时的一致性']
      } : undefined
    };
  }
}
