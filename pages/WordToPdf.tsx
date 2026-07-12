import React, { useState } from 'react';
import { FileDown, Loader2, FileText, Upload, Trash2, ShieldCheck, AlertCircle, Eye, CheckCircle2, RefreshCcw } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { toast } from 'react-hot-toast';
import mammoth from 'mammoth';
import { motion, AnimatePresence } from 'framer-motion';

interface FileDetails {
    file: File;
    name: string;
    size: string;
}

const WordToPdf: React.FC = () => {
    const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConverted, setIsConverted] = useState(false);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [conversionStep, setConversionStep] = useState<string>('');

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFiles = (files: File[]) => {
        const file = files[0];
        if (!file) return;

        if (!file.name.endsWith('.docx')) {
            toast.error('Please upload a .docx file');
            return;
        }

        setFileDetails({
            file,
            name: file.name,
            size: formatFileSize(file.size)
        });
        setIsConverted(false);
        setPdfBlob(null);
        setConversionStep('');
    };

    const convertToPdf = async () => {
        if (!fileDetails) return;
        setIsProcessing(true);
        setIsConverted(false);

        try {
            setConversionStep('Reading document...');
            const arrayBuffer = await fileDetails.file.arrayBuffer();

            setConversionStep('Converting to high-fidelity HTML...');
            // Convert .docx to HTML using mammoth with standard options
            const result = await mammoth.convertToHtml({ arrayBuffer });
            const html = result.value;

            if (!html || html.trim() === '') {
                throw new Error("The document appears to be empty.");
            }

            setConversionStep('Preparing PDF layout...');
            
            // Create a dedicated rendering container
            const container = document.createElement('div');
            container.id = 'pdf-render-container';
            
            // Professional Document Styling (A4 Format)
            // We use specific CSS to make it look like a printed page
            const style = document.createElement('style');
            style.innerHTML = `
                #pdf-render-container {
                    width: 210mm;
                    padding: 20mm;
                    background: white;
                    color: black;
                    font-family: 'Times New Roman', Times, serif;
                    line-height: 1.5;
                    font-size: 12pt;
                    box-sizing: border-box;
                    word-wrap: break-word;
                }
                #pdf-render-container p { margin-bottom: 12pt; }
                #pdf-render-container h1 { font-size: 24pt; font-weight: bold; margin-bottom: 18pt; text-align: center; }
                #pdf-render-container h2 { font-size: 18pt; font-weight: bold; margin-top: 14pt; margin-bottom: 10pt; }
                #pdf-render-container table { border-collapse: collapse; width: 100%; margin-bottom: 15pt; }
                #pdf-render-container td, #pdf-render-container th { border: 1px solid #000; padding: 8pt; vertical-align: top; }
                #pdf-render-container img { max-width: 100%; height: auto; display: block; margin: 10pt auto; }
            `;
            
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = html;
            
            container.appendChild(style);
            container.appendChild(contentDiv);

            // Positioning for rendering without user seeing it
            Object.assign(container.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                zIndex: '-1000',
                opacity: '0.01', // Keep slightly opaque so browser paints it correctly
                pointerEvents: 'none'
            });

            document.body.appendChild(container);

            setConversionStep('Rendering PDF engine...');
            
            // Dynamically import html2pdf
            // @ts-ignore
            const html2pdf = (await import('html2pdf.js')).default;

            const opt = {
                margin: 0, // Margins handled by container padding
                filename: fileDetails.name.replace(/\.docx$/, '.pdf'),
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    letterRendering: true,
                    backgroundColor: '#ffffff'
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Use the worker API for more control and reliability
            setConversionStep('Generating pages...');
            const pdf = await html2pdf().from(container).set(opt).output('blob');

            document.body.removeChild(container);
            
            setPdfBlob(pdf);
            setIsConverted(true);
            setConversionStep('Completed!');
            toast.success('Converted successfully!');
        } catch (error: any) {
            console.error('Conversion error:', error);
            toast.error(error.message || 'Failed to convert document.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadPdf = () => {
        if (!pdfBlob || !fileDetails) return;
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileDetails.name.replace(/\.docx$/, '.pdf');
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const clearFile = () => {
        setFileDetails(null);
        setIsConverted(false);
        setPdfBlob(null);
        setConversionStep('');
    };

    return (
        <div className="min-h-screen bg-transparent pb-20">
            <SectionHeader
                title="Word to PDF"
                subtitle="High-fidelity browser-side conversion. Your files never leave your device."
            />

            <div className="max-w-4xl mx-auto px-4 mt-12">
                <AnimatePresence mode="wait">
                    {!fileDetails ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white p-12 shadow-[12px_12px_0px_#000] dark:shadow-[12px_12px_0px_#fff] text-center"
                        >
                            <div className="w-24 h-24 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-black dark:border-white">
                                <FileText size={48} />
                            </div>

                            <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter">Upload .docx</h3>
                            <p className="text-zinc-500 mb-10 font-medium">Select any Microsoft Word document to begin.</p>

                            <label className="inline-flex items-center gap-4 px-10 py-5 bg-brand-yellow text-black border-4 border-black font-black text-xl cursor-pointer hover:bg-yellow-400 transition-all hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none">
                                <Upload size={28} />
                                Choose File
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".docx"
                                    onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                                />
                            </label>
                            
                            <div className="mt-12 flex items-center justify-center gap-2 text-sm font-bold text-zinc-400">
                                <ShieldCheck size={16} className="text-emerald-500" />
                                100% Secure. Local Processing Only.
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            {/* File Card */}
                            <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white p-6 flex items-center justify-between shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-blue-500 text-white flex items-center justify-center border-4 border-black">
                                        <FileText size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black uppercase tracking-tight truncate max-w-[200px] md:max-w-md">
                                            {fileDetails.name}
                                        </h4>
                                        <p className="text-sm font-bold text-zinc-400">{fileDetails.size}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={clearFile}
                                    className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors border-2 border-transparent hover:border-red-500"
                                >
                                    <Trash2 size={24} />
                                </button>
                            </div>

                            {/* Action Area */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white p-8">
                                    <h5 className="text-lg font-black mb-6 uppercase border-b-4 border-black dark:border-white pb-2 inline-block">Status</h5>
                                    
                                    <div className="space-y-6">
                                        {isProcessing ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 text-blue-500">
                                                    <Loader2 className="animate-spin" size={32} />
                                                    <span className="text-2xl font-black uppercase italic tracking-tighter">{conversionStep}</span>
                                                </div>
                                                <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white overflow-hidden">
                                                    <motion.div 
                                                        className="h-full bg-blue-500" 
                                                        animate={{ width: ['0%', '100%'] }}
                                                        transition={{ duration: 3, repeat: Infinity }}
                                                    />
                                                </div>
                                            </div>
                                        ) : isConverted ? (
                                            <div className="flex items-center gap-4 text-emerald-500">
                                                <CheckCircle2 size={40} />
                                                <span className="text-2xl font-black uppercase">Ready for Download</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4 text-zinc-400">
                                                <AlertCircle size={32} />
                                                <span className="text-xl font-bold">Waiting to start...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {!isConverted ? (
                                        <button
                                            onClick={convertToPdf}
                                            disabled={isProcessing}
                                            className="h-full flex flex-col items-center justify-center gap-4 bg-emerald-500 text-white border-4 border-black p-8 font-black text-2xl uppercase hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_#000] transition-all disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/40">
                                                <RefreshCcw size={32} />
                                            </div>
                                            Convert Now
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-4 h-full">
                                            <button
                                                onClick={downloadPdf}
                                                className="flex-1 flex flex-col items-center justify-center gap-4 bg-blue-500 text-white border-4 border-black p-8 font-black text-2xl uppercase hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_#000] transition-all"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/40">
                                                    <FileDown size={32} />
                                                </div>
                                                Download PDF
                                            </button>
                                            <button 
                                                onClick={clearFile}
                                                className="py-4 font-black uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_#000]"
                                            >
                                                Convert Another
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WordToPdf;
