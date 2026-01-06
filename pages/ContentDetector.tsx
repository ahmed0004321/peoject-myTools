
import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiConfig';

import FileUploader from '../components/FileUploader';
import { geminiService, GeminiAnalysisResult } from '../services/geminiService';
import { aiDetectionService, SentenceMap } from '../services/aiDetector';
import { plagiarismService, SearchSnippet } from '../services/plagiarismChecker';
import { textAnalysisEngine } from '../services/textAnalysis';
import { extractTextFromFile } from '../utils/textProcessor';
import { Scan, ShieldCheck, ShieldAlert, FileText, Type, Search, ExternalLink, Loader2, Info, Activity, Fingerprint, Settings, Sparkles } from 'lucide-react';

type AnalysisResult = {
    aiScore: number;
    aiLabel: string;
    stylometrics: any;
    sentenceMap: SentenceMap[];
    plagiarismSnippets: SearchSnippet[];
    textLength: number;
    hybridScore: number;
    geminiResult?: GeminiAnalysisResult;
};

const ContentDetector: React.FC = () => {
    const [mode, setMode] = useState<'text' | 'file'>('text');
    const [textInput, setTextInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Warm up model silently
        aiDetectionService.loadModel().catch(console.error);
    }, []);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            let textToAnalyze = textInput;

            if (mode === 'file' && file) {
                textToAnalyze = await extractTextFromFile(file);
                // Auto-switch to text mode to show extracted text? Or just keep in file mode but show preview. 
                // Let's keep file mode but store text.
                setTextInput(textToAnalyze);
            }

            if (!textToAnalyze || textToAnalyze.trim().length < 50) {
                throw new Error("Text is too short. Please provide at least 50 characters.");
            }

            // Parallel execution
            // We invoke the Backend API for Gemini analysis
            const geminiPromise = fetch(`${getApiUrl()}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToAnalyze })
            }).then(r => r.ok ? r.json() : null).catch(e => {
                console.error("Backend Analysis Failed:", e);
                return null;
            });

            const [aiResult, sentenceMap, stylometrics, plagiarismSnippets, geminiResult] = await Promise.all([
                aiDetectionService.detect(textToAnalyze),
                aiDetectionService.scanSentences(textToAnalyze),
                Promise.resolve(textAnalysisEngine.analyze(textToAnalyze)),
                Promise.resolve(plagiarismService.analyze(textToAnalyze)),
                geminiPromise
            ]);

            // Calculate Hybrid Score
            // If Gemini is available, it overrides or heavily weights the score
            let hybridScore = 0;
            let aiLabel = "";

            if (geminiResult) {
                // Trust Gemini for High Accuracy
                hybridScore = geminiResult.aiScore;
                aiLabel = geminiResult.classification === 'AI' ? 'Fake' : 'Real';
            } else {
                // Fallback to Local Heuristics
                const burstinessFactor = 1 - (stylometrics.burstiness / 10);
                hybridScore = (aiResult.score * 0.7) + (burstinessFactor * 0.3);
                aiLabel = aiResult.label;
            }

            setResult({
                aiScore: aiResult.score,
                aiLabel,
                stylometrics,
                sentenceMap,
                plagiarismSnippets,
                textLength: textToAnalyze.length,
                hybridScore,
                geminiResult: geminiResult || undefined
            });

        } catch (err: any) {
            console.error("AI Analysis Error:", err);

            let message = "Analysis failed. Please try again.";

            if (err.message) {
                if (err.message.includes("Unexpected token") || err.message.includes("JSON")) {
                    message = "Network Error: Failed to download AI model config. Please check your internet connection.";
                } else {
                    message = err.message;
                }
            }

            setError(message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            // Auto analyze? No, let user click analyze.
        }
    };

    const getScoreColor = (score: number, label: string) => {
        // Model returns 'Fake' for AI.
        const isAI = label === 'Fake';
        // If AI and High Score -> Red
        // If Human (Real) and High Score -> Green

        if (isAI && score > 0.8) return 'text-red-500';
        if (isAI && score > 0.5) return 'text-orange-500';
        return 'text-green-500';
    };

    const getProgressColor = (score: number, label: string) => {
        const isAI = label === 'Fake';
        if (isAI && score > 0.8) return 'bg-red-500';
        if (isAI && score > 0.5) return 'bg-orange-500';
        return 'bg-green-500';
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4">
                    <Scan className="w-8 h-8 text-indigo-500" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    Content Integrity Check
                </h1>
                <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
                    Analyze text for AI generation and check for plagiarism using smart search snippets.
                    Private, secure, and free.
                </p>
            </div>

            {/* Main Card */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-sm relative">

                {/* Mode Switcher */}
                <div className="flex justify-center mb-8">
                    <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl">
                        <button
                            onClick={() => setMode('text')}
                            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${mode === 'text'
                                ? 'bg-white dark:bg-[var(--card-bg)] text-indigo-600 shadow-sm'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            <span className="flex items-center gap-2"><Type size={18} /> Paste Text</span>
                        </button>
                        <button
                            onClick={() => setMode('file')}
                            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${mode === 'file'
                                ? 'bg-white dark:bg-[var(--card-bg)] text-indigo-600 shadow-sm'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            <span className="flex items-center gap-2"><FileText size={18} /> Upload File</span>
                        </button>
                    </div>
                </div>

                {/* Input Section */}
                <div className="min-h-[300px]">
                    {mode === 'text' ? (
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Paste your text here (min 50 chars)..."
                            className="w-full h-64 p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-[var(--text-primary)] transition-all"
                        />
                    ) : (
                        <div className="text-center">
                            {!file ? (
                                <FileUploader
                                    onFilesSelected={handleFileSelect}
                                    accept=".txt,.pdf,.doc,.docx,image/*"
                                    title="Drop document or image"
                                    subtitle="Supports PDF, Word, Images, TXT"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-indigo-500/30 rounded-xl bg-indigo-500/5">
                                    <FileText className="w-16 h-16 text-indigo-500 mb-4" />
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{file.name}</h3>
                                    <p className="text-sm text-[var(--text-secondary)] mb-6">{(file.size / 1024).toFixed(1)} KB</p>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="text-sm font-semibold text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Remove File
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Analyze Button */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || (mode === 'text' && !textInput) || (mode === 'file' && !file)}
                        className={`
                            group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 
                            text-white text-lg font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                            w-full md:w-auto min-w-[200px] flex items-center justify-center gap-3
                        `}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" /> Analyzing...
                            </>
                        ) : (
                            <>
                                <Scan className="group-hover:scale-110 transition-transform" /> Analyze Content
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl flex items-center gap-3">
                        <ShieldAlert /> {error}
                    </div>
                )}
            </div>

            {/* Results Section */}
            {result && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* AI Detection Result */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 rounded-3xl relative overflow-hidden group">

                            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Scan size={20} /></span>
                                AI Probability
                            </h3>

                            <div className="space-y-6 relative z-10">
                                {/* Hybrid Score Display */}
                                <div className="flex items-end justify-between">
                                    <span className="text-4xl font-black text-[var(--text-primary)]">
                                        {result.aiLabel === 'Fake' ? Math.round(result.hybridScore * 100) : Math.round((1 - result.hybridScore) * 100)}%
                                    </span>
                                    <span className={`text-lg font-bold ${result.aiLabel === 'Fake' ? 'text-indigo-500' : 'text-green-500'}`}>
                                        {result.aiLabel === 'Fake' ? 'Likely AI-Generated' : 'Likely Human-Written'}
                                        {result.geminiResult && <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-500/10 text-indigo-500 rounded-full border border-indigo-500/20">Deep Scan</span>}
                                    </span>
                                </div>

                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${result.aiLabel === 'Fake' ? 'bg-indigo-500' : 'bg-green-500'} transition-all duration-1000 ease-out`}
                                        style={{ width: `${result.aiLabel === 'Fake' ? result.hybridScore * 100 : (1 - result.hybridScore) * 100}%` }}
                                    ></div>
                                </div>

                                {result.geminiResult?.reasoning && (
                                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2 text-indigo-600 font-semibold text-sm">
                                            <Sparkles size={16} /> Analysis Insight
                                        </div>
                                        <p className="text-sm text-[var(--text-primary)] italic">
                                            "{result.geminiResult.reasoning}"
                                        </p>
                                    </div>
                                )}

                                {/* Stylometrics Stats */}
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-[var(--border-color)]">
                                        <div className="flex items-center gap-2 mb-2 text-[var(--text-secondary)]">
                                            <Activity size={16} className="text-indigo-500" />
                                            <span className="text-xs font-bold uppercase">Burstiness</span>
                                        </div>
                                        <div className="text-xl font-bold text-[var(--text-primary)]">
                                            {result.stylometrics.burstiness.toFixed(1)}/10
                                        </div>
                                        <div className="text-[10px] opacity-60">Sentence variation</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-[var(--border-color)]">
                                        <div className="flex items-center gap-2 mb-2 text-[var(--text-secondary)]">
                                            <Fingerprint size={16} className="text-emerald-500" />
                                            <span className="text-xs font-bold uppercase">Entropy</span>
                                        </div>
                                        <div className="text-xl font-bold text-[var(--text-primary)]">
                                            {result.stylometrics.entropy.toFixed(1)}/10
                                        </div>
                                        <div className="text-[10px] opacity-60">Word randomness</div>
                                    </div>
                                </div>

                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    {result.aiLabel === 'Fake'
                                        ? "This text exhibits low burstiness and patterns commonly found in AI-generated content."
                                        : "This text appears to have the variance (burstiness) and perplexity typical of human writing."
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Plagiarism Check */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 rounded-3xl">
                            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <span className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Search size={20} /></span>
                                Smart Search Checks
                            </h3>

                            <div className="space-y-3">
                                {result.plagiarismSnippets.map((snippet, idx) => (
                                    <a
                                        key={idx}
                                        href={snippet.searchUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block p-4 bg-[var(--bg-secondary)] hover:bg-slate-50 dark:hover:bg-white/5 border border-[var(--border-color)] rounded-xl transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <p className="text-sm text-[var(--text-secondary)] italic line-clamp-2">
                                                "{snippet.text}"
                                            </p>
                                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0 mt-1" />
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] opacity-50 uppercase tracking-widest">
                                            <span>{snippet.location} check</span>
                                        </div>
                                    </a>
                                ))}
                            </div>

                            <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg flex gap-3 text-xs text-[var(--text-secondary)]">
                                <Info className="shrink-0 w-4 h-4 text-blue-500" />
                                <p>Click these snippets to search Google for exact matches. If results appear, the text may be copied.</p>
                            </div>
                        </div>
                    </div>

                    {/* Heatmap Visualization */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 rounded-3xl">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Scan size={20} className="text-indigo-500" /> Sentence Analysis (Heatmap)
                        </h3>
                        <div className="p-4 bg-[var(--bg-secondary)] rounded-xl leading-8 text-[var(--text-primary)]">
                            {result.sentenceMap.map((item, idx) => {
                                // Opacity based on score. High score (Fake) -> more opaque red.
                                const isFake = item.label === 'Fake';
                                const opacity = isFake ? Math.max(0.1, item.score - 0.2) : 0;
                                const style = isFake ? { backgroundColor: `rgba(239, 68, 68, ${opacity})` } : {};

                                return (
                                    <span key={idx} style={style} className={`inline transition-colors duration-300 px-1 rounded ${isFake ? 'text-red-900 dark:text-red-100' : ''}`}>
                                        {item.text}{' '}
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentDetector;
