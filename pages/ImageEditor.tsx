import React, { useState, useEffect } from 'react';
import { Upload, Download, FileText, Settings, RefreshCw, AlertCircle, Trash2, ArrowRight, Grid, Type, Lock, Unlock, Image as ImageIcon } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import FileUploader from '../components/FileUploader';
import { compressImage, optimizePdf, formatBytes, OptimizationOptions } from '../utils/mediaProcessor';
import JSZip from 'jszip';

interface ProcessedFile {
    id: string;
    originalFile: File;
    processedBlob: Blob | null;
    status: 'idle' | 'processing' | 'done' | 'error';
    newSize?: number;
    error?: string;
    options: OptimizationOptions;
}

type Unit = 'px' | 'cm' | 'in';
type ResizeMode = 'by_size' | 'percentage' | 'social';

const MediaOptimizer: React.FC = () => {
    const [files, setFiles] = useState<ProcessedFile[]>([]);
    const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);

    // UI Logic
    const [activeTab, setActiveTab] = useState<ResizeMode>('by_size');

    // Global Settings State
    const [width, setWidth] = useState<number | undefined>(undefined);
    const [height, setHeight] = useState<number | undefined>(undefined);
    const [unit, setUnit] = useState<Unit>('px');
    const [dpi, setDpi] = useState<number>(72);
    const [lockAspectRatio, setLockAspectRatio] = useState(true);
    const [aspectRatio, setAspectRatio] = useState<number>(1); // Default square until loaded

    // Compression Settings
    const [targetSizeKB, setTargetSizeKB] = useState<number | undefined>(undefined);
    const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
    const [fitMode, setFitMode] = useState<'stretch' | 'cover' | 'contain'>('stretch');
    const [percentage, setPercentage] = useState<number>(100);

    // Helpers
    const toPixels = (val: number, u: Unit) => {
        if (u === 'px') return Math.round(val);
        if (u === 'in') return Math.round(val * dpi);
        if (u === 'cm') return Math.round((val / 2.54) * dpi);
        return val;
    };

    // Debounced Dimensions State (for UI inputs)
    const [inputWidth, setInputWidth] = useState<string>('');
    const [inputHeight, setInputHeight] = useState<string>('');

    // Sync inputs when global state changes (e.g. from file load)
    useEffect(() => {
        if (width !== undefined) setInputWidth(width.toString());
        if (height !== undefined) setInputHeight(height.toString());
    }, [width, height]);

    // Initialize aspect ratio from first file
    useEffect(() => {
        if (files.length > 0 && files[0].originalFile.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
                const ratio = img.width / img.height;
                setAspectRatio(ratio);
                // Only set defaults if not set
                if (width === undefined) {
                    setWidth(img.width);
                    setInputWidth(img.width.toString());
                    setHeight(img.height);
                    setInputHeight(img.height.toString());
                }
            };
            img.src = URL.createObjectURL(files[0].originalFile);
        }
    }, [files.length]);

    // Handling Width Change (Debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            const val = parseFloat(inputWidth);
            if (!isNaN(val) && val !== width) {
                setWidth(val);
                if (lockAspectRatio && val) {
                    const newH = Number((val / aspectRatio).toFixed(0));
                    setHeight(newH);
                    // Update the height input to match calculated value
                    setInputHeight(newH.toString());
                }
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [inputWidth, lockAspectRatio, aspectRatio]);

    // Handling Height Change (Debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            const val = parseFloat(inputHeight);
            if (!isNaN(val) && val !== height) {
                setHeight(val);
                if (lockAspectRatio && val) {
                    const newW = Number((val * aspectRatio).toFixed(0));
                    setWidth(newW);
                    setInputWidth(newW.toString());
                }
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [inputHeight, lockAspectRatio, aspectRatio]);


    const handleWidthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputWidth(e.target.value);
    };

    const handleHeightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputHeight(e.target.value);
    };

    const handleFilesSelected = (newFiles: File[]) => {
        const newEntries: ProcessedFile[] = newFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            originalFile: file,
            processedBlob: null,
            status: 'idle',
            options: {}
        }));
        setFiles(prev => [...prev, ...newEntries]);
    };

    const processSingleFile = async (fileEntry: ProcessedFile) => {
        setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, status: 'processing', error: undefined } : f));

        try {
            // Determine dimensions based on Mode
            let finalW: number | undefined = undefined;
            let finalH: number | undefined = undefined;

            if (activeTab === 'by_size') {
                if (width) finalW = toPixels(width, unit);
                if (height) finalH = toPixels(height, unit);
            } else if (activeTab === 'percentage') {
                // We need original dimensions to calculate percentage
                const img = new Image();
                img.src = URL.createObjectURL(fileEntry.originalFile);
                await new Promise(r => img.onload = r);
                finalW = Math.round(img.width * (percentage / 100));
                finalH = Math.round(img.height * (percentage / 100));
            }

            const options: OptimizationOptions = {
                maxSizeMB: targetSizeKB ? targetSizeKB / 1024 : undefined,
                targetWidth: finalW,
                targetHeight: finalH,
                targetFormat: targetFormat,
                maintainAspectRatio: lockAspectRatio,
                fitMode: fitMode
            };

            let resultBlob: Blob;
            if (fileEntry.originalFile.type === 'application/pdf') {
                resultBlob = await optimizePdf(fileEntry.originalFile, options);
            } else {
                resultBlob = await compressImage(fileEntry.originalFile, options);
            }

            setFiles(prev => prev.map(f => f.id === fileEntry.id ? {
                ...f,
                status: 'done',
                processedBlob: resultBlob,
                newSize: resultBlob.size,
                options
            } : f));

        } catch (error) {
            console.error("Processing failed", error);
            setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, status: 'error' } : f));
        }
    };

    const processAllFiles = async () => {
        setIsGlobalProcessing(true);
        for (const f of files) {
            // Process if not done OR if settings changed (naive check: always re-process if user clicks)
            await processSingleFile(f);
        }
        setIsGlobalProcessing(false);
    };

    // ... Download helpers similar to previous ...
    const downloadFile = (fileItem: ProcessedFile) => {
        if (!fileItem.processedBlob) return;
        const url = URL.createObjectURL(fileItem.processedBlob);
        const link = document.createElement('a');
        link.href = url;
        const mime = fileItem.processedBlob.type || targetFormat;
        let ext = '.bin';
        if (mime.includes('pdf')) ext = '.pdf';
        else if (mime.includes('jpeg')) ext = '.jpg';
        else if (mime.includes('png')) ext = '.png';
        else if (mime.includes('webp')) ext = '.webp';

        link.download = `optimized_${fileItem.originalFile.name.replace(/\.[^/.]+$/, "")}${ext}`;
        link.click();
    };

    // Helper to render preview image efficiently
    const PreviewImage = ({ file }: { file: ProcessedFile }) => {
        const [src, setSrc] = useState<string>('');

        useEffect(() => {
            const blob = file.status === 'done' && file.processedBlob ? file.processedBlob : file.originalFile;
            const url = URL.createObjectURL(blob);
            setSrc(url);
            return () => URL.revokeObjectURL(url);
        }, [file.status, file.processedBlob, file.originalFile]);

        if (file.originalFile.type.includes('pdf')) {
            return <FileText className="text-zinc-600" size={48} />;
        }

        return <img src={src} className="w-full h-full object-contain" />;
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <ImageIcon size={18} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Media Studio <span className="text-indigo-500 text-sm font-medium px-2 py-0.5 bg-indigo-900/30 rounded-full border border-indigo-500/30">Pro + Auto-Enhance</span></h1>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setFiles([])} className="text-sm text-zinc-400 hover:text-white transition-colors">Reset</button>
                    {files.some(f => f.status === 'done') && (
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                            <Download size={16} /> Download All
                        </button>
                    )}
                </div>
            </div>

            <div className="flex h-[calc(100vh-73px)]">

                {/* 1. LEFT SIDEBAR: Settings */}
                <div className="w-80 border-r border-zinc-800 bg-zinc-900/50 flex flex-col overflow-y-auto hide-scrollbar">
                    <div className="p-6 space-y-8">
                        <div>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white/90">
                                Resize Settings
                            </h2>

                            {/* Tabs */}
                            <div className="flex bg-zinc-800/50 p-1 rounded-lg mb-6 border border-zinc-700/50">
                                <button
                                    onClick={() => setActiveTab('by_size')}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'by_size' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                                >By Dimensions</button>
                                <button
                                    onClick={() => setActiveTab('percentage')}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'percentage' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                                >Percentage</button>
                            </div>

                            {activeTab === 'by_size' && (
                                <div className="space-y-5 ">
                                    {/* Units */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['px', 'cm', 'in'] as Unit[]).map(u => (
                                            <button
                                                key={u}
                                                onClick={() => setUnit(u)}
                                                className={`py-2 text-xs font-bold uppercase rounded-lg border transition-all ${unit === u ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                                            >
                                                {u}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Inputs */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-zinc-500">Width</label>
                                            <input
                                                type="number"
                                                value={inputWidth}
                                                placeholder="Auto"
                                                onChange={handleWidthInputChange}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-zinc-600"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-zinc-500">Height</label>
                                            <input
                                                type="number"
                                                value={inputHeight}
                                                placeholder="Auto"
                                                onChange={handleHeightInputChange}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-zinc-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Aspect Ratio */}
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${lockAspectRatio ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-600 group-hover:border-zinc-500'}`}>
                                            {lockAspectRatio && <Lock size={12} className="text-white" />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={lockAspectRatio} onChange={(e) => setLockAspectRatio(e.target.checked)} />
                                        <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">Lock Aspect Ratio</span>
                                    </label>

                                    {!lockAspectRatio && (
                                        <div className="pt-2">
                                            <label className="text-xs font-medium text-zinc-500 mb-2 block">Fit Mode</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['stretch', 'cover', 'contain'].map(m => (
                                                    <button
                                                        key={m}
                                                        onClick={() => setFitMode(m as any)}
                                                        className={`py-1.5 text-[10px] font-bold uppercase rounded border transition-all ${fitMode === m ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'percentage' && (
                                <div className="space-y-4 ">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-zinc-300">Scale</span>
                                        <span className="text-sm font-bold text-indigo-400">{percentage}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="200"
                                        value={percentage}
                                        onChange={(e) => setPercentage(Number(e.target.value))}
                                        className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-zinc-500">
                                        <span>10%</span>
                                        <span>100%</span>
                                        <span>200%</span>
                                    </div>
                                </div>
                            )}

                        </div>

                        <hr className="border-zinc-800" />

                        {/* Export Settings */}
                        <div>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white/90">
                                Export Settings
                            </h2>

                            <div className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500">Target File Size (Optional)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Max KB..."
                                            value={targetSizeKB || ''}
                                            onChange={(e) => setTargetSizeKB(parseFloat(e.target.value))}
                                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-zinc-600"
                                        />
                                        <div className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-400 font-medium">KB</div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500">Format</label>
                                    <select
                                        value={targetFormat}
                                        onChange={(e) => setTargetFormat(e.target.value as any)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        <option value="image/jpeg">JPG (Best for Photos)</option>
                                        <option value="image/png">PNG (Lossless)</option>
                                        <option value="image/webp">WebP (Modern)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={processAllFiles}
                            disabled={files.length === 0 || isGlobalProcessing}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGlobalProcessing ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                            Process Images
                        </button>

                    </div>
                </div>

                {/* 2. MAIN PREVIEW AREA (Center) */}
                <div className="flex-1 bg-zinc-950 p-8 flex flex-col overflow-hidden relative">

                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col min-h-0">
                        {/* Empty State */}
                        {files.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20 hover:bg-zinc-900/30 transition-colors group">
                                <FileUploader
                                    onFilesSelected={handleFilesSelected}
                                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                                    multiple={true}
                                    title="Drop Images Here"
                                    subtitle="Supports JPG, PNG, WebP & PDF"
                                />
                            </div>
                        ) : (
                            /* Preview Grid */
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto pr-2 custom-scrollbar">
                                {files.map(file => (
                                    <div key={file.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group relative aspect-square flex flex-col">
                                        {/* Image Preview */}
                                        <div className="flex-1 relative bg-zinc-950/50 flex items-center justify-center overflow-hidden">
                                            <PreviewImage file={file} />

                                            {/* Loading Overlay */}
                                            {file.status === 'processing' && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <RefreshCw className="text-indigo-500 animate-spin" size={24} />
                                                        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider animate-pulse">Running Auto-Enhance...</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Success Overlay */}
                                            {file.status === 'done' && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="bg-green-500 text-white p-1 rounded-full shadow-lg">
                                                        <Download size={14} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info Footer */}
                                        <div className="p-3 bg-zinc-900 border-t border-zinc-800">
                                            <p className="text-sm font-medium text-zinc-200 truncate">{file.originalFile.name}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[10px] text-zinc-500 uppercase font-bold">{formatBytes(file.originalFile.size)}</span>
                                                {file.newSize && (
                                                    <span className="text-[10px] text-green-400 font-bold bg-green-400/10 px-1.5 py-0.5 rounded">
                                                        {formatBytes(file.newSize)}
                                                    </span>
                                                )}
                                            </div>

                                            {file.status === 'done' && (
                                                <button onClick={() => downloadFile(file)} className="mt-2 w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded text-zinc-300 transition-colors">Download</button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Add More Button */}
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl aspect-square cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/30 transition-all text-zinc-500 hover:text-zinc-300">
                                    <Upload size={24} className="mb-2" />
                                    <span className="text-xs font-bold uppercase">Add More</span>
                                    <input type="file" multiple className="hidden" onChange={(e) => handleFilesSelected(Array.from(e.target.files || []))} />
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaOptimizer;
