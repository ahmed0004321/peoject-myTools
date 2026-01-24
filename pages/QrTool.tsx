import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Scan, Download, Copy, Type, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeader from '../components/ui/SectionHeader';
import { toast } from 'react-hot-toast';

const QrTool: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'gen' | 'scan'>('gen');
    const [text, setText] = useState("");
    const [generatedDataUrl, setGeneratedDataUrl] = useState("");
    const [scannedResult, setScannedResult] = useState("");

    const generate = async () => {
        if (!text) return;
        try {
            const url = await QRCode.toDataURL(text, { width: 400, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } });
            setGeneratedDataUrl(url);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (text) {
            const t = setTimeout(generate, 500);
            return () => clearTimeout(t);
        } else {
            setGeneratedDataUrl("");
        }
    }, [text]);

    useEffect(() => {
        let scanner: any;
        if (activeTab === 'scan') {
            // Delay init to allow DOM render
            setTimeout(() => {
                const el = document.getElementById("reader");
                if (el) {
                    scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true }, false);
                    scanner.render((decodedText: string) => {
                        setScannedResult(decodedText);
                        toast.success('QR Code scanned successfully!');
                        scanner.clear();
                    }, (err: any) => {
                        // ignore errors during scan search
                    });
                }
            }, 100);
        }
        return () => {
            if (scanner) {
                try { scanner.clear(); } catch (e) { }
            }
        };
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-background pb-20 ">
            <SectionHeader
                title="QR Code Master"
                subtitle="Generate stylish QR codes or scan them instantly."
            />

            <div className="max-w-4xl mx-auto px-4">
                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-surface p-1.5 rounded-2xl border border-border inline-flex">
                        <button
                            onClick={() => setActiveTab('gen')}
                            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'gen' ? 'bg-primary text-background shadow-lg' : 'text-secondary hover:text-primary'}`}
                        >
                            <QrCode size={18} /> Generate
                        </button>
                        <button
                            onClick={() => setActiveTab('scan')}
                            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'scan' ? 'bg-primary text-background shadow-lg' : 'text-secondary hover:text-primary'}`}
                        >
                            <Scan size={18} /> Scan Code
                        </button>
                    </div>
                </div>

                <div className="bg-surface border border-border rounded-3xl shadow-xl overflow-hidden  min-h-[500px]">
                    {activeTab === 'gen' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 h-full min-h-[500px]">
                            {/* Input Side */}
                            <div className="p-8 border-b md:border-b-0 md:border-r border-border bg-inset flex flex-col">
                                <label className="text-xs font-bold text-secondary uppercase mb-3 block">QR Content</label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Enter URL, Text, E-mail..."
                                    className="w-full h-full min-h-[200px] p-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all text-primary font-mono text-sm"
                                />
                                <div className="mt-4 flex items-center gap-2 text-xs text-secondary">
                                    <Type size={14} /> Auto-updates as you type
                                </div>
                            </div>

                            {/* Output Side */}
                            <div className="p-8 flex flex-col items-center justify-center bg-surface relative">
                                {generatedDataUrl ? (
                                    <div className="flex flex-col items-center gap-6 ">
                                        <div className="p-4 bg-white rounded-2xl shadow-lg border border-zinc-200">
                                            <img src={generatedDataUrl} alt="QR" className="w-56 h-56 mix-blend-multiply" />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = generatedDataUrl;
                                                link.download = 'qrcode.png';
                                                link.click();
                                                toast.success('QR Code downloaded!');
                                            }}
                                            className="px-8 py-3 bg-primary text-background rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                                        >
                                            <Download size={18} /> Download PNG
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-secondary flex flex-col items-center gap-4 opacity-50">
                                        <QrCode size={48} />
                                        <p className="font-bold">Enter text to generate</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 flex flex-col items-center justify-center h-full min-h-[500px]">
                            {!scannedResult ? (
                                <div className="w-full max-w-md mx-auto space-y-4 text-center">
                                    <div id="reader" className="w-full overflow-hidden rounded-2xl border-2 border-border shadow-inner bg-black"></div>
                                    <p className="text-sm font-bold text-secondary animate-pulse">Scanning for QR Codes...</p>
                                </div>
                            ) : (
                                <div className="w-full max-w-md text-center space-y-6 ">
                                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/5">
                                        <Scan size={36} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-primary">Scan Successful!</h3>
                                        <p className="text-secondary">We found the following data:</p>
                                    </div>

                                    <div className="p-6 bg-inset rounded-xl border border-border break-all text-primary font-mono text-sm relative group cursor-pointer hover:bg-background transition-colors shadow-inner" onClick={() => { navigator.clipboard.writeText(scannedResult); toast.success('Scanned content copied!'); }}>
                                        {scannedResult}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-background rounded-md shadow-sm">
                                            <Copy size={14} className="text-secondary" />
                                        </div>
                                    </div>

                                    <div className="flex justify-center gap-4">
                                        <button
                                            onClick={() => navigator.clipboard.writeText(scannedResult)}
                                            className="px-6 py-3 rounded-xl border border-border font-bold text-secondary hover:text-primary hover:bg-inset transition-all"
                                        >
                                            Copy Text
                                        </button>
                                        <button
                                            onClick={() => setScannedResult("")}
                                            className="px-6 py-3 rounded-xl bg-primary text-background font-bold hover:opacity-90 transition-all"
                                        >
                                            Scan Another
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QrTool;
