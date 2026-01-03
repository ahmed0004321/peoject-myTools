
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Scan, Download, Copy, Type, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

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
                    scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
                    scanner.render((decodedText: string) => {
                        setScannedResult(decodedText);
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
        <div className="max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </Link>

            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">QR Code Master</h1>
                <p className="text-slate-500 mt-2">Generate stylish QR codes or scan them instantly.</p>
            </div>

            <div className="flex justify-center gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('gen')}
                    className={`px - 8 py - 3 rounded - full font - bold flex items - center gap - 2 transition - all duration - 300 ${activeTab === 'gen' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 transform scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'} `}
                >
                    <QrCode size={18} /> Generate
                </button>
                <button
                    onClick={() => setActiveTab('scan')}
                    className={`px - 8 py - 3 rounded - full font - bold flex items - center gap - 2 transition - all duration - 300 ${activeTab === 'scan' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 transform scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'} `}
                >
                    <Scan size={18} /> Scan Code
                </button>
            </div>

            <Card className="min-h-[450px] p-0 overflow-hidden">
                {activeTab === 'gen' ? (
                    <div className="grid md:grid-cols-2 h-full min-h-[450px]">
                        <div className="p-8 border-r border-slate-100 flex flex-col gap-6 bg-slate-50/30">
                            <div className="relative flex-grow flex flex-col">
                                <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">QR Content</label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Enter URL, Text, E-mail..."
                                    className="w-full flex-grow p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/50 resize-none transition-all shadow-sm text-slate-700"
                                />
                                <Type className="absolute right-4 bottom-4 text-slate-300 pointer-events-none" size={20} />
                            </div>
                            <p className="text-xs font-semibold text-center text-slate-400 uppercase tracking-wide">
                                Auto-updates as you type
                            </p>
                        </div>
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50/80 backdrop-blur-sm">
                            {generatedDataUrl ? (
                                <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
                                    <div className="p-4 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                                        <img src={generatedDataUrl} alt="QR" className="w-56 h-56" />
                                    </div>
                                    <Button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = generatedDataUrl;
                                            link.download = 'qrcode.png';
                                            link.click();
                                        }}
                                        className="w-full"
                                    >
                                        <Download size={18} /> Download PNG
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-slate-300 flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                                        <QrCode size={32} className="opacity-50" />
                                    </div>
                                    <p className="font-medium">Enter text to generate</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-10 flex flex-col items-center justify-center h-full min-h-[450px]">
                        {!scannedResult ? (
                            <div className="w-full max-w-md mx-auto">
                                <div id="reader" className="w-full overflow-hidden rounded-2xl border-2 border-slate-100 shadow-inner bg-slate-900"></div>
                                <p className="text-center text-slate-500 mt-4 text-sm">Position QR code within the frame</p>
                            </div>
                        ) : (
                            <div className="w-full max-w-md text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100">
                                    <Scan size={36} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Scan Successful!</h3>
                                    <p className="text-slate-400">We found the following data:</p>
                                </div>

                                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 break-all text-slate-700 font-mono text-sm relative group cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => navigator.clipboard.writeText(scannedResult)}>
                                    {scannedResult}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Copy size={14} className="text-slate-400" />
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4 pt-2">
                                    <Button variant="secondary" onClick={() => navigator.clipboard.writeText(scannedResult)}>
                                        <Copy size={16} /> Copy
                                    </Button>
                                    <Button onClick={() => setScannedResult("")}>
                                        <Scan size={16} /> Scan Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default QrTool;

