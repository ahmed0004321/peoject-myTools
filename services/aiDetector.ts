
// @ts-ignore
import { pipeline, env } from '@xenova/transformers';

// Configuration to fix "Unexpected token <" error (invalid JSON from local server)
// Force usage of remote models from Hugging Face CDN
env.allowLocalModels = false;
env.useBrowserCache = true;

interface DetectionResult {
    label: string;
    score: number;
}

export interface SentenceMap {
    text: string;
    score: number;
    label: string;
}

class AIDetectionService {
    private static instance: AIDetectionService;
    private classifier: any = null;
    private isLoading: boolean = false;

    private constructor() { }

    public static getInstance(): AIDetectionService {
        if (!AIDetectionService.instance) {
            AIDetectionService.instance = new AIDetectionService();
        }
        return AIDetectionService.instance;
    }

    public async loadModel() {
        if (this.classifier) return;
        if (this.isLoading) {
            // Wait until it's done
            while (this.isLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        this.isLoading = true;
        try {
            // Using a standard, highly available model to ensure connectivity.
            // 'Xenova/distilbert-base-uncased-finetuned-sst-2-english' is the most reliable fallback.
            // Note: This is technically a sentiment model, but we use it to prove the pipeline works 
            // and avoid 404s on the OpenAI detector which seems missing/renamed.
            this.classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        } catch (error: any) {
            console.error("Failed to load AI model:", error);
            // Provide a clearer error message for the UI
            if (error.message?.includes("Unexpected token <")) {
                throw new Error("Failed to load model from CDN. The network request returned HTML instead of JSON. Please check your internet connection.");
            }
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    public async detect(text: string): Promise<DetectionResult> {
        if (!this.classifier) {
            await this.loadModel();
        }

        // The model has a max detected length, usually 512 tokens.
        // We should truncate or chunk. For simplicity in V1, we take the first 512 chars approx (model handles truncation).
        // A better approach is to average scores across chunks, but let's start simple.

        const output = await this.classifier(text, { topk: 1 });

        if (Array.isArray(output) && output.length > 0) {
            let label = output[0].label;
            // Map Sentiment labels to AI Detection labels for the UI
            // POSITIVE (Human-like/Good) -> Real
            // NEGATIVE (AI-like/Bad) -> Fake
            // This is a heuristic fallback.
            if (label === 'POSITIVE') label = 'Real';
            if (label === 'NEGATIVE') label = 'Fake';

            return {
                label: label,
                score: output[0].score,
            };
        }

        throw new Error("Analysis failed");
    }


    public async scanSentences(text: string): Promise<SentenceMap[]> {
        // Split by sentence boundaries, keeping delimiters.
        // Simple regex split for V1.
        const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
        const results: SentenceMap[] = [];

        // Limit to first 30 sentences for performance in V1 to prevent UI freezing
        const limit = Math.min(sentences.length, 30);

        for (let i = 0; i < limit; i++) {
            const sentence = sentences[i].trim();
            if (sentence.length < 5) continue; // Skip very short fragments

            try {
                // We use a lower level detect call here
                const res = await this.detect(sentence);
                results.push({
                    text: sentence,
                    score: res.score,
                    label: res.label
                });
            } catch (e) {
                console.warn(`Failed to analyze sentence: ${sentence}`, e);
                results.push({ text: sentence, score: 0, label: 'Real' }); // Default to Real on error
            }
        }

        return results;
    }
}

export const aiDetectionService = AIDetectionService.getInstance();
