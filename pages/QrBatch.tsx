import React, { useState } from 'react';
import { QrCode, Download, Printer, Layers } from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import SectionHeader from '../components/ui/SectionHeader';
import { toast } from 'react-hot-toast';

const QrBatch: React.FC = () => {
    const [input, setInput] = useState('');
    const [qrs, setQrs] = useState<{ text: string, dataUrl: string }[]>([]);
    const [generating, setGenerating] = useState(false);

    const generate = async () => {
        setGenerating(true);
        const lines = input.split('\n').filter(l => l.trim() !== '');
        if (lines.length === 0) {
            setGenerating(false);
            return;
        }

        const newQrs: { text: string, dataUrl: string }[] = [];
        // Sequential generation to avoid main thread freeze if many
        for (const line of lines) {
            try {
                const url = await QRCode.toDataURL(line, { width: 200, margin: 1 });
                newQrs.push({ text: line, dataUrl: url });
            } catch (e) {
                console.error('QR Gen Error', e);
            }
        }
        setQrs(newQrs);
        setGenerating(false);
        toast.success(`Generated ${newQrs.length} QR codes!`);
    };

    const downloadZip = () => {
        const zip = new JSZip();
        qrs.forEach((qr, i) => {
            // Remove header
            const data = qr.dataUrl.split(',')[1];
            zip.file(`qr - ${i} -${qr.text.replace(/[^a-z0-9]/gi, '_').slice(0, 10)}.png`, data, { base64: true });
        });
        zip.generateAsync({ type: 'blob' }).then((content) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'qrcodes.zip';
            link.click();
            toast.success('ZIP file downloaded successfully!');
        });
    };

    const print = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
    < html >
                    <head><title>Print QR Codes</title>
                    <style>
                        body { font-family: sans-serif; }
                        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
                        .item { text-align: center; page-break-inside: avoid; border: 1px solid #eee; padding: 10px; }
                        img { width: 100%; max-width: 150px; }
                        .label { font-size: 10px; margin-top: 5px; word-break: break-all; }
                    </style>
                    </head>
                    <body>
                        <h1>QR Batch Export</h1>
                        <div class="grid">
                            ${qrs.map(q => `
                                <div class="item">
                                    <img src="${q.dataUrl}" />
                                    <div class="label">${q.text}</div>
                                </div>
                            `).join('')}
                        </div>
                    </body>
                </html >
    `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 ">
            <SectionHeader
                title="Bulk QR Generator"
                subtitle="Generate multiple QR codes at once for inventory or events."
            />

            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-surface border border-border rounded-3xl shadow-xl p-6 lg:p-8 ">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-primary"><Layers className="text-brand-purple" /> Generator</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-secondary uppercase">Input Lines (One per QR)</label>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="w-full h-96 p-4 rounded-xl border border-border bg-inset focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple outline-none font-mono text-sm resize-none text-primary placeholder:text-secondary/30 transition-all shadow-inner"
                                placeholder={"https://example.com/1\nhttps://example.com/2\nModel-123\nModel-456"}
                            />
                            <button
                                onClick={generate}
                                disabled={generating}
                                className="w-full py-4 bg-brand-purple text-white rounded-xl font-bold hover:bg-purple-600 transition-all hover:scale-105 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                            >
                                {generating ? 'Generating...' : `Generate ${input.split('\n').filter(l => l.trim()).length} QRs`}
                            </button>
                        </div>

                        <div className="lg:col-span-2 bg-inset rounded-xl p-4 border border-border flex flex-col h-[500px]">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-secondary uppercase">{qrs.length} Generated</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={print}
                                        disabled={qrs.length === 0}
                                        className="px-4 py-2 rounded-lg bg-surface border border-border text-primary font-bold text-sm hover:bg-secondary/10 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Printer size={14} /> Print
                                    </button>
                                    <button
                                        onClick={downloadZip}
                                        disabled={qrs.length === 0}
                                        className="px-4 py-2 rounded-lg bg-surface border border-border text-primary font-bold text-sm hover:bg-secondary/10 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Download size={14} /> ZIP
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 p-2 custom-scrollbar">
                                {qrs.map((q, i) => (
                                    <div key={i} className="bg-surface p-3 rounded-xl shadow-sm border border-border flex flex-col items-center text-center hover:scale-105 transition-transform">
                                        <img src={q.dataUrl} alt="QR" className="w-full aspect-square" />
                                        <p className="text-[10px] text-secondary mt-2 break-all line-clamp-2">{q.text}</p>
                                    </div>
                                ))}
                                {qrs.length === 0 && (
                                    <div className="col-span-full h-full flex flex-col items-center justify-center text-secondary/30">
                                        <QrCode size={48} className="mb-2" />
                                        <p>Ready to generate</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default QrBatch;
