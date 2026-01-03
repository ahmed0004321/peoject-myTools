import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Loader2, Download, Settings, Image as ImageIcon, Trash2, CheckCircle, RefreshCcw, Layers } from 'lucide-react';
import JSZip from 'jszip';

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

interface ImageJob {
    id: string;
    file: File;
    preview: string;
    originalSize: number;
    width: number;
    height: number;
    status: 'pending' | 'processing' | 'done';
    processedBlob?: Blob;
}

const ImageToolkit: React.FC = () => {
    const [jobs, setJobs] = useState<ImageJob[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Settings
    const [format, setFormat] = useState<OutputFormat>('image/jpeg');
    const [quality, setQuality] = useState(0.8);
    const [scale, setScale] = useState(100);
    const [targetWidth, setTargetWidth] = useState<number | null>(null);
    const [stripMetadata, setStripMetadata] = useState(true);

    const handleFiles = (files: File[]) => {
        const newJobs = files.map(f => {
            const url = URL.createObjectURL(f);
            const img = new Image();
            img.src = url;
            // We need to wait for load to get dims, but for state sync we add immediately
            // and update dims async? Or just wait? 
            // Let's add immediately and update dims in effect or listener.
            const job: ImageJob = {
                id: Math.random().toString(36).substring(7),
                file: f,
                preview: url,
                originalSize: f.size,
                width: 0,
                height: 0,
                status: 'pending'
            };
            img.onload = () => {
                setJobs(prev => prev.map(j => j.id === job.id ? { ...j, width: img.width, height: img.height } : j));
            };
            return job;
        });
        setJobs(prev => [...prev, ...newJobs]);
    };

    const removeJob = (id: string) => {
        setJobs(prev => prev.filter(j => j.id !== id));
    };

    const clearAll = () => {
        setJobs([]);
        setTargetWidth(null);
        setScale(100);
    };

    const processJob = (job: ImageJob): Promise<ImageJob> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = job.preview;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width;
                let h = img.height;

                // Logic: If scale != 100, use scale. Else if targetWidth changed, use target width.
                if (scale !== 100) {
                    w = Math.floor(w * (scale / 100));
                    h = Math.floor(h * (scale / 100));
                } else if (targetWidth && targetWidth !== img.width) {
                    const ratio = h / w;
                    w = targetWidth;
                    h = Math.floor(w * ratio);
                }

                canvas.width = w;
                canvas.height = h;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, w, h);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve({ ...job, status: 'done', processedBlob: blob });
                        } else {
                            resolve({ ...job, status: 'done' }); // Fail silently?
                        }
                    }, format, quality);
                }
            };
        });
    };

    const processAll = async () => {
        if (jobs.length === 0) return;
        setIsProcessing(true);

        const processedJobs = [];
        for (const job of jobs) {
            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j));
            const res = await processJob(job);
            processedJobs.push(res);
            setJobs(prev => prev.map(j => j.id === job.id ? res : j));
        }

        // Download
        if (processedJobs.length === 1 && processedJobs[0].processedBlob) {
            const j = processedJobs[0];
            const url = URL.createObjectURL(j.processedBlob!);
            const link = document.createElement('a');
            link.href = url;
            const ext = format.split('/')[1];
            link.download = j.file.name.split('.')[0] + `-processed.${ext}`;
            link.click();
        } else {
            // Zip
            const zip = new JSZip();
            const ext = format.split('/')[1];
            processedJobs.forEach(j => {
                if (j.processedBlob) {
                    zip.file(`${j.file.name.split('.')[0]}-processed.${ext}`, j.processedBlob);
                }
            });
            const content = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'processed_images.zip';
            link.click();
        }

        setIsProcessing(false);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] inline-flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
                        <ImageIcon size={32} />
                    </div>
                    Image Studio Details
                </h1>
                <p className="text-[var(--text-secondary)] mt-4 text-lg">Batch converter, compressor, and resizer. 100% Offline.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">

                {/* Settings Sidebar */}
                <Card className="h-fit">
                    <h3 className="font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
                        <Settings size={20} className="text-indigo-600 dark:text-indigo-400" /> Batch Settings
                    </h3>

                    <div className="space-y-6">
                        {/* Format */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Output Format</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['image/jpeg', 'image/png', 'image/webp'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFormat(f as OutputFormat)}
                                        className={`py-2 text-sm font-medium rounded-lg border transition-all ${format === f ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-inset border-[var(--border-color)] text-[var(--text-secondary)] hover:border-indigo-300'}`}
                                    >
                                        {f.split('/')[1].toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quality */}
                        {format !== 'image/png' && (
                            <div className="space-y-2">
                                <label className="flex justify-between text-xs font-bold uppercase text-slate-400 dark:text-slate-500">
                                    <span>Quality</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">{Math.round(quality * 100)}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.1" max="1.0" step="0.05"
                                    value={quality}
                                    onChange={(e) => setQuality(Number(e.target.value))}
                                    className="w-full h-2 bg-inset rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        )}

                        {/* Resize */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Resize</label>
                                <div className="flex text-xs bg-inset rounded-md p-1 border border-[var(--border-color)]">
                                    <button onClick={() => setScale(100)} className={`px-2 py-1 rounded transition-all ${scale === 100 ? 'bg-[var(--bg-secondary)] shadow-sm text-[var(--text-primary)] border border-[var(--border-color)]' : 'text-slate-500 hover:text-slate-200'}`}>Original</button>
                                    <button onClick={() => setScale(50)} className={`px-2 py-1 rounded transition-all ${scale === 50 ? 'bg-[var(--bg-secondary)] shadow-sm text-[var(--text-primary)] border border-[var(--border-color)]' : 'text-slate-500 hover:text-slate-200'}`}>50%</button>
                                    <button onClick={() => setScale(25)} className={`px-2 py-1 rounded transition-all ${scale === 25 ? 'bg-[var(--bg-secondary)] shadow-sm text-[var(--text-primary)] border border-[var(--border-color)]' : 'text-slate-500 hover:text-slate-200'}`}>25%</button>
                                </div>
                            </div>

                            {scale === 100 && (
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={targetWidth || ''}
                                        onChange={(e) => setTargetWidth(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-inset border border-[var(--border-color)] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-[var(--text-primary)]"
                                        placeholder="Custom Width (px)"
                                    />
                                    <span className="absolute right-3 top-2 text-xs text-slate-400">px</span>
                                </div>
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center justify-between p-3 bg-inset rounded-lg border border-[var(--border-color)] cursor-pointer" onClick={() => setStripMetadata(!stripMetadata)}>
                            <span className="text-sm font-medium text-[var(--text-secondary)]">Strip Metadata (EXIF)</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${stripMetadata ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'}`}>
                                {stripMetadata && <CheckCircle size={14} />}
                            </div>
                        </div>

                        <Button
                            onClick={processAll}
                            disabled={jobs.length === 0 || isProcessing}
                            className="w-full h-12 text-lg shadow-indigo-200 shadow-lg"
                        >
                            {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2" />}
                            {isProcessing ? 'Processing All...' : `Process ${jobs.length} Images`}
                        </Button>
                    </div>
                </Card>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {jobs.length === 0 ? (
                        <div className="bg-inset border-2 border-dashed border-[var(--border-color)] rounded-2xl p-12 text-center h-[500px] flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6">
                                <Layers size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Drop Images Here</h3>
                            <p className="text-[var(--text-secondary)] mb-8 max-w-sm">Supports JPG, PNG, WEBP. Drag multiple files to batch process them instantly.</p>
                            <FileUploader onFilesSelected={handleFiles} accept="image/*" title="Select Images" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] shadow-sm">
                                <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <Layers className="text-indigo-600 dark:text-indigo-400" /> Queue ({jobs.length})
                                </h3>
                                <div className="flex gap-2">
                                    <FileUploader onFilesSelected={handleFiles} accept="image/*" title="Add More" />
                                    <Button variant="danger" size="sm" onClick={clearAll}><Trash2 size={16} className="mr-2" /> Clear All</Button>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {jobs.map(job => (
                                    <div key={job.id} className="relative group bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex gap-3">
                                            <div className="w-20 h-20 bg-inset rounded-lg overflow-hidden flex-shrink-0 relative">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={job.preview} alt="preview" className="w-full h-full object-cover" />
                                                {job.status === 'done' && (
                                                    <div className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center">
                                                        <CheckCircle className="text-white" size={24} />
                                                    </div>
                                                )}
                                                {job.status === 'processing' && (
                                                    <div className="absolute inset-0 bg-indigo-500/80 flex items-center justify-center">
                                                        <Loader2 className="animate-spin text-white" size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <h4 className="font-medium text-[var(--text-primary)] text-sm truncate" title={job.file.name}>{job.file.name}</h4>
                                                <p className="text-xs text-[var(--text-secondary)] mt-1">{job.width} x {job.height}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-600">{(job.originalSize / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button
                                                onClick={() => removeJob(job.id)}
                                                className="self-start text-slate-300 dark:text-slate-600 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ImageToolkit;