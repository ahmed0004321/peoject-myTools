import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiConfig';

import { geminiService, GeminiAnalysisResult } from '../services/geminiService';
import { aiDetectionService, SentenceMap } from '../services/aiDetector';
import { plagiarismService, SearchSnippet } from '../services/plagiarismChecker';
import { textAnalysisEngine } from '../services/textAnalysis';
import { extractTextFromFile } from '../utils/textProcessor';
import { Scan, ShieldCheck, ShieldAlert, FileText, Type, Search, ExternalLink, Loader2, Info, Activity, Fingerprint, Settings, Sparkles, Upload } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

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
            let hybridScore = 0;
            let aiLabel = "";

            if (geminiResult) {
                hybridScore = geminiResult.aiScore;
                aiLabel = geminiResult.classification === 'AI' ? 'Fake' : 'Real';
            } else {
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setFile(files[0]);
            setMode('file');
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 animate-fade-in">
            <SectionHeader
                title="Content Integrity Check"
                subtitle="Analyze text for AI generation and check for plagiarism."
            />

            <div className={`max-w-5xl mx-auto px-4 ${!result && !textInput && !file ? 'max-w-3xl' : ''}`}>

                {/* Initial State: Standard Centered Card if no input */}
                {!result && !textInput && !file ? (
                    <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl text-center space-y-8 animate-slide-up">
                        <div className="space-y-6">
                            <div className="w-24 h-24 bg-brand-purple/10 text-brand-purple rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck size={48} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Analyze Content</h3>
                                <p className="text-secondary">Paste text or upload a document to detect AI usage.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={() => setTextInput(' ')} // Trick to switch to workspace
                                    className="px-8 py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-600 transition-all hover:scale-105 shadow-lg shadow-purple-500/20 flex items-center gap-2"
                                >
                                    <Type size={20} /> Paste Text
                                </button>
                                <label className="px-8 py-4 bg-surface border border-border text-primary rounded-xl font-bold text-lg cursor-pointer hover:bg-secondary/50 transition-all hover:scale-105 flex items-center gap-2">
                                    <Upload size={20} />
                                    Upload File
                                    <input type="file" className="hidden" accept=".txt,.pdf,.doc,.docx" onChange={handleFileSelect} />
                                </label>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Workspace State */
                    <div className="space-y-8 animate-fade-in">

                        {/* Input Area */}
                        <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl space-y-6">
                            <div className="flex bg-inset p-1 rounded-xl w-fit mx-auto border border-border">
                                <button
                                    onClick={() => { setMode('text'); setFile(null); }}
                                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'text' ? 'bg-background shadow-sm text-brand-purple' : 'text-secondary hover:text-primary'}`}
                                >
                                    Text Input
                                </button>
                                <button
                                    onClick={() => setMode('file')}
                                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'file' ? 'bg-background shadow-sm text-brand-purple' : 'text-secondary hover:text-primary'}`}
                                >
                                    File Upload
                                </button>
                            </div>

                            {mode === 'text' ? (
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Paste your text here (min 50 chars)..."
                                    className="w-full h-64 p-4 bg-inset border border-border rounded-xl focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple outline-none resize-none text-primary transition-all font-mono text-sm"
                                />
                            ) : (
                                <div className={`h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${file ? 'border-brand-purple bg-brand-purple/5' : 'border-border hover:border-brand-purple hover:bg-inset'}`}>
                                    {!file ? (
                                        <label className="cursor-pointer flex flex-col items-center gap-4 w-full h-full justify-center">
                                            <Upload size={48} className="text-secondary" />
                                            <span className="font-bold text-secondary">Click to Upload Document</span>
                                            <input type="file" className="hidden" accept=".txt,.pdf,.doc,.docx" onChange={handleFileSelect} />
                                        </label>
                                    ) : (
                                        <div className="text-center space-y-4">
                                            <div className="w-16 h-16 bg-brand-purple/20 text-brand-purple rounded-xl flex items-center justify-center mx-auto">
                                                <FileText size={32} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg text-primary">{file.name}</p>
                                                <p className="text-sm text-secondary">{(file.size / 1024).toFixed(2)} KB</p>
                                            </div>
                                            <button onClick={() => setFile(null)} className="text-red-500 font-bold hover:underline">Remove</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-center">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || (mode === 'text' && textInput.length < 50) || (mode === 'file' && !file)}
                                    className="px-12 py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-600 transition-all hover:scale-105 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
                                >
                                    {isAnalyzing ? <Loader2 className="animate-spin" /> : <Scan />}
                                    {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                                </button>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 font-medium">
                                    <ShieldAlert /> {error}
                                </div>
                            )}
                        </div>

                        {/* Results */}
                        {result && (
                            <div className="space-y-8 animate-slide-up">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Score Card */}
                                    <div className="bg-surface border border-border p-8 rounded-3xl overflow-hidden relative group shadow-lg">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-brand-purple/10 text-brand-purple rounded-lg">
                                                <Scan size={24} />
                                            </div>
                                            <h3 className="text-xl font-bold">AI Probability</h3>
                                        </div>

                                        <div className="relative z-10 space-y-6">
                                            <div className="flex items-end justify-between">
                                                <span className="text-5xl font-black text-primary">
                                                    {result.aiLabel === 'Fake' ? Math.round(result.hybridScore * 100) : Math.round((1 - result.hybridScore) * 100)}%
                                                </span>
                                                <span className={`text-xl font-bold ${result.aiLabel === 'Fake' ? 'text-indigo-500' : 'text-green-500'}`}>
                                                    {result.aiLabel === 'Fake' ? 'Likely AI' : 'Likely Human'}
                                                </span>
                                            </div>

                                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${result.aiLabel === 'Fake' ? 'bg-indigo-500' : 'bg-green-500'}`}
                                                    style={{ width: `${result.aiLabel === 'Fake' ? result.hybridScore * 100 : (1 - result.hybridScore) * 100}%` }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-inset rounded-xl border border-border">
                                                    <div className="text-xs font-bold text-secondary uppercase mb-1">Burstiness</div>
                                                    <div className="text-2xl font-bold">{result.stylometrics.burstiness.toFixed(1)}/10</div>
                                                </div>
                                                <div className="p-4 bg-inset rounded-xl border border-border">
                                                    <div className="text-xs font-bold text-secondary uppercase mb-1">Entropy</div>
                                                    <div className="text-2xl font-bold">{result.stylometrics.entropy.toFixed(1)}/10</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Plagiarism Card */}
                                    <div className="bg-surface border border-border p-8 rounded-3xl shadow-lg">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg">
                                                <Search size={24} />
                                            </div>
                                            <h3 className="text-xl font-bold">Plagiarism Check</h3>
                                        </div>

                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {result.plagiarismSnippets.length === 0 ? (
                                                <div className="text-center py-10 text-secondary">
                                                    <ShieldCheck size={48} className="mx-auto mb-3 opacity-20" />
                                                    <p>No blatant plagiarism detected.</p>
                                                </div>
                                            ) : (
                                                result.plagiarismSnippets.map((snippet, idx) => (
                                                    <a key={idx} href={snippet.searchUrl} target="_blank" rel="noreferrer" className="block p-4 bg-inset border border-border rounded-xl hover:bg-secondary/5 transition-all group">
                                                        <div className="flex justify-between items-start gap-3">
                                                            <p className="text-sm italic text-secondary line-clamp-2">"{snippet.text}"</p>
                                                            <ExternalLink size={16} className="text-secondary group-hover:text-brand-purple shrink-0" />
                                                        </div>
                                                    </a>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContentDetector;
