import React, { useState } from 'react';
import { Upload, FileDown, Loader2, Table, X, CheckCircle2, AlertCircle } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { toast } from 'react-hot-toast';

// @ts-ignore - pdfjs-dist is in package.json and will be available
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - Vite asset import
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set worker source (necessary for pdfjs-dist)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface TableData {
    headers: string[];
    rows: string[][];
}

const PdfToCsv: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [csvContent, setCsvContent] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<TableData | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Please upload a valid PDF file.');
            return;
        }

        setFileName(file.name);
        setIsProcessing(true);
        setCsvContent(null);
        setPreviewData(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let allTextItems: any[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const items = textContent.items.map((item: any) => ({
                    text: item.str,
                    x: item.transform[4],
                    y: item.transform[5],
                    width: item.width,
                    height: item.height
                }));
                allTextItems = [...allTextItems, ...items];
            }

            if (allTextItems.length === 0) {
                throw new Error('No text found in PDF.');
            }

            // Group by Y coordinate (rows)
            const Y_TOLERANCE = 5;
            const rows: any[][] = [];

            allTextItems.sort((a, b) => b.y - a.y || a.x - b.x);

            let currentRow: any[] = [];
            let lastY = allTextItems[0].y;

            allTextItems.forEach(item => {
                if (Math.abs(item.y - lastY) > Y_TOLERANCE) {
                    if (currentRow.length > 0) {
                        rows.push(currentRow.sort((a, b) => a.x - b.x));
                    }
                    currentRow = [item];
                    lastY = item.y;
                } else {
                    currentRow.push(item);
                }
            });
            if (currentRow.length > 0) {
                rows.push(currentRow.sort((a, b) => a.x - b.x));
            }

            // Logic to merge multi-line cells and identify columns
            const csvRows = rows.map(row => {
                return row.map(item => {
                    let text = item.text.trim();
                    if (text.includes(',') || text.includes('"')) {
                        text = `"${text.replace(/"/g, '""')}"`;
                    }
                    return text;
                }).join(',');
            });

            const finalCsv = csvRows.join('\n');
            setCsvContent(finalCsv);

            // Create preview (max 10 rows)
            const previewRows = rows.slice(0, 10).map(row => row.map(i => i.text));
            if (previewRows.length > 0) {
                setPreviewData({
                    headers: previewRows[0],
                    rows: previewRows.slice(1)
                });
            }

            toast.success('PDF processed successfully!');
        } catch (error: any) {
            console.error('Error processing PDF:', error);
            toast.error(error.message || 'Failed to process PDF.');
            setFileName(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadCsv = () => {
        if (!csvContent) return;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName ? fileName.replace('.pdf', '.csv') : 'converted.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <SectionHeader
                title="PDF to CSV"
                subtitle="Extract tables and structured data from PDF files into CSV format."
            />

            <div className="max-w-4xl mx-auto px-4">
                {!fileName ? (
                    <div className="bg-surface border-2 border-black rounded-3xl p-12 shadow-[8px_8px_0px_#000] dark:border-white dark:shadow-[8px_8px_0px_#ffffff] text-center space-y-8">
                        <div className="w-24 h-24 bg-brand-yellow/20 text-brand-yellow rounded-2xl flex items-center justify-center mx-auto border-2 border-black shadow-[4px_4px_0px_#000] rotate-3">
                            <Table size={48} />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-3xl font-black font-display uppercase tracking-tight">Convert PDF to Data</h3>
                            <p className="text-secondary max-w-md mx-auto">Upload a PDF with tables and we'll extract the data into a clean CSV file.</p>
                        </div>

                        <label className="inline-flex items-center gap-3 px-10 py-5 bg-brand-pink text-white rounded-2xl font-black text-xl cursor-pointer hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_#000] transition-all border-2 border-black shadow-[6px_6px_0px_#000] active:translate-y-0 active:shadow-none">
                            <Upload size={28} />
                            Choose PDF File
                            <input
                                type="file"
                                className="hidden"
                                accept="application/pdf"
                                onChange={handleFileUpload}
                            />
                        </label>

                        <p className="text-xs text-secondary font-medium">All processing happens locally in your browser.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="bg-surface border-2 border-black rounded-2xl p-6 shadow-[6px_6px_0px_#000] dark:border-white dark:shadow-[6px_6px_0px_#ffffff] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center border-2 border-black">
                                    {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg truncate max-w-[200px] md:max-w-md">{fileName}</h4>
                                    <p className="text-sm text-secondary font-medium">
                                        {isProcessing ? 'Analyzing document structure...' : 'Ready for download'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setFileName(null);
                                        setCsvContent(null);
                                        setPreviewData(null);
                                    }}
                                    className="p-3 text-secondary hover:text-red-500 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                                {csvContent && (
                                    <button
                                        onClick={downloadCsv}
                                        className="flex items-center gap-2 px-6 py-3 bg-brand-green text-black rounded-xl font-bold border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] transition-all"
                                    >
                                        <FileDown size={20} />
                                        Download CSV
                                    </button>
                                )}
                            </div>
                        </div>

                        {previewData && (
                            <div className="bg-surface border-2 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_#000] dark:border-white dark:shadow-[8px_8px_0px_#ffffff]">
                                <div className="p-4 border-b-2 border-black bg-brand-yellow/10 flex items-center justify-between">
                                    <h5 className="font-black uppercase tracking-wider text-sm flex items-center gap-2">
                                        <Table size={16} /> Data Preview (First 10 Rows)
                                    </h5>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-black">
                                                {previewData.headers.map((header, i) => (
                                                    <th key={i} className="p-4 font-bold border-r-2 border-black/10 last:border-r-0 whitespace-nowrap">{header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.rows.map((row, i) => (
                                                <tr key={i} className="border-b-2 border-black/5 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                                    {row.map((cell, j) => (
                                                        <td key={j} className="p-4 text-sm border-r-2 border-black/5 last:border-r-0 max-w-xs truncate">{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="py-20 flex flex-col items-center gap-6 text-center">
                                <div className="relative">
                                    <div className="w-20 h-20 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Table className="text-brand-pink" size={32} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold">Scanning Document...</h4>
                                    <p className="text-secondary">Identifying tables and rows. Large files may take a few seconds.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-12 bg-brand-cyan/10 border-2 border-black rounded-2xl p-6 flex gap-4 dark:border-white">
                    <AlertCircle className="text-brand-cyan shrink-0" size={24} />
                    <div className="space-y-1">
                        <h4 className="font-bold">Pro Tip</h4>
                        <p className="text-sm text-secondary">Simple PDFs with clear table borders give the best results. Complex layouts with floating text might require some manual cleanup after conversion.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfToCsv;
