import React, { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import {
    FileSearch, Upload, Copy, Download, Trash2,
    Loader2, AlertCircle, FileText, Languages,
    Settings, History, BarChart3, List, CaseSensitive,
    AlignLeft, Type, FileOutput, CheckCircle2, ChevronRight,
    ArrowRightLeft, Volume2, Save, Search, RefreshCcw, Sparkles
} from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { toast } from 'react-hot-toast';
import * as pdfjs from 'pdfjs-dist';
import { exportToDocx, exportToPdf, exportToPreservedPdf, exportToPreservedImage } from '../utils/ocrExport';
import { getTextStats, formatText, detectEntities } from '../utils/ocrAnalysis';
import { geminiService } from '../services/geminiService';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.530/pdf.worker.min.js`;

interface OcrWord {
    id: string;
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
    fontSize: number;
}

interface OcrLayoutPage {
    index: number;
    words: OcrWord[];
    width: number;
    height: number;
    image: string; // Background image data URL
}

interface OcrResult {
    id: string;
    filename: string;
    pages: OcrLayoutPage[];
    fullText: string;
    confidence: number;
    timestamp: number;
    originalFile?: File; // Store for PDF restoration
}

const LANGUAGES = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'hin', name: 'Hindi' },
    { code: 'ara', name: 'Arabic' },
    { code: 'chi_sim', name: 'Chinese' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'por', name: 'Portuguese' },
    { code: 'rus', name: 'Russian' },
];

const OcrTool: React.FC = () => {
    // --- State ---
    const [files, setFiles] = useState<File[]>([]);
    const [results, setResults] = useState<OcrResult[]>([]);
    const [activeTab, setActiveTab] = useState<'upload' | 'editor' | 'history'>('upload');
    const [editorMode, setEditorMode] = useState<'text' | 'visual'>('visual');
    const [currentResultIndex, setCurrentResultIndex] = useState(0);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [editorScale, setEditorScale] = useState(0.8);
    const [progress, setProgress] = useState(0);
    const [ocrLanguage, setOcrLanguage] = useState('eng');
    const [targetLanguage, setTargetLanguage] = useState('Spanish');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [history, setHistory] = useState<OcrResult[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showOverlays, setShowOverlays] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const GEMINI_API_KEY = (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || "";

    // --- Effects ---
    useEffect(() => {
        const saved = localStorage.getItem('ocr_history');
        if (saved) setHistory(JSON.parse(saved));
    }, []);

    const saveToHistory = (newResults: OcrResult[]) => {
        try {
            // Strip heavy 'pages' data (images/coordinates) for history storage to save space
            const lightResults = newResults.map(r => ({
                ...r,
                pages: [] // Reset pages in history to save localStorage quota
            }));

            const updated = [...lightResults, ...history].slice(0, 10);
            setHistory(updated);
            localStorage.setItem('ocr_history', JSON.stringify(updated));
        } catch (err) {
            console.warn("Storage quota exceeded, history not saved.", err);
            // Optionally clear old history if fullText itself is too big
            if (history.length > 5) {
                const pruned = history.slice(0, 3);
                setHistory(pruned);
                try { localStorage.setItem('ocr_history', JSON.stringify(pruned)); } catch (e) { }
            }
        }
    };

    // --- Handlers ---
    const handleFiles = (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;
        const validFiles = Array.from(selectedFiles).filter(f => f.size <= 10 * 1024 * 1024);
        if (validFiles.length > 5) {
            toast.error("Max 5 files at once for batch processing");
            setFiles(validFiles.slice(0, 5));
        } else {
            setFiles(validFiles);
        }
        setActiveTab('upload');
    };

    const processBatchOcr = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setProgress(0);
        const newResults: OcrResult[] = [];

        try {
            // Tesseract.js V5+ API: createWorker(langs, oem, options)
            // @ts-ignore
            const worker = await (createWorker as any)(ocrLanguage || 'eng', 1, {
                logger: m => {
                    if (m && m.status === 'recognizing text') {
                        const fileProgress = (m.progress || 0) / (files.length || 1);
                        const baseProgress = (newResults.length / (files.length || 1)) * 100;
                        setProgress(Math.round(baseProgress + fileProgress * 100));
                    }
                }
            });

            for (const file of files) {
                let fullText = "";
                let confidence = 0;
                let pages: OcrLayoutPage[] = [];

                if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const pdfPage = await pdf.getPage(i);
                        const viewport = pdfPage.getViewport({ scale: 2.0 });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d')!;
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        // @ts-ignore
                        await pdfPage.render({ canvasContext: context, viewport }).promise;
                        const imageData = canvas.toDataURL('image/jpeg', 0.8);

                        const result = await worker.recognize(canvas);
                        const data = result?.data;

                        const pageWords: OcrWord[] = ((data as any)?.words || []).map((w: any) => ({
                            id: Math.random().toString(36).substr(2, 9),
                            text: w.text || "",
                            x: w.bbox?.x0 || 0,
                            y: w.bbox?.y0 || 0,
                            w: (w.bbox?.x1 || 0) - (w.bbox?.x0 || 0),
                            h: (w.bbox?.y1 || 0) - (w.bbox?.y0 || 0),
                            fontSize: Math.round(w.font_size || ((w.bbox?.y1 || 0) - (w.bbox?.y0 || 0)) * 0.8 || 12)
                        }));

                        pages.push({
                            index: i - 1,
                            words: pageWords,
                            width: canvas.width,
                            height: canvas.height,
                            image: imageData
                        });

                        fullText += (data?.text || "") + "\n\n";
                        confidence = (confidence + (data?.confidence || 0)) / 2;
                    }
                } else {
                    const canvas = document.createElement('canvas');
                    const img = new Image();
                    const imageUrl = URL.createObjectURL(file);

                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = () => reject(new Error("Failed to load image"));
                        img.src = imageUrl;
                    });

                    canvas.width = img.width || 800;
                    canvas.height = img.height || 600;
                    const context = canvas.getContext('2d')!;
                    context.drawImage(img, 0, 0);
                    const imageData = canvas.toDataURL('image/jpeg', 0.8);

                    const result = await worker.recognize(canvas);
                    const data = result?.data;

                    const words: OcrWord[] = ((data as any)?.words || []).map((w: any) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        text: w.text || "",
                        x: w.bbox?.x0 || 0,
                        y: w.bbox?.y0 || 0,
                        w: (w.bbox?.x1 || 0) - (w.bbox?.x0 || 0),
                        h: (w.bbox?.y1 || 0) - (w.bbox?.y0 || 0),
                        fontSize: Math.round(w.font_size || ((w.bbox?.y1 || 0) - (w.bbox?.y0 || 0)) * 0.8 || 12)
                    }));

                    pages.push({
                        index: 0,
                        words: words,
                        width: canvas.width,
                        height: canvas.height,
                        image: imageData
                    });

                    fullText = data?.text || "";
                    confidence = data?.confidence || 0;
                    URL.revokeObjectURL(imageUrl);
                }

                newResults.push({
                    id: Math.random().toString(36).substr(2, 9),
                    filename: file.name,
                    pages: pages,
                    fullText: fullText.trim(),
                    confidence: Math.round(confidence),
                    timestamp: Date.now(),
                    originalFile: file
                });
            }

            await worker.terminate();
            setResults(newResults);
            saveToHistory(newResults);
            setActiveTab('editor');
            toast.success(`Processed ${files.length} files successfully!`);
        } catch (err: any) {
            console.error(err);
            toast.error(`Extraction failed: ${err.message || 'Unknown error'}`);
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    const handleTranslate = async () => {
        if (!activeResult?.fullText || !GEMINI_API_KEY) {
            toast.error(GEMINI_API_KEY ? "No text to translate" : "Gemini API Key missing");
            return;
        }
        setIsTranslating(true);
        try {
            const translated = await geminiService.translateText(activeResult.fullText, targetLanguage, GEMINI_API_KEY);
            const updatedResults = [...results];
            updatedResults[currentResultIndex].fullText = translated;
            setResults(updatedResults);
            toast.success("Translation complete!");
        } catch (err) {
            toast.error("Translation failed");
        } finally {
            setIsTranslating(false);
        }
    };

    const applyFormat = (action: keyof typeof formatText) => {
        if (!activeResult) return;
        const updatedResults = [...results];
        // @ts-ignore
        updatedResults[currentResultIndex].fullText = formatText[action](activeResult.fullText);
        setResults(updatedResults);
    };

    const activeResult = results[currentResultIndex];
    const stats = activeResult ? getTextStats(activeResult.fullText) : null;
    const entities = activeResult ? detectEntities(activeResult.fullText) : null;

    // --- Render ---
    return (
        <div className="min-h-screen bg-background pb-20">
            <SectionHeader
                title="AI-Powered OCR Tool"
                subtitle="Batch process images & PDFs with instant translation, advanced formatting, and export."
            />

            <div className="max-w-7xl mx-auto px-4 mt-8 flex flex-col gap-6">

                {/* Navigation Tabs */}
                <div className="flex p-1.5 bg-inset border border-border rounded-2xl w-fit mx-auto sm:mx-0">
                    {[
                        { id: 'upload', icon: Upload, label: 'Upload' },
                        { id: 'editor', icon: Type, label: 'Results & Editor' },
                        { id: 'history', icon: History, label: 'History' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-surface text-brand-blue shadow-sm' : 'text-secondary hover:text-primary'}`}
                        >
                            <tab.icon size={18} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {activeTab === 'upload' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="lg:col-span-2 space-y-6">
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                                className={`relative border-2 border-dashed rounded-3xl p-16 text-center transition-all ${isDragging ? 'border-brand-blue bg-brand-blue/5 scale-[1.01]' : 'border-border bg-surface'}`}
                            >
                                <input type="file" ref={fileInputRef} hidden multiple onChange={(e) => handleFiles(e.target.files)} accept="image/*,application/pdf" />
                                <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                                    <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-6"><Upload size={40} /></div>
                                    <h3 className="text-2xl font-black text-primary mb-2">Drag Documents Here</h3>
                                    <p className="text-secondary font-medium">Auto-detect text from JPG, PNG, WEBP, or PDF</p>
                                    <p className="text-xs text-secondary/60 mt-4 uppercase tracking-widest font-bold">Max 5 files • Up to 10MB each</p>
                                </div>
                            </div>

                            {files.length > 0 && (
                                <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-border pb-4">
                                        <h3 className="font-bold text-primary flex items-center gap-2"><List size={18} /> File Queue ({files.length})</h3>
                                        <button onClick={() => setFiles([])} className="text-rose-500 text-sm font-bold hover:underline">Clear All</button>
                                    </div>
                                    <div className="space-y-3">
                                        {files.map((f, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-background rounded-xl border border-border group hover:border-brand-blue/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-lg flex items-center justify-center font-bold text-xs uppercase">{f.name.split('.').pop()}</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-primary truncate max-w-[200px]">{f.name}</p>
                                                        <p className="text-[10px] text-secondary">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <CheckCircle2 size={18} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <select value={ocrLanguage} onChange={(e) => setOcrLanguage(e.target.value)} className="bg-inset border border-border rounded-xl px-4 py-3 font-bold text-sm outline-none cursor-pointer">
                                            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                                        </select>
                                        <button
                                            onClick={processBatchOcr}
                                            disabled={isProcessing}
                                            className="flex-1 bg-brand-blue text-white rounded-xl font-bold py-3 shadow-lg shadow-brand-blue/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? <><Loader2 className="animate-spin" /> {progress}% Done</> : <><FileSearch size={20} /> Run AI OCR Engine</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm">
                                <h4 className="text-primary font-black uppercase tracking-wider text-xs mb-6 flex items-center gap-2"><Sparkles size={16} className="text-brand-blue" /> Pro Features</h4>
                                <ul className="space-y-4">
                                    <li className="flex gap-3 text-sm text-secondary leading-relaxed">
                                        <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 size={14} /></div>
                                        <span><strong>Batch Processing</strong>: Extract text from 5 files simultaneously.</span>
                                    </li>
                                    <li className="flex gap-3 text-sm text-secondary leading-relaxed">
                                        <div className="w-6 h-6 rounded bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0 mt-0.5"><Languages size={14} /></div>
                                        <span><strong>AI Translation</strong>: Powered by Gemini for context-aware conversion.</span>
                                    </li>
                                    <li className="flex gap-3 text-sm text-secondary leading-relaxed">
                                        <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5"><FileOutput size={14} /></div>
                                        <span><strong>Export Suite</strong>: One-click export to Word (.docx) and PDF.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'editor' && results.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-6">
                            <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl">
                                <div className="bg-inset px-6 py-4 flex items-center justify-between border-b border-border">
                                    <div className="flex gap-2">
                                        {results.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentResultIndex(i)}
                                                className={`w-3 h-3 rounded-full transition-all ${currentResultIndex === i ? 'bg-brand-blue scale-125' : 'bg-secondary/30 hover:bg-secondary/50'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">File {currentResultIndex + 1} of {results.length}</span>
                                </div>

                                <div className="bg-brand-blue/10 px-6 py-3 border-b border-border flex items-center justify-between">
                                    <h2 className="font-bold text-primary truncate max-w-[250px]">{activeResult.filename}</h2>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${activeResult.confidence > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        <span className="text-xs font-bold text-secondary">{activeResult.confidence}% Confidence</span>
                                    </div>
                                </div>

                                {/* Editor Mode Toggle & Zoom */}
                                <div className="px-4 py-3 bg-background border-b border-border flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex bg-inset p-1 rounded-xl border border-border/50 shrink-0">
                                        <button
                                            onClick={() => setEditorMode('visual')}
                                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editorMode === 'visual' ? 'bg-surface text-brand-blue shadow-sm ring-1 ring-border/50' : 'text-secondary hover:text-primary'}`}
                                        >
                                            Visual Editor
                                        </button>
                                        <button
                                            onClick={() => setEditorMode('text')}
                                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editorMode === 'text' ? 'bg-surface text-brand-blue shadow-sm ring-1 ring-border/50' : 'text-secondary hover:text-primary'}`}
                                        >
                                            Raw Text
                                        </button>
                                    </div>

                                    {editorMode === 'visual' && activeResult.pages.length > 0 && (
                                        <div className="flex items-center gap-3 bg-inset/50 p-1 rounded-xl border border-border/30">
                                            <div className="flex items-center">
                                                <button onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))} className="p-2 hover:bg-inset rounded-lg text-secondary transition-colors"><ChevronRight className="rotate-180" size={16} /></button>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2 min-w-[80px] text-center">{currentPageIndex + 1} / {activeResult.pages.length}</span>
                                                <button onClick={() => setCurrentPageIndex(prev => Math.min(activeResult.pages.length - 1, prev + 1))} className="p-2 hover:bg-inset rounded-lg text-secondary transition-colors"><ChevronRight size={16} /></button>
                                            </div>
                                            <div className="w-px h-4 bg-border/50" />
                                            <div className="flex items-center">
                                                <button onClick={() => setEditorScale(s => Math.max(0.2, s - 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-inset rounded-lg text-secondary transition-colors font-bold">-</button>
                                                <span className="text-[10px] font-black text-primary w-12 text-center">{Math.round(editorScale * 100)}%</span>
                                                <button onClick={() => setEditorScale(s => Math.min(2, s + 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-inset rounded-lg text-secondary transition-colors font-bold">+</button>
                                            </div>
                                            <div className="w-px h-4 bg-border/50" />
                                            <button
                                                onClick={() => setShowOverlays(!showOverlays)}
                                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border transition-all text-[10px] font-black uppercase tracking-wider ${showOverlays ? 'bg-brand-blue/10 border-brand-blue/30 text-brand-blue shadow-sm shadow-brand-blue/10' : 'bg-inset border-border text-secondary'}`}
                                            >
                                                {showOverlays ? <Sparkles size={14} className="text-brand-blue animate-pulse" /> : <SectionHeader.Icon icon={FileSearch} size={14} />} {showOverlays ? 'Focus Off' : 'Focus On'}
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1 bg-inset/50 p-1 rounded-xl border border-border/30">
                                        <button onClick={() => applyFormat('toUpper')} className="p-2 hover:bg-inset rounded-lg text-secondary transition-colors" title="UPPERCASE"><AlignLeft size={16} /></button>
                                        <button onClick={() => applyFormat('toLower')} className="p-2 hover:bg-inset rounded-lg text-secondary transition-colors" title="lowercase"><Type size={16} /></button>
                                        <button onClick={() => applyFormat('toTitle')} className="p-2 hover:bg-inset rounded-lg text-secondary transition-colors" title="Title Case"><CaseSensitive size={16} /></button>
                                        <div className="w-px h-4 bg-border/50 mx-1" />
                                        <button onClick={() => applyFormat('removeExtraLines')} className="p-2 hover:bg-inset rounded-lg text-secondary transition-colors" title="Remove Line Breaks"><RefreshCcw size={16} /></button>
                                        <button onClick={() => applyFormat('toBulletPoints')} className="p-2 hover:bg-inset rounded-lg text-secondary transition-colors" title="Convert to Bullets"><List size={16} /></button>
                                    </div>
                                </div>

                                {editorMode === 'text' || activeResult.pages.length === 0 ? (
                                    <textarea
                                        value={activeResult.fullText}
                                        onChange={(e) => {
                                            const updated = [...results];
                                            updated[currentResultIndex].fullText = e.target.value;
                                            setResults(updated);
                                        }}
                                        className="w-full h-[650px] p-8 bg-transparent text-primary outline-none font-mono text-sm leading-relaxed resize-none"
                                        placeholder="Paste or extract text..."
                                    />
                                ) : (
                                    <div className="relative w-full h-[700px] overflow-auto bg-inset scrollbar-hide flex items-start justify-center p-8">
                                        <div
                                            className="relative bg-white shadow-2xl origin-top transition-all duration-300 ring-1 ring-black/5 shrink-0"
                                            style={{
                                                width: activeResult.pages[currentPageIndex]?.width || 0,
                                                height: activeResult.pages[currentPageIndex]?.height || 0,
                                                transform: `scale(${editorScale})`,
                                                imageRendering: 'crisp-edges',
                                                marginBottom: `-${(activeResult.pages[currentPageIndex]?.height || 0) * (1 - editorScale)}px`
                                            }}
                                        >
                                            {/* Background Image */}
                                            {activeResult.pages[currentPageIndex]?.image && (
                                                <img
                                                    src={activeResult.pages[currentPageIndex].image}
                                                    alt="Page preview"
                                                    className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 ${showOverlays ? 'opacity-40' : 'opacity-100'}`}
                                                />
                                            )}

                                            {/* Editable Word Overlays */}
                                            {showOverlays && activeResult.pages[currentPageIndex]?.words.map((word: OcrWord) => (
                                                <div
                                                    key={word.id}
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        const newText = e.currentTarget.innerText;
                                                        const updated = [...results];
                                                        const page = updated[currentResultIndex].pages[currentPageIndex] as OcrLayoutPage;
                                                        const wordIndex = page.words.findIndex(w => (w as OcrWord).id === word.id);
                                                        if (wordIndex !== -1) {
                                                            page.words[wordIndex].text = newText;
                                                            // Also update fullText for sync
                                                            const allWords = page.words.map(w => w.text).join(' ');
                                                            updated[currentResultIndex].fullText = allWords;
                                                            setResults(updated);
                                                        }
                                                    }}
                                                    className="absolute backdrop-blur-[1px] bg-white/30 hover:bg-brand-blue/20 hover:backdrop-blur-none border border-black/5 hover:border-brand-blue/40 focus:bg-white focus:shadow-xl focus:ring-2 focus:ring-brand-blue/30 focus:z-50 focus:border-brand-blue outline-none text-primary font-serif transition-all duration-200 px-0.5 rounded-sm overflow-hidden box-border cursor-text"
                                                    style={{
                                                        left: word.x,
                                                        top: word.y,
                                                        width: word.w,
                                                        height: word.h,
                                                        fontSize: `${word.fontSize}px`,
                                                        lineHeight: 1,
                                                        whiteSpace: 'nowrap',
                                                        zIndex: 10
                                                    }}
                                                    title="Click to edit"
                                                >
                                                    {word.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <button onClick={() => navigator.clipboard.writeText(activeResult.fullText).then(() => toast.success("Copied!"))} className="flex flex-col items-center gap-3 p-6 bg-surface border border-border rounded-2xl hover:border-brand-blue transition-all group">
                                    <div className="w-12 h-12 bg-inset text-secondary rounded-xl flex items-center justify-center group-hover:bg-brand-blue/10 group-hover:text-brand-blue"><Copy size={20} /></div>
                                    <span className="text-xs font-bold text-primary">Copy Text</span>
                                </button>
                                <button
                                    onClick={async () => {
                                        const originalExt = activeResult.filename.split('.').pop()?.toLowerCase();
                                        if (originalExt === 'pdf') {
                                            await exportToPreservedPdf(activeResult, `EDITED_${activeResult.filename}`);
                                        } else {
                                            await exportToPreservedImage(activeResult.pages[currentPageIndex], `EDITED_${activeResult.filename}`);
                                        }
                                        toast.success("Preserved format exported!");
                                    }}
                                    className="flex flex-col items-center gap-3 p-6 bg-brand-blue/10 border border-brand-blue/30 rounded-2xl hover:border-brand-blue transition-all group shadow-sm shadow-brand-blue/10"
                                >
                                    <div className="w-12 h-12 bg-brand-blue/20 text-brand-blue rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Save size={20} /></div>
                                    <span className="text-xs font-bold text-brand-blue text-center">Download Original Format</span>
                                </button>
                                <button onClick={() => exportToDocx(activeResult.fullText, `OCR_${activeResult.id}.docx`)} className="flex flex-col items-center gap-3 p-6 bg-surface border border-border rounded-2xl hover:border-brand-blue transition-all group">
                                    <div className="w-12 h-12 bg-inset text-secondary rounded-xl flex items-center justify-center group-hover:bg-brand-blue/10 group-hover:text-brand-blue"><FileOutput size={20} /></div>
                                    <span className="text-xs font-bold text-primary text-center">Download as Word</span>
                                </button>
                                <button onClick={() => exportToPdf(activeResult.fullText, `OCR_${activeResult.id}.pdf`)} className="flex flex-col items-center gap-3 p-6 bg-surface border border-border rounded-2xl hover:border-brand-blue transition-all group">
                                    <div className="w-12 h-12 bg-inset text-secondary rounded-xl flex items-center justify-center group-hover:bg-brand-blue/10 group-hover:text-brand-blue"><Download size={20} /></div>
                                    <span className="text-xs font-bold text-primary text-center">Download as PDF</span>
                                </button>
                            </div>
                        </div>

                        <aside className="space-y-6">
                            {/* Analysis Panel */}
                            <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl">
                                <h3 className="font-black text-primary uppercase tracking-wider text-xs mb-4 flex items-center gap-2"><BarChart3 size={16} /> Text Insights</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-inset p-3 rounded-xl border border-border">
                                        <p className="text-[10px] text-secondary font-bold uppercase">Words</p>
                                        <p className="text-lg font-black text-primary">{stats?.wordCount}</p>
                                    </div>
                                    <div className="bg-inset p-3 rounded-xl border border-border">
                                        <p className="text-[10px] text-secondary font-bold uppercase">Chars</p>
                                        <p className="text-lg font-black text-primary">{stats?.charCount}</p>
                                    </div>
                                    <div className="bg-inset p-3 rounded-xl border border-border">
                                        <p className="text-[10px] text-secondary font-bold uppercase">Sentences</p>
                                        <p className="text-lg font-black text-primary">{stats?.sentenceCount}</p>
                                    </div>
                                    <div className="bg-inset p-3 rounded-xl border border-border">
                                        <p className="text-[10px] text-secondary font-bold uppercase">Reading Time</p>
                                        <p className="text-lg font-black text-primary">{stats?.readingTime}m</p>
                                    </div>
                                </div>

                                {entities && (entities.emails.length > 0 || entities.phones.length > 0) && (
                                    <div className="mt-6 space-y-3 pt-6 border-t border-border">
                                        <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Detected Leads</p>
                                        {entities.emails.map((e, i) => <div key={i} className="text-xs bg-brand-blue/5 text-brand-blue p-2 rounded-lg border border-brand-blue/20 font-bold truncate">{e}</div>)}
                                        {entities.phones.map((p, i) => <div key={i} className="text-xs bg-amber-500/5 text-amber-500 p-2 rounded-lg border border-amber-500/20 font-bold">{p}</div>)}
                                    </div>
                                )}
                            </div>

                            {/* AI Translation Panel */}
                            <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl">
                                <h3 className="font-black text-primary uppercase tracking-wider text-xs mb-4 flex items-center gap-2"><Languages size={16} /> AI Translation</h3>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <select
                                            value={targetLanguage}
                                            onChange={(e) => setTargetLanguage(e.target.value)}
                                            className="w-full bg-inset border border-border rounded-xl px-4 py-3 font-bold text-sm outline-none cursor-pointer appearance-none"
                                        >
                                            {LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                                        </select>
                                        <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary rotate-90" />
                                    </div>
                                    <button
                                        onClick={handleTranslate}
                                        disabled={isTranslating}
                                        className="w-full bg-brand-blue text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isTranslating ? <Loader2 className="animate-spin" /> : <><ArrowRightLeft size={18} /> Translate Current</>}
                                    </button>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-primary">Recent Extractions</h3>
                            <button onClick={() => { setHistory([]); localStorage.removeItem('ocr_history'); }} className="text-rose-500 font-bold text-sm border border-rose-500/20 px-4 py-2 rounded-xl hover:bg-rose-500 hover:text-white transition-all">Clear History</button>
                        </div>

                        {history.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {history.map((h, i) => (
                                    <div key={i} className="bg-surface border border-border rounded-3xl p-6 shadow-xl hover:border-brand-blue/50 transition-all group">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-inset rounded-2xl flex items-center justify-center text-brand-blue group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                                            <p className="text-[10px] text-secondary font-black uppercase">{new Date(h.timestamp).toLocaleDateString()}</p>
                                        </div>
                                        <h4 className="font-bold text-primary mb-2 line-clamp-1">{h.filename}</h4>
                                        <p className="text-secondary text-xs line-clamp-3 mb-6 bg-inset p-3 rounded-xl border border-border/50">{h.fullText}</p>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setResults([h]); setActiveTab('editor'); setEditorMode('text'); }} className="flex-1 bg-brand-blue text-white py-2.5 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all">Recall Edit</button>
                                            <button onClick={() => navigator.clipboard.writeText(h.fullText).then(() => toast.success("Copied!"))} className="p-2.5 bg-inset text-secondary rounded-xl hover:bg-brand-blue/10 hover:text-brand-blue transition-all"><Copy size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-surface border border-border rounded-3xl p-20 text-center">
                                <History size={64} className="text-secondary/10 mx-auto mb-4" />
                                <p className="text-secondary font-bold">Your history is clean. Run an extraction to save it here.</p>
                            </div>
                        )}
                    </div>
                )}

                {results.length === 0 && activeTab === 'editor' && (
                    <div className="bg-surface border border-border rounded-3xl p-32 text-center animate-pulse">
                        <FileSearch size={64} className="text-secondary/10 mx-auto mb-4" />
                        <p className="text-secondary font-black uppercase tracking-widest text-xs">No active results. Upload documents first.</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default OcrTool;
