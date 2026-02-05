/**
 * Get basic text stats
 */
export const getTextStats = (text: string) => {
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Average 200 wpm

    return { charCount, wordCount, sentenceCount, readingTime };
};

/**
 * Detect entities like emails, phone numbers, and URLs
 */
export const detectEntities = (text: string) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const urlRegex = /https?:\/\/[^\s$.?#].[^\s]*/g;

    return {
        emails: text.match(emailRegex) || [],
        phones: text.match(phoneRegex) || [],
        urls: text.match(urlRegex) || []
    };
};

/**
 * Basic text formatting functions
 */
export const formatText = {
    toUpper: (text: string) => text.toUpperCase(),
    toLower: (text: string) => text.toLowerCase(),
    toTitle: (text: string) => text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
    removeExtraLines: (text: string) => text.replace(/\n\s*\n/g, '\n\n').trim(),
    cleanSpacing: (text: string) => text.replace(/\s+/g, ' ').trim(),
    toBulletPoints: (text: string) => text.split('\n').filter(l => l.trim()).map(l => `• ${l.trim()}`).join('\n'),
    toNumberedList: (text: string) => text.split('\n').filter(l => l.trim()).map((l, i) => `${i + 1}. ${l.trim()}`).join('\n')
};
