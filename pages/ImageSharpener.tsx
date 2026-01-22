import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Sliders, Image as ImageIcon, Zap, AlertCircle } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

const ImageSharpener: React.FC = () => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [amount, setAmount] = useState(50); // 0-100
    const [radius, setRadius] = useState(1.0); // 0.1-5.0
    const [threshold, setThreshold] = useState(0); // 0-255
    const [isProcessing, setIsProcessing] = useState(false);
    const [sliderPosition, setSliderPosition] = useState(50); // 0-100%

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load Image
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setOriginalUrl(url);
            const img = new Image();
            img.onload = () => {
                setImage(img);
                processImage(img, 50, 1.0, 0); // Initial process
            };
            img.src = url;
        }
    };

    /**
     * Advanced Luminance-based Unsharp Mask
     * Calculates sharpening delta based on Y (Luma) channel to prevent color shifting.
     */
    const processImage = useCallback(async (
        img: HTMLImageElement,
        amt: number,
        rad: number,
        thresh: number
    ) => {
        if (!canvasRef.current || !img) return;
        setIsProcessing(true);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw Original
        ctx.drawImage(img, 0, 0);
        const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Create Blurred Version
        const offCanvas = document.createElement('canvas');
        offCanvas.width = img.width;
        offCanvas.height = img.height;
        const offCtx = offCanvas.getContext('2d');
        if (!offCtx) return;

        offCtx.filter = `blur(${rad}px)`;
        offCtx.drawImage(img, 0, 0);
        const blurredData = offCtx.getImageData(0, 0, canvas.width, canvas.height);

        const target = ctx.createImageData(canvas.width, canvas.height);
        const dst = target.data;
        const src = originalData.data;
        const blur = blurredData.data;
        const strength = amt / 30;

        // Luminance-based sharpening loop
        // Formula: Delta = (Original_Luma - Blurred_Luma) * Strength
        // New_RGB = Original_RGB + Delta
        // This preserves chrominance better than applying USM to each channel independently.
        for (let i = 0; i < src.length; i += 4) {
            const r = src[i];
            const g = src[i + 1];
            const b = src[i + 2];

            const r_b = blur[i];
            const g_b = blur[i + 1];
            const b_b = blur[i + 2];

            // 1. Calculate Luma (Rec. 601)
            const y_src = 0.299 * r + 0.587 * g + 0.114 * b;
            const y_blur = 0.299 * r_b + 0.587 * g_b + 0.114 * b_b;

            // 2. Calculate detail delta
            const valDiff = y_src - y_blur;

            // 3. Apply threshold
            if (Math.abs(valDiff) > thresh) {
                const delta = valDiff * strength;
                dst[i] = Math.min(255, Math.max(0, r + delta));
                dst[i + 1] = Math.min(255, Math.max(0, g + delta));
                dst[i + 2] = Math.min(255, Math.max(0, b + delta));
            } else {
                dst[i] = r;
                dst[i + 1] = g;
                dst[i + 2] = b;
            }
            dst[i + 3] = src[i + 3]; // Alpha
        }

        ctx.putImageData(target, 0, 0);
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.95));
        setIsProcessing(false);
    }, []);

    // Debounce slider updates
    useEffect(() => {
        if (image) {
            const timer = setTimeout(() => {
                processImage(image, amount, radius, threshold);
            }, 100); // 100ms debounce
            return () => clearTimeout(timer);
        }
    }, [amount, radius, threshold, image, processImage]);

    const handleDownload = () => {
        if (previewUrl) {
            const link = document.createElement('a');
            link.download = 'sharpened-image.jpg';
            link.href = previewUrl;
            link.click();
        }
    };

    // Drag & Drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileChange(event);
        }
    };

    // Slider Drag for Split View
    const handleSliderDrag = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setSliderPosition((x / rect.width) * 100);
    };

    return (
        <div className="min-h-screen bg-background pb-20 animate-fade-in">
            <SectionHeader
                title="AI-Grade Image Sharpener"
                subtitle="Professional Unsharp Masking engine right in your browser."
            />

            <div className={`max-w-6xl mx-auto px-4 ${!image ? 'max-w-3xl' : ''}`}>

                {/* Initial State: Standard Centered Card */}
                {!image ? (
                    <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl text-center space-y-8 animate-slide-up">
                        <div className="space-y-6">
                            <div className="w-24 h-24 bg-brand-pink/10 text-brand-pink rounded-full flex items-center justify-center mx-auto mb-6">
                                <Zap size={48} fill="currentColor" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Upload Image to Sharpen</h3>
                                <p className="text-secondary">Enhance details using advanced local unsharp masking.</p>
                            </div>

                            <label className="inline-flex items-center gap-3 px-8 py-4 bg-pink-500 text-white rounded-xl font-bold text-lg cursor-pointer hover:bg-pink-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/20">
                                <Upload size={24} />
                                Select Image
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>

                            <p className="text-xs text-secondary/60 pt-4">
                                *Privacy: Processing is 100% client-side. No uploads.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Workspace State */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                        {/* Controls Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Sliders className="text-brand-pink" size={20} /> Parameters
                                </h3>

                                {/* Amount */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-sm font-medium">
                                        <label className="text-secondary">Sharpen Amount</label>
                                        <span className="text-brand-pink">{amount}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="200"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="w-full accent-brand-pink h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Radius */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-sm font-medium">
                                        <label className="text-secondary">Radius (px)</label>
                                        <span className="text-brand-cyan">{radius.toFixed(1)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="10"
                                        step="0.1"
                                        value={radius}
                                        onChange={(e) => setRadius(Number(e.target.value))}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                                    />
                                </div>

                                {/* Threshold */}
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm font-medium">
                                        <label className="text-secondary">Threshold (Noise Filter)</label>
                                        <span className="text-brand-purple">{threshold}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={threshold}
                                        onChange={(e) => setThreshold(Number(e.target.value))}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-purple"
                                    />
                                    <p className="text-xs text-secondary/60 mt-2">
                                        *Filters out minor noise to prevent grain.
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl flex flex-col gap-4">
                                <label className="flex items-center justify-center gap-3 w-full p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl cursor-pointer transition-all font-bold group">
                                    <Upload size={20} className="group-hover:scale-110 transition-transform" />
                                    Upload New Image
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>

                                <button
                                    onClick={handleDownload}
                                    disabled={!previewUrl}
                                    className="flex items-center justify-center gap-3 w-full p-4 bg-zinc-900 dark:bg-brand-pink hover:bg-zinc-700 dark:hover:bg-pink-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-zinc-500/20 dark:shadow-pink-500/20 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <Download size={20} />
                                    Download Result
                                </button>
                            </div>

                            {!image && (
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-sm text-blue-200">
                                    <AlertCircle className="shrink-0" size={18} />
                                    <p>Upload an image to start sharpening. All processing happens on your device.</p>
                                </div>
                            )}
                        </div>

                        {/* Main Preview Area */}
                        <div className="lg:col-span-2 space-y-4">
                            <div
                                className="bg-black/50 border border-border rounded-3xl overflow-hidden shadow-2xl relative aspect-video flex items-center justify-center group select-none"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                ref={containerRef}
                                onMouseMove={(e) => image && e.buttons === 1 && handleSliderDrag(e)}
                                onTouchMove={handleSliderDrag}
                            >
                                {!image ? (
                                    <div className="text-center space-y-4 p-10">
                                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                            <ImageIcon className="text-zinc-500" size={40} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white">Drop Image Here</h3>
                                        <p className="text-zinc-400">Supports JPG, PNG, WEBP</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Comparison Split View */}
                                        <div className="absolute inset-0 w-full h-full">
                                            {/* After Image (Background) */}
                                            <img
                                                src={previewUrl || ""}
                                                className="absolute inset-0 w-full h-full object-contain bg-black/80"
                                                alt="Sharpened"
                                            />

                                            {/* Before Image (Foreground, clipped) */}
                                            <div
                                                className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-white shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                                                style={{ width: `${sliderPosition}%` }}
                                            >
                                                <img
                                                    src={originalUrl || ""}
                                                    className="absolute inset-0 w-full h-full object-contain bg-black/80 max-w-none"
                                                    // max-w-none is CRITICAL for proper alignment
                                                    style={{ width: containerRef.current?.clientWidth, height: containerRef.current?.clientHeight }}
                                                    alt="Original"
                                                />

                                                {/* Label */}
                                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                                                    ORIGINAL
                                                </div>
                                            </div>

                                            {/* Slider Handle */}
                                            <div
                                                className="absolute top-0 bottom-0 w-1 bg-transparent cursor-ew-resize hover:bg-brand-pink/50 transition-colors z-20 flex items-center justify-center"
                                                style={{ left: `${sliderPosition}%` }}
                                                onMouseDown={(e) => { e.preventDefault(); /* Start drag logic handled by parent */ }}
                                            >
                                                <div className="w-8 h-8 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center -ml-0.5">
                                                    <Sliders size={14} className="text-black rotate-90" />
                                                </div>
                                            </div>

                                            {/* After Label */}
                                            <div className="absolute bottom-4 right-4 bg-brand-pink/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                                                SHARPENED
                                            </div>
                                        </div>
                                    </>
                                )}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            <div className="flex justify-between items-center text-xs text-secondary px-2">
                                <span>Drag slider to compare</span>
                                {isProcessing && (
                                    <span className="flex items-center gap-1.5 text-brand-cyan animate-pulse">
                                        <Zap size={12} fill="currentColor" /> Processing...
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageSharpener;
