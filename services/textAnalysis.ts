
interface StylometricStats {
    burstiness: number; // Variance of sentence lengths (0-10 normalized)
    entropy: number; // Randomness of word choice (0-10 normalized)
    perplexity: number; // Text complexity (0-100)
    repetitions: number; // Repetitive phrases score
}

class TextAnalysisEngine {

    public analyze(text: string): StylometricStats {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const words = text.split(/\s+/);

        return {
            burstiness: this.calculateBurstiness(sentences),
            entropy: this.calculateEntropy(words),
            perplexity: this.calculatePseudoPerplexity(words),
            repetitions: this.calculateRepetitions(text)
        };
    }

    /**
     * Burstiness measures the variation in sentence structure (length).
     * Humans tend to have high burstiness (mix of short/long sentences).
     * AI tends to be more uniform (low burstiness).
     */
    private calculateBurstiness(sentences: string[]): number {
        if (sentences.length < 2) return 5; // Neutral default

        const lengths = sentences.map(s => s.split(/\s+/).length);
        const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;

        // Variance
        const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
        const stdDev = Math.sqrt(variance);

        // Coefficient of variation (normalized standard deviation)
        // High variation = Human. Low variation = AI.
        const cv = stdDev / mean;

        // Normalize to 0-10 scale (typically CV is 0.2 - 0.8)
        return Math.min(10, Math.max(0, cv * 15));
    }

    /**
     * Entropy measures the randomness/unpredictability of word choice.
     * Lower entropy suggests more predictable (AI-like) text.
     */
    private calculateEntropy(words: string[]): number {
        const freq: Record<string, number> = {};
        words.forEach(w => {
            const word = w.toLowerCase().replace(/[^a-z]/g, '');
            freq[word] = (freq[word] || 0) + 1;
        });

        let entropy = 0;
        const total = words.length;

        Object.values(freq).forEach(count => {
            const p = count / total;
            entropy -= p * Math.log2(p);
        });

        // Normalize approx to 0-10 based on typical English text entropy (4-6 bits per word)
        return Math.min(10, Math.max(0, entropy * 1.5));
    }

    /**
     * A heuristic for text complexity/readability.
     * Long words + unique words = High Score.
     */
    private calculatePseudoPerplexity(words: string[]): number {
        const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
        const ttr = uniqueWords / words.length; // Type-Token Ratio

        const avgWordLen = words.reduce((a, b) => a + b.length, 0) / words.length;

        // Combine TTR and Word Length
        return Math.min(100, (ttr * 50) + (avgWordLen * 10));
    }

    private calculateRepetitions(text: string): number {
        // Detect frequent 3-gram repetitions
        const words = text.toLowerCase().split(/\s+/);
        const trigrams: Record<string, number> = {};
        let repeats = 0;

        for (let i = 0; i < words.length - 2; i++) {
            const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
            if (trigrams[trigram]) {
                repeats++;
            }
            trigrams[trigram] = 1;
        }

        return Math.min(10, (repeats / words.length) * 100);
    }
}

export const textAnalysisEngine = new TextAnalysisEngine();
