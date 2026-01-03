import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { QrCode, Download, Printer, Layers } from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';

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
        <div className="max-w-5xl mx-auto space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Layers className="text-indigo-600" /> Bulk QR Generator</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Input Lines (One per QR)</label>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full h-96 p-4 rounded-xl border border-[var(--border-color)] dark:bg-white/5 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none font-mono text-sm resize-none dark:text-white"
                            placeholder={"https://example.com/1\nhttps://example.com/2\nModel-123\nModel-456"}
                        />
                        <Button onClick={generate} disabled={generating} className="w-full">
                            {generating ? 'Generating...' : `Generate ${input.split('\n').filter(l => l.trim()).length} QRs`}
                        </Button>
                    </div>

                    <div className="md:col-span-2 bg-inset rounded-xl p-4 border border-[var(--border-color)] flex flex-col h-[500px]">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{qrs.length} Generated</span>
                            <div className="flex gap-2">
                                <Button onClick={print} disabled={qrs.length === 0} variant="secondary" className="text-xs px-3 py-1">
                                    <Printer size={14} className="mr-1" /> Print
                                </Button>
                                <Button onClick={downloadZip} disabled={qrs.length === 0} variant="secondary" className="text-xs px-3 py-1">
                                    <Download size={14} className="mr-1" /> ZIP
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
                            {qrs.map((q, i) => (
                                <div key={i} className="bg-white dark:bg-white/5 p-3 rounded-lg shadow-sm border border-[var(--border-color)] flex flex-col items-center text-center">
                                    <img src={q.dataUrl} alt="QR" className="w-full aspect-square" />
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 break-all line-clamp-2">{q.text}</p>
                                </div>
                            ))}
                            {qrs.length === 0 && (
                                <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                                    <QrCode size={48} className="mb-2 opacity-50" />
                                    <p>Ready to generate</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
export default QrBatch;
