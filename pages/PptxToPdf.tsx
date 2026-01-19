import React, { useState } from 'react';
import { FileText, Download, Upload, AlertCircle, CheckCircle, Loader2, Presentation } from 'lucide-react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import SectionHeader from '../components/ui/SectionHeader';
import { motion } from 'framer-motion';

const PptxToPdf: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0); // 0-100
    const [status, setStatus] = useState<string>("");
    const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");

    // Helper: Parse XML
    const parseXml = (xmlStr: string) => {
        return new DOMParser().parseFromString(xmlStr, "text/xml");
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsProcessing(true);
        setStatus("Reading file structure...");
        setProgress(10);
        setResultPdfUrl(null);

        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);

            // 1. Identify Slides
            // Slides are usually named slide1.xml, slide2.xml etc in ppt/slides/
            const slideFiles = Object.keys(contents.files)
                .filter(path => path.startsWith("ppt/slides/slide") && path.endsWith(".xml"))
                .sort((a, b) => {
                    // Sort numerically: slide1, slide2, slide10 instead of slide1, slide10, slide2
                    const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || "0");
                    const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || "0");
                    return numA - numB;
                });

            if (slideFiles.length === 0) {
                throw new Error("No slides found. Is this a valid .pptx?");
            }

            setStatus(`Found ${slideFiles.length} slides. Extracting content...`);
            setProgress(20);

            // Initialize PDF
            // Default A4 Landscape roughly matches PPT (297mm x 210mm)
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Iterate Slides
            for (let i = 0; i < slideFiles.length; i++) {
                const percent = 20 + Math.floor(((i + 1) / slideFiles.length) * 60);
                setProgress(percent);
                setStatus(`Processing slide ${i + 1}/${slideFiles.length}...`);

                if (i > 0) pdf.addPage();

                const slidePath = slideFiles[i];
                const slideXmlStr = await contents.files[slidePath].async("string");
                const slideDoc = parseXml(slideXmlStr);

                // --- Extract Text ---
                // PowerPoint text is usually in <a:t> tags
                const textNodes = slideDoc.getElementsByTagName("a:t");
                let yPos = 20; // Start Y position (mm)
                const margin = 20;
                const maxWidth = 297 - (margin * 2);
                const lineHeight = 10;

                pdf.setFontSize(16);
                pdf.text(`Slide ${i + 1}`, margin, yPos);
                yPos += 15;
                pdf.setFontSize(12);

                if (textNodes.length === 0) {
                    pdf.setTextColor(150);
                    pdf.text("(No text detected on this slide)", margin, yPos);
                } else {
                    pdf.setTextColor(0);
                    for (let j = 0; j < textNodes.length; j++) {
                        const text = textNodes[j].textContent || "";
                        if (!text.trim()) continue;

                        // Check for title vs body (heuristic based on parent hierarchy or just simple flow)
                        // Simple flow: just dump text
                        const lines = pdf.splitTextToSize(text, maxWidth);

                        // Check overflow
                        if (yPos + (lines.length * 7) > 190) {
                            pdf.addPage();
                            yPos = 20;
                        }

                        pdf.text(lines, margin, yPos);
                        yPos += (lines.length * 7) + 2;
                    }
                }

                // Note: Image extraction requires parsing rels and strictly matching IDs
                // which is complex for a "mistake-free" quick implementation. 
                // We focus on text content accuracy first as requested.
            }

            setStatus("Finalizing PDF...");
            setProgress(90);

            const pdfBlob = pdf.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            setResultPdfUrl(url);
            setStatus("Ready!");
            setProgress(100);
            setIsProcessing(false);

        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
            setIsProcessing(false);
            setProgress(0);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 animate-fade-in">
            <SectionHeader
                title="PPTX to PDF Converter"
                subtitle="Securely convert presentations to PDF in your browser."
            />

            <div className="max-w-3xl mx-auto px-6">
                <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl text-center space-y-8">

                    {/* Upload Area */}
                    {!resultPdfUrl && !isProcessing && (
                        <div className="space-y-6">
                            <div className="w-24 h-24 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mx-auto mb-6">
                                <Presentation size={48} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Upload PowerPoint File</h3>
                                <p className="text-secondary">Converts .pptx to .pdf instantly. content-focused.</p>
                            </div>

                            <label className="inline-flex items-center gap-3 px-8 py-4 bg-brand-orange text-white rounded-xl font-bold text-lg cursor-pointer hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20">
                                <Upload size={24} />
                                Select Presentation
                                <input type="file" accept=".pptx" className="hidden" onChange={handleFileChange} />
                            </label>

                            <p className="text-xs text-secondary/60 pt-4">
                                *Note: Complex layouts may be linearized for readability.
                            </p>
                        </div>
                    )}

                    {/* Processing State */}
                    {isProcessing && (
                        <div className="space-y-6 py-10">
                            <div className="relative w-20 h-20 mx-auto">
                                <Loader2 className="w-full h-full text-brand-orange animate-spin" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold animate-pulse">{status}</h3>
                                <p className="text-secondary text-sm mt-2">{progress}% Completed</p>
                            </div>
                            {/* Bar */}
                            <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-brand-orange"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {resultPdfUrl && (
                        <div className="space-y-6 py-6 animate-slide-up">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle size={40} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-primary">Conversion Complete!</h3>
                                <p className="text-secondary mt-1">{fileName}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <a
                                    href={resultPdfUrl}
                                    download={fileName.replace('.pptx', '.pdf')}
                                    className="flex items-center justify-center gap-2 px-8 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                                >
                                    <Download size={20} /> Download PDF
                                </a>
                                <button
                                    onClick={() => setResultPdfUrl(null)}
                                    className="flex items-center justify-center gap-2 px-8 py-3 bg-zinc-100 dark:bg-zinc-800 text-primary rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Convert Another
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default PptxToPdf;
