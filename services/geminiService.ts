
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiAnalysisResult {
    aiScore: number; // 0 to 1
    aiConfidence: number; // 0 to 1
    classification: 'Human' | 'AI' | 'Mixed';
    reasoning: string;
    plagiarismRisk: number; // 0 to 1
    estimatedOriginality: number; // 0 to 1
}

class GeminiService {

    public async analyzeContent(text: string, apiKey: string): Promise<GeminiAnalysisResult> {
        if (!apiKey) throw new Error("API Key is missing");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are a top-tier linguistic forensics expert. Analyze the following text for:
        1. AI-Generated Probability: Is this likely written by an LLM?
        2. Authorship Style: Is it Formal Academic, Casual, Technical, or Robotic?
        3. Plagiarism Risk: Does it contain generic, copied, or template-like phrasing common in SOPs or essays?

        IMPORTANT:
        - Do NOT classify "Formal Academic" or "SOP" writing as AI simply because it is structured.
        - High perplexity and varied sentence structure suggests Human.
        - Repetitive, overly smooth, or hallucinated logic suggests AI.

        Return ONLY a raw JSON object (no markdown formatting) with this structure:
        {
            "aiScore": number (0.0 to 1.0, where 1.0 is definitely AI),
            "aiConfidence": number (0.0 to 1.0),
            "classification": "Human" | "AI" | "Mixed",
            "reasoning": "string (Explain WHY in 2 sentences. Mention specific stylistic traits observed.)",
            "plagiarismRisk": number (0.0 to 1.0),
            "estimatedOriginality": number (0.0 to 1.0)
        }

        Text to Analyze:
        "${text.slice(0, 15000)}" 
        `; // Limit context window safely

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textResponse = response.text();

            // Clean markdown code blocks if present
            const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(cleanJson);
        } catch (error) {
            console.error("Gemini Analysis Failed:", error);
            throw new Error("Failed to consult Gemini. Please check your API Key.");
        }
    }
}

export const geminiService = new GeminiService();
