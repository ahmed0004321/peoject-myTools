import React, { useState } from 'react';
import { FileDown, Loader2, FileText, Upload, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { toast } from 'react-hot-toast';
import mammoth from 'mammoth';
// @ts-ignore
import html2pdf from 'html2pdf.js';

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

        if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
            toast.error('Please upload a .doc or .docx file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size exceeds 10MB limit');
            return;
        }

        setFileDetails({
            file,
            name: file.name,
            size: formatFileSize(file.size)
        });
        setIsConverted(false);
        setPdfBlob(null);
    };

    const convertToPdf = async () => {
        if (!fileDetails) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await fileDetails.file.arrayBuffer();

            // Convert .docx to HTML using mammoth
            const result = await mammoth.convertToHtml({ arrayBuffer });
            const html = result.value;

            if (result.messages.length > 0) {
                console.warn('Mammoth messages:', result.messages);
            }

            // Prepare container for html2pdf
            const container = document.createElement('div');
            container.innerHTML = html;

            // Critical styles for html2canvas to work correctly
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '800px'; // Approx A4 width
            container.style.padding = '40px';
            container.style.background = 'white';
            container.style.color = 'black';
            container.style.fontFamily = 'serif';
            container.style.lineHeight = '1.6';

            // Must be in DOM for html2canvas to render it
            document.body.appendChild(container);

            try {
                // Options for html2pdf
                const opt = {
                    margin: 10,
                    filename: fileDetails.name.replace(/\.(docx|doc)$/, '.pdf'),
                    image: { type: 'jpeg' as const, quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        letterRendering: true
                    },
                    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
                };

                // Generate PDF as blob for preview/download
                const pdf = await html2pdf().from(container).set(opt).output('blob');

                setPdfBlob(pdf);
                setIsConverted(true);
                toast.success('Conversion complete!');
            } finally {
                // Cleanup
                document.body.removeChild(container);
            }
        } catch (error) {
            console.error('Error converting to PDF:', error);
            toast.error('Failed to convert document. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadPdf = () => {
        if (!pdfBlob || !fileDetails) return;

        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileDetails.name.replace(/\.(docx|doc)$/, '.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const clearFile = () => {
        setFileDetails(null);
        setIsConverted(false);
        setPdfBlob(null);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <SectionHeader
                title="Word to PDF"
                subtitle="Convert Word documents to high-quality PDF files instantly."
            />

            <div className="max-w-3xl mx-auto px-4">
                {!fileDetails ? (
                    <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl text-center space-y-8">
                        <div className="space-y-6">
                            <div className="w-24 h-24 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText size={48} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Upload Document</h3>
                                <p className="text-secondary">Select a .doc or .docx file to convert.</p>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <label className="inline-flex items-center gap-3 px-8 py-4 bg-blue-500 text-white rounded-xl font-bold text-lg cursor-pointer hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20">
                                    <Upload size={24} />
                                    Choose File
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".doc,.docx"
                                        onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                                    />
                                </label>
                                <p className="text-xs text-secondary flex items-center gap-1.5">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    Your file never leaves your device.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl space-y-8">
                        <div className="flex items-center justify-between p-4 bg-background/50 rounded-2xl border border-border">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary truncate max-w-[200px] md:max-w-md">
                                        {fileDetails.name}
                                    </h4>
                                    <p className="text-sm text-secondary">{fileDetails.size}</p>
                                </div>
                            </div>
                            <button
                                onClick={clearFile}
                                className="p-2 text-secondary hover:text-red-500 transition-colors"
                                title="Remove file"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {!isConverted ? (
                                <button
                                    onClick={convertToPdf}
                                    disabled={isProcessing}
                                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="animate-spin" size={24} />
                                            Converting...
                                        </>
                                    ) : (
                                        <>
                                            <FileDown size={24} />
                                            Convert to PDF
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={downloadPdf}
                                        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-blue-500 text-white rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        <FileDown size={24} />
                                        Download PDF
                                    </button>
                                    <button
                                        onClick={clearFile}
                                        className="text-secondary hover:text-primary font-medium text-sm transition-colors mx-auto"
                                    >
                                        Convert another file
                                    </button>
                                </div>
                            )}

                            {isProcessing && (
                                <div className="flex items-center gap-2 p-3 bg-blue-500/5 text-blue-500 rounded-lg text-sm">
                                    <AlertCircle size={16} />
                                    <span>Large documents may take a few moments to process.</span>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-xs text-secondary flex items-center justify-center gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            Processing is done entirely in your browser.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WordToPdf;
