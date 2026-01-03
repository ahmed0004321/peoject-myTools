import React, { useState } from 'react';
import { Archive, Download, FileArchive, FolderInput, Loader2, ArrowLeft } from 'lucide-react';
import JSZip from 'jszip';
import FileUploader from '../components/FileUploader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

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
                alert(`Extracted ${extractedFiles.length} files.`);
                setZipFile(null);
                setIsProcessing(false);
            }, 1000);

        } catch (err) {
            alert("Extraction failed. Ensure it is a valid ZIP.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-6 transition-colors">
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </Link>

            <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Archive Manager</h1>
                    <p className="text-[var(--text-secondary)] mt-2">Compress files to ZIP or extract existing archives.</p>
                </div>
                <div className="flex bg-inset p-1.5 rounded-xl border border-[var(--border-color)] shadow-sm">
                    <button
                        onClick={() => setMode('compress')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'compress' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Compress
                    </button>
                    <button
                        onClick={() => setMode('extract')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'extract' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Decompress
                    </button>
                </div>
            </div>

            <Card className="min-h-[400px] flex flex-col justify-center items-center">
                {mode === 'compress' ? (
                    <div className="w-full max-w-xl text-center">
                        {filesToZip.length === 0 ? (
                            <FileUploader
                                onFilesSelected={(files) => setFilesToZip(files)}
                                accept="*"
                                title="Upload files to zip"
                                multiple={true}
                            />
                        ) : (
                            <div className="space-y-6 w-full">
                                <div className="bg-inset p-6 rounded-2xl border border-[var(--border-color)] text-left w-full shadow-inner">
                                    <h3 className="font-bold text-[var(--text-primary)] mb-3 border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
                                        <FolderInput size={20} className="text-indigo-500" /> Selected Files ({filesToZip.length})
                                    </h3>
                                    <ul className="text-sm text-[var(--text-secondary)] space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                        {filesToZip.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2 truncate">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> {f.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex justify-center gap-4">
                                    <Button variant="ghost" onClick={() => setFilesToZip([])}>Cancel</Button>
                                    <Button
                                        onClick={handleCompress}
                                        isLoading={isProcessing}
                                    >
                                        <Archive size={18} /> Download ZIP
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full max-w-xl text-center">
                        {!zipFile ? (
                            <FileUploader
                                onFilesSelected={(files) => handleExtract(files[0])}
                                accept=".zip, .rar"
                                title="Upload ZIP to extract"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin text-indigo-500" size={48} />
                                        <p className="text-[var(--text-secondary)] font-medium">Extracting files...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                                            <FileArchive size={40} />
                                        </div>
                                        <p className="font-bold text-[var(--text-primary)]">Extraction Started!</p>
                                        <Button variant="outline" onClick={() => setZipFile(null)}>Extract Another</Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default CompressTool;
