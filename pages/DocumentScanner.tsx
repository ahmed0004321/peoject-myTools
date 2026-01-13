import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, FileText, Image as ImageIcon, Check, Wand2, ArrowRight, Download, Edit3, Trash2, Languages, RotateCw, Maximize, Scan, FileCode, CheckCircle2, Loader2, X, GripVertical, Sparkles, Files, Type } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { saveScan, getScan } from '../services/db';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type FilterType = 'original' | 'auto' | 'magic' | 'bw' | 'clean';

interface ScannedPage {
    id: string;
    original: string; // dataURL
    processed: string; // dataURL
    text: string;
    filter: FilterType;
}

const OCR_LANGUAGES = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'hin', name: 'Hindi' },
    { code: 'ben', name: 'Bengali' },
];

const DocumentScanner: React.FC = () => {
    const [step, setStep] = useState(1);
    const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
    const [activePageIndex, setActivePageIndex] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrLanguage, setOcrLanguage] = useState('eng');
    const [extractedText, setExtractedText] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [error, setError] = useState<string | null>(null);

    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Load from DB on mount
    useEffect(() => {
        getScan('current_session').then(data => {
            if (data) {
                // Cast generic DB type to component type if needed
                setScannedPages(data.pages as ScannedPage[]);
                setExtractedText(data.extractedText);
                if (data.pages.length > 0) setStep(2);
            }
        });
    }, []);

    // Save to DB on change
    useEffect(() => {
        if (scannedPages.length > 0 || extractedText) {
            saveScan('current_session', scannedPages, extractedText);
        }
    }, [scannedPages, extractedText]);

    // --- Step 1: Capture Functions ---
    const capturePhoto = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            const newPage: ScannedPage = {
                id: Math.random().toString(36).substr(2, 9),
                original: imageSrc,
                processed: imageSrc,
                text: '',
                filter: 'original'
            };
            setScannedPages(prev => [...prev, newPage]);
            setIsCapturing(false);
        }
    }, [webcamRef]);
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type?: 'image' | 'pdf' | 'doc') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        setError(null);

        let accumulatedPages: ScannedPage[] = [];
        let accumulatedText = "";

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileType = file.type || file.name.split('.').pop()?.toLowerCase() || '';

                if (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'webp'].includes(fileType)) {
                    const dataUrl = await fileToDataURL(file);
                    accumulatedPages.push({
                        id: Math.random().toString(36).substr(2, 9),
                        original: dataUrl,
                        processed: dataUrl,
                        text: '',
                        filter: 'original'
                    });
                } else if (fileType === 'application/pdf' || fileType === 'pdf') {
                    const { pages, text } = await extractPagesFromPdf(file);
                    accumulatedPages.push(...pages);
                    if (text) accumulatedText += (accumulatedText ? '\n\n' : '') + text;
                } else if (fileType.includes('word') || ['docx', 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(fileType)) {
                    if (fileType === 'doc' || file.name.endsWith('.doc')) {
                        setError("Ancient .doc files are not supported. Please use .docx");
                        continue;
                    }
                    const docText = await extractTextFromDocx(file);
                    if (docText) {
                        accumulatedText += (accumulatedText ? '\n\n' : '') + docText;
                    } else {
                        throw new Error('Could not extract text from document.');
                    }
                } else {
                    console.warn('Unknown file type:', fileType);
                }
            }

            // Batch update states
            if (accumulatedPages.length > 0) {
                setScannedPages(prev => [...prev, ...accumulatedPages]);
            }
            if (accumulatedText) {
                setExtractedText(prev => prev ? prev + '\n\n' + accumulatedText : accumulatedText);
            }

            // Logic to move between steps
            // If we have images (from PDF or direct), go to enhancement step
            if (accumulatedPages.length > 0) {
                setStep(2);
            }
            // If we ONLY have text (DOCX or text-pure PDF) and we are currently on step 1, jump to results
            else if (accumulatedText && step === 1) {
                setStep(3);
            }
        } catch (err: any) {
            console.error('File Processing Error:', err);
            setError(`Failed to process file: ${err.message || 'Unknown error'}`);
        } finally {
            setIsProcessing(false);
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    const fileToDataURL = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    };

    const extractPagesFromPdf = async (file: File): Promise<{ pages: ScannedPage[], text: string }> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages: ScannedPage[] = [];
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            try {
                const page = await pdf.getPage(i);

                // 1. Try Text Extraction with line reconstruction
                const textContent = await page.getTextContent();
                let lastY: number | null = null;
                let textLines: string[] = [];
                let currentLine = "";

                textContent.items.forEach((item: any) => {
                    const y = item.transform[5];
                    if (lastY !== null && Math.abs(y - lastY) > 5) {
                        textLines.push(currentLine.trim());
                        currentLine = "";
                    }
                    currentLine += item.str + " ";
                    lastY = y;
                });
                textLines.push(currentLine.trim());

                let extractedTextStr = textLines.filter(l => l.length > 0).join('\n');

                // 2. Render for visual/OCR
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) throw new Error('Could not get canvas context');

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport, canvas }).promise;
                const dataUrl = canvas.toDataURL('image/png');

                pages.push({
                    id: Math.random().toString(36).substr(2, 9),
                    original: dataUrl,
                    processed: dataUrl,
                    text: extractedTextStr, // Store direct text if available
                    filter: 'original'
                });

                if (extractedTextStr.length > 20) {
                    fullText += (fullText ? '\n\n' : '') + extractedTextStr;
                }
            } catch (pageErr) {
                console.error(`Error processing PDF page ${i}:`, pageErr);
            }
        }
        return { pages, text: fullText };
    };

    const extractTextFromDocx = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });

        // mammoth.extractRawText preserves basic structure well, 
        // but we can ensure double newlines for real paragraphs if needed.
        // For now, raw text is usually cleanest for "editing"
        return result.value.trim();
    };

    const clearAll = () => {
        setScannedPages([]);
        setExtractedText('');
        setActivePageIndex(0);
        setError(null);
        setStep(1);
    };

    // --- Step 2: Advanced Preprocessing & Enhancement ---
    // --- Step 2: Advanced Preprocessing & Enhancement ---
    const preprocessImage = async (dataUrl: string, filter: FilterType = 'auto'): Promise<string> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                // 1. Draw original
                ctx.drawImage(img, 0, 0);

                if (filter === 'original') return resolve(dataUrl);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Track global stats for histogram stretching
                let min = 255, max = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    if (gray < min) min = gray;
                    if (gray > max) max = gray;
                }
                const range = max - min || 1;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

                    // Normalize (Histogram Stretch)
                    gray = ((gray - min) / range) * 255;

                    if (filter === 'bw' || filter === 'clean' || filter === 'auto') {
                        let val = gray;
                        if (filter === 'bw' || filter === 'clean') {
                            const threshold = filter === 'clean' ? 170 : 128; // Clean is aggressive
                            val = gray > threshold ? 255 : 0;
                        } else {
                            // High contrast auto
                            val = (gray - 128) * 1.2 + 128;
                        }
                        data[i] = data[i + 1] = data[i + 2] = Math.min(255, Math.max(0, val));
                    } else if (filter === 'magic') {
                        // Magic Color: Sharpness + Vibrancy
                        data[i] = Math.min(255, Math.max(0, (r - 128) * 1.2 + 128 + 5));
                        data[i + 1] = Math.min(255, Math.max(0, (g - 128) * 1.2 + 128 + 5));
                        data[i + 2] = Math.min(255, Math.max(0, (b - 128) * 1.2 + 128 + 5));
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            };
        });
    };

    const handleFilterChange = async (filter: FilterType) => {
        if (scannedPages.length === 0) return;
        setIsProcessing(true);
        try {
            const originalUrl = scannedPages[activePageIndex].original;
            const processedUrl = await preprocessImage(originalUrl, filter);
            setScannedPages(prev => prev.map((p, idx) =>
                idx === activePageIndex ? { ...p, processed: processedUrl, filter } : p
            ));
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const cleanTextData = (text: string): string => {
        return text
            .replace(/[^\x20-\x7E\n]/g, '')     // Remove non-standard artifacts
            .replace(/\s+/g, ' ')               // Single spaces
            .replace(/([.?!])\s*/g, '$1\n\n')   // Proper paragraphing
            .trim();
    };

    const removePage = (id: string) => {
        setScannedPages(scannedPages.filter(p => p.id !== id));
        if (activePageIndex >= scannedPages.length - 1) setActivePageIndex(Math.max(0, scannedPages.length - 2));
    };

    const normalizeOcrText = (text: string): string => {
        return text
            .replace(/[|]/g, 'I') // common OCR error
            .replace(/[0oO]/g, (m) => m === '0' ? '0' : 'o') // partial fix
            .replace(/\n\s*\n/g, '\n\n') // normalize paragraphs
            .replace(/\s+/g, ' ') // remove double spaces
            .replace(/([a-z])\n([a-z])/gi, '$1 $2') // fix broken lines within paragraphs
            .trim();
    };

    const getCroppedImg = (image: HTMLImageElement, pixelCrop: PixelCrop): string => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d')!;

        ctx.drawImage(
            image,
            pixelCrop.x * scaleX,
            pixelCrop.y * scaleY,
            pixelCrop.width * scaleX,
            pixelCrop.height * scaleY,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return canvas.toDataURL('image/jpeg');
    };


    // --- Step 3: OCR & Export ---
    const runOCR = async (mode: 'full' | 'selection' = 'full') => {
        setIsProcessing(true);
        setOcrProgress(0);
        let resultText = '';
        let worker: any = null;

        try {
            // Create a single worker for the entire task
            worker = await createWorker([ocrLanguage] as any, 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setOcrProgress(Math.floor(m.progress * 100));
                    }
                }
            });

            if (mode === 'selection' && completedCrop) {
                const img = document.querySelector('.ReactCrop img') as HTMLImageElement;
                if (img) {
                    const croppedUrl = getCroppedImg(img, completedCrop);
                    const { data: { text } } = await worker.recognize(croppedUrl);
                    resultText = text;
                }
            } else {
                let currentPage = 1;
                for (const page of scannedPages) {
                    if (page.text && page.text.length > 100 && mode === 'full') {
                        resultText += '\n' + page.text;
                    } else {
                        // Update progress to show which page we are on
                        const { data: { text } } = await worker.recognize(page.processed);
                        resultText += '\n' + text;
                    }
                    currentPage++;
                }
            }

            setExtractedText(prev => normalizeOcrText(prev + '\n' + resultText));
            setStep(3);
        } catch (error) {
            console.error('OCR Failed:', error);
            setError('Text extraction failed. Character recognition engine could not start.');
        } finally {
            if (worker) await worker.terminate();
            setIsProcessing(false);
        }
    };

    const exportToTxt = () => {
        const blob = new Blob([extractedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scanned-document.txt';
        a.click();
    };

    const exportToPdf = () => {
        const doc = new jsPDF();
        const lines = doc.splitTextToSize(extractedText, 180);
        doc.text(lines, 10, 10);
        doc.save('scanned-document.pdf');
    };

    const exportToDocx = async () => {
        const doc = new Document({
            sections: [{
                children: extractedText.split('\n').map(line => new Paragraph({
                    children: [new TextRun(line)]
                }))
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scanned-document.docx';
        a.click();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
                        Doc<span className="text-[var(--accent-primary)]">Scanner</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] max-w-lg">Turn any photo into clean, searchable, and editable digital text in seconds.</p>
                </div>

                <div className="flex bg-[var(--bg-secondary)] p-1.5 rounded-2xl border border-[var(--border-color)]">
                    {[1, 2, 3].map((s) => (
                        <button
                            key={s}
                            onClick={() => (s <= step || scannedPages.length > 0) && setStep(s)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${step === s ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        >
                            {step > s ? <CheckCircle2 size={16} /> : <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">{s}</span>}
                            <span className="hidden sm:inline">{s === 1 ? 'Capture' : s === 2 ? 'Enhance' : 'Extract'}</span>
                        </button>
                    ))}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        <div className="lg:col-span-2 space-y-6">
                            <div className="luxe-card p-1 overflow-y-auto relative group min-h-[450px] lg:aspect-[4/3] flex items-center justify-center bg-black/20">
                                {isCapturing ? (
                                    <div className="relative w-full h-full">
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-x-0 bottom-8 flex justify-center gap-4">
                                            <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-2xl flex items-center justify-center text-emerald-600 hover:scale-110 active:scale-95 transition-all">
                                                <Camera size={32} />
                                            </button>
                                            <button onClick={() => setIsCapturing(false)} className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-all">
                                                <X size={24} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-4 sm:p-8 space-y-6 sm:space-y-8 w-full max-w-2xl">
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--accent-primary)]/10 rounded-2xl flex items-center justify-center mx-auto text-[var(--accent-primary)] group-hover:scale-110 transition-transform">
                                                <Scan size={32} className="sm:hidden" />
                                                <Scan size={40} className="hidden sm:block" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Capture or Upload</h3>
                                                <p className="text-sm sm:text-base text-[var(--text-secondary)]">Select a source to begin document scanning.</p>
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-sm animate-shake">
                                                <X size={18} className="shrink-0" />
                                                <p className="font-medium text-left">{error}</p>
                                                <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-rose-500/10 rounded">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setIsCapturing(true)}
                                                disabled={isProcessing}
                                                className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all group/btn disabled:opacity-50"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                                    <Camera size={24} />
                                                </div>
                                                <span className="font-bold text-sm">Use Camera</span>
                                            </button>

                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isProcessing}
                                                className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all group/btn disabled:opacity-50"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                                    <ImageIcon size={24} />
                                                </div>
                                                <span className="font-bold text-sm">Image / Screenshot</span>
                                            </button>

                                            <button
                                                onClick={() => pdfInputRef.current?.click()}
                                                disabled={isProcessing}
                                                className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all group/btn disabled:opacity-50"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                                    <FileText size={24} />
                                                </div>
                                                <span className="font-bold text-sm">Upload PDF</span>
                                            </button>

                                            <button
                                                onClick={() => docInputRef.current?.click()}
                                                disabled={isProcessing}
                                                className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all group/btn disabled:opacity-50"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                                    <FileCode size={24} />
                                                </div>
                                                <span className="font-bold text-sm">Word (DOCX)</span>
                                            </button>
                                        </div>

                                        {isProcessing && (
                                            <div className="flex items-center justify-center gap-3 pt-4 text-[var(--accent-primary)]">
                                                <Loader2 size={24} className="animate-spin" />
                                                <p className="font-bold text-sm animate-pulse">Processing document...</p>
                                            </div>
                                        )}

                                        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileUpload} />
                                        <input type="file" ref={pdfInputRef} className="hidden" multiple accept=".pdf" onChange={handleFileUpload} />
                                        <input type="file" ref={docInputRef} className="hidden" multiple accept=".docx,.doc" onChange={handleFileUpload} />
                                    </div>
                                )}
                            </div>

                            {scannedPages.length > 0 && (
                                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[var(--text-primary)]">{scannedPages.length} Pages Captured</p>
                                            <p className="text-xs text-[var(--text-secondary)]">Ready for enhancement and OCR</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setStep(2)} className="btn-luxe flex items-center gap-2 px-6">
                                        Next Level <ArrowRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                                    <ImageIcon size={16} /> Recent Scans
                                </h3>
                                {scannedPages.length > 0 && (
                                    <button onClick={clearAll} className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1">
                                        <Trash2 size={12} /> Clear All
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {scannedPages.map((page, idx) => (
                                    <div key={page.id} className={`group relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${activePageIndex === idx ? 'border-[var(--accent-primary)] scale-105 z-10' : 'border-[var(--border-color)]'}`}>
                                        <img src={page.processed} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button onClick={() => { setActivePageIndex(idx); setStep(2); }} className="p-2 bg-white text-black rounded-lg hover:bg-[var(--accent-primary)] hover:text-white transition-colors">
                                                <Wand2 size={18} />
                                            </button>
                                            <button onClick={() => removePage(page.id)} className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {scannedPages.length === 0 && (
                                    Array(4).fill(0).map((_, i) => (
                                        <div key={i} className="aspect-[3/4] rounded-xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex items-center justify-center text-[var(--text-secondary)]/20">
                                            <ImageIcon size={24} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-4 gap-8"
                    >
                        <div className="lg:col-span-3 space-y-6">
                            <div className="luxe-card p-4 flex flex-col items-center justify-center bg-[var(--bg-secondary)] min-h-[60dvh] relative">
                                {scannedPages.length > 0 ? (
                                    <div className="max-w-full overflow-hidden rounded-lg shadow-2xl border border-[var(--border-color)]">
                                        <ReactCrop
                                            crop={crop}
                                            onChange={c => setCrop(c)}
                                            onComplete={c => setCompletedCrop(c)}
                                        >
                                            <img
                                                src={scannedPages[activePageIndex].processed}
                                                className="max-w-full max-h-[700px]"
                                                onLoad={(e) => {
                                                    const { width, height } = e.currentTarget;
                                                    setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), width, height));
                                                }}
                                            />
                                        </ReactCrop>
                                    </div>
                                ) : (
                                    <p>No pages scanned</p>
                                )}

                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 p-2 bg-[var(--bg-secondary)]/90 backdrop-blur-xl rounded-2xl border border-[var(--border-color)] shadow-2xl z-20 w-[90%] sm:w-auto">
                                    {(['original', 'auto', 'magic', 'bw', 'clean'] as FilterType[]).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => handleFilterChange(f)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${scannedPages[activePageIndex].filter === f
                                                ? 'bg-[var(--accent-primary)] text-white shadow-lg'
                                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                                                }`}
                                        >
                                            {f === 'magic' && <Sparkles size={14} />}
                                            {f === 'auto' && <Wand2 size={14} />}
                                            {f === 'bw' && <Maximize size={14} />}
                                            {f === 'clean' && <RotateCw size={14} />}
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="luxe-card p-6 space-y-4">
                                <h3 className="font-bold text-lg text-[var(--text-primary)]">OCR Settings</h3>
                                <div className="space-y-4">
                                    <label className="block text-sm font-semibold text-[var(--text-secondary)]">Language</label>
                                    <select
                                        value={ocrLanguage}
                                        onChange={(e) => setOcrLanguage(e.target.value)}
                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:ring-2 ring-[var(--accent-primary)] font-bold text-[var(--text-primary)]"
                                    >
                                        {OCR_LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => runOCR('full')}
                                        disabled={isProcessing}
                                        className="w-full btn-luxe py-4 flex items-center justify-center gap-3 relative overflow-hidden"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                <span>Processing {ocrProgress}%</span>
                                            </>
                                        ) : (
                                            <>
                                                <Scan size={20} /> Extract All Pages
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => runOCR('selection')}
                                        disabled={isProcessing || !completedCrop}
                                        className="w-full py-3 rounded-xl border border-[var(--border-color)] text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <Maximize size={16} /> Extract Selection
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Manage Pages</p>
                                    <span className="text-[10px] text-[var(--text-secondary)] italic">Drag to reorder</span>
                                </div>
                                <Reorder.Group
                                    axis="y"
                                    values={scannedPages}
                                    onReorder={setScannedPages}
                                    className="space-y-2"
                                >
                                    {scannedPages.map((page, idx) => (
                                        <Reorder.Item
                                            key={page.id}
                                            value={page}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${activePageIndex === idx
                                                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]'
                                                : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                                                }`}
                                            onClick={() => setActivePageIndex(idx)}
                                        >
                                            <GripVertical size={16} className="text-[var(--text-secondary)] shrink-0" />
                                            <div className="w-10 h-13 rounded bg-black/20 overflow-hidden shrink-0 border border-[var(--border-color)]">
                                                <img src={page.processed} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">Page {idx + 1}</p>
                                                <p className="text-[10px] text-[var(--text-secondary)] truncate capitalize">{page.filter} Filter</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                                                className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 space-y-6">
                                <div className="luxe-card p-6 min-h-[500px] flex flex-col">
                                    <div className="flex items-center justify-between mb-4 border-b border-[var(--border-color)] pb-4">
                                        <h3 className="flex items-center gap-2 font-bold text-lg">
                                            <Edit3 size={18} className="text-[var(--accent-primary)]" /> Extracted Text
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setExtractedText(cleanTextData(extractedText))}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary)]/20 transition-all text-sm font-bold"
                                                title="Fix spacing and symbols"
                                            >
                                                <Sparkles size={16} /> Clean Text
                                            </button>
                                            <button onClick={() => setExtractedText('')} className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={extractedText}
                                        onChange={(e) => setExtractedText(e.target.value)}
                                        className="flex-1 w-full bg-transparent border-none focus:ring-0 text-lg leading-relaxed resize-none font-medium custom-scrollbar"
                                        placeholder="No text extracted yet..."
                                    />
                                </div>
                            </div>

                            <div className="w-full md:w-80 space-y-6">
                                <div className="luxe-card p-8 bg-gradient-to-br from-[var(--accent-primary)]/20 to-transparent border-[var(--accent-primary)]/30 space-y-6">
                                    <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)] text-white shadow-xl shadow-indigo-500/20 flex items-center justify-center">
                                        <Download size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Ready to Save?</h3>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1">Export your document in high-quality professional formats.</p>
                                    </div>
                                    <div className="space-y-3 pt-4">
                                        <button onClick={exportToTxt} className="w-full flex items-center justify-between p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl font-bold hover:border-[var(--accent-primary)] transition-all">
                                            <span className="flex items-center gap-3"><FileText size={18} /> TXT</span>
                                            <ArrowRight size={14} className="opacity-40" />
                                        </button>
                                        <button onClick={exportToPdf} className="w-full flex items-center justify-between p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl font-bold hover:border-[var(--accent-primary)] transition-all">
                                            <span className="flex items-center gap-3"><ImageIcon size={18} /> PDF</span>
                                            <ArrowRight size={14} className="opacity-40" />
                                        </button>
                                        <button onClick={exportToDocx} className="w-full flex items-center justify-between p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl font-bold hover:border-[var(--accent-primary)] transition-all">
                                            <span className="flex items-center gap-3"><FileCode size={18} /> DOCX</span>
                                            <ArrowRight size={14} className="opacity-40" />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep(1)}
                                    className="w-full py-4 text-sm font-bold text-[var(--border-color)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2"
                                >
                                    <RotateCw size={14} /> Start New Scan
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DocumentScanner;
