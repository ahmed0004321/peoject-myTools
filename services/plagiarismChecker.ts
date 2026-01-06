
export interface SearchSnippet {
    text: string;
    searchUrl: string;
    location: 'start' | 'middle' | 'end' | 'random';
}

class PlagiarismCheckerService {

    /**
     * extracts "fingerprint" phrases from the text that are suitable for searching.
     * We aim for 3-5 distinct phrases of 8-12 words length.
     */
    public analyze(text: string): SearchSnippet[] {
        const cleanText = text.replace(/\s+/g, ' ').trim();
        const words = cleanText.split(' ');

        if (words.length < 20) {
            return [{
                text: cleanText,
                searchUrl: this.createGoogleLink(cleanText),
                location: 'start'
            }];
        }

        const snippets: SearchSnippet[] = [];
        const totalWords = words.length;

        // 1. Start Snippet (skip first few words often common like "Introduction")
        const startIdx = Math.min(10, totalWords - 20);
        snippets.push(this.createSnippet(words, startIdx, 'start'));

        // 2. Middle Snippet
        const midIdx = Math.floor(totalWords / 2);
        snippets.push(this.createSnippet(words, midIdx, 'middle'));

        // 3. End Snippet
        const endIdx = Math.max(0, totalWords - 30);
        if (endIdx > midIdx + 20) {
            snippets.push(this.createSnippet(words, endIdx, 'end'));
        }

        // 4. Random Snippet if text is long
        if (totalWords > 500) {
            const randIdx = Math.floor(Math.random() * (totalWords - 40)) + 20;
            snippets.push(this.createSnippet(words, randIdx, 'random'));
        }

        return snippets;
    }

    private createSnippet(words: string[], startIndex: number, location: 'start' | 'middle' | 'end' | 'random'): SearchSnippet {
        const length = 10; // 10 words
        const slice = words.slice(startIndex, startIndex + length).join(' ');
        return {
            text: `...${slice}...`,
            searchUrl: this.createGoogleLink(slice),
            location
        };
    }

    private createGoogleLink(query: string): string {
        // Enclose in quotes for exact match search
        const q = `"${query.replace(/"/g, '')}"`;
        return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    }
}

export const plagiarismService = new PlagiarismCheckerService();
