import React, { useState } from 'react';
import { Archive, FileArchive, FolderInput, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import SectionHeader from '../components/ui/SectionHeader';
import { toast } from 'react-hot-toast';

const CompressTool: React.FC = () => {
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [filesToZip, setFilesToZip] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<'compress' | 'extract'>('compress');

    const handleCompress = async () => {
        if (filesToZip.length === 0) return;
        setIsProcessing(true);

        try {
            const zip = new JSZip();
            filesToZip.forEach(file => {
                zip.file(file.name, file);
            });

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = "compressed-files.zip";
            link.click();

            setFilesToZip([]);
        } catch (err) {
            alert("Compression failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExtract = async (file: File) => {
        setIsProcessing(true);
        try {
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(file);

            const extractedFiles: { name: string, blob: Blob }[] = [];

            let count = 0;
            loadedZip.forEach(async (relativePath, zipEntry) => {
                if (!zipEntry.dir && count < 10) {
                    const blob = await zipEntry.async('blob');
                    extractedFiles.push({ name: zipEntry.name, blob });
                    count++;
                }
            });

            setTimeout(() => {
                extractedFiles.forEach(f => {
                    const url = URL.createObjectURL(f.blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = f.name;
                    link.click();
                });
                toast.success(`Extracted ${extractedFiles.length} files successfully!`);
                setZipFile(null);
                setIsProcessing(false);
            }, 1000);

        } catch (err) {
            alert("Extraction failed. Ensure it is a valid ZIP.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 ">
            <SectionHeader
                title="Archive Manager"
                subtitle="Compress files to ZIP or extract existing archives."
            />

            <div className="max-w-4xl mx-auto px-6">
                <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl text-center space-y-8 ">

                    {/* Header Icon */}
                    <div className="w-24 h-24 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mx-auto mb-6">
                        <Archive size={48} />
                    </div>

                    {/* Mode Toggle - Centered */}
                    <div className="flex justify-center mb-8">
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl border border-border shadow-inner">
                            <button
                                onClick={() => setMode('compress')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'compress' ? 'bg-white dark:bg-zinc-700 text-brand-orange shadow-sm' : 'text-secondary hover:text-primary'}`}
                            >
                                Compress Files
                            </button>
                            <button
                                onClick={() => setMode('extract')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'extract' ? 'bg-white dark:bg-zinc-700 text-brand-orange shadow-sm' : 'text-secondary hover:text-primary'}`}
                            >
                                Extract ZIP
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="max-w-xl mx-auto space-y-8">
                        {mode === 'compress' ? (
                            <>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold">Create New Archive</h3>
                                    <p className="text-secondary">Combine multiple files into a single optimized ZIP.</p>
                                </div>

                                {filesToZip.length === 0 ? (
                                    <label className="inline-flex items-center gap-3 px-8 py-4 bg-orange-500 text-white rounded-xl font-bold text-lg cursor-pointer hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20">
                                        <FolderInput size={24} />
                                        Select Files
                                        <input type="file" multiple className="hidden" onChange={(e) => setFilesToZip(Array.from(e.target.files || []))} />
                                    </label>
                                ) : (
                                    <div className="space-y-6 ">
                                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-border text-left shadow-inner">
                                            <h3 className="font-bold text-primary mb-3 border-b border-border pb-3 flex items-center gap-2">
                                                <FolderInput size={20} className="text-brand-orange" /> Selected Files ({filesToZip.length})
                                            </h3>
                                            <ul className="text-sm text-secondary space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                                {filesToZip.map((f, i) => (
                                                    <li key={i} className="flex items-center gap-2 truncate">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-orange"></div> {f.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                                            <button
                                                onClick={() => setFilesToZip([])}
                                                className="px-6 py-3 text-secondary font-bold hover:text-primary transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleCompress}
                                                disabled={isProcessing}
                                                className="flex items-center justify-center gap-2 px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Archive size={20} />}
                                                Download ZIP
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold">Extract Archive</h3>
                                    <p className="text-secondary">Unzip files instantly in your browser.</p>
                                </div>

                                {!zipFile ? (
                                    <label className="inline-flex items-center gap-3 px-8 py-4 bg-orange-500 text-white rounded-xl font-bold text-lg cursor-pointer hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20">
                                        <FileArchive size={24} />
                                        Select ZIP
                                        <input type="file" accept=".zip,.rar" className="hidden" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleExtract(file);
                                        }} />
                                    </label>
                                ) : (
                                    <div className="flex flex-col items-center gap-6 ">
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="animate-spin text-brand-orange" size={48} />
                                                <p className="text-secondary font-medium">Extracting files...</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                                                    <FileArchive size={40} />
                                                </div>
                                                <p className="font-bold text-primary text-xl">Extraction Complete!</p>
                                                <button
                                                    onClick={() => setZipFile(null)}
                                                    className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-primary font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                                >
                                                    Extract Another
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompressTool;
