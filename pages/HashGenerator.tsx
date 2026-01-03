import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Copy, FileText, Upload, RefreshCw, Check } from 'lucide-react';
import CryptoJS from 'crypto-js';

const HashGenerator: React.FC = () => {
    const [mode, setMode] = useState<'text' | 'file'>('text');
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [hashes, setHashes] = useState({ md5: '', sha1: '', sha256: '' });
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const calculateTextHashes = (input: string) => {
        setText(input);
        if (!input) {
            setHashes({ md5: '', sha1: '', sha256: '' });
            return;
        }
        setHashes({
            md5: CryptoJS.MD5(input).toString(),
            sha1: CryptoJS.SHA1(input).toString(),
            sha256: CryptoJS.SHA256(input).toString()
        });
    };

    const calculateFileHashes = () => {
        if (!file) return;
        setLoading(true);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            if (result) {
                // Determine type based on result
                // For crypto-js with large files, we need WordArray
                // But efficient way is to read as binary string or array buffer
                const wordArray = CryptoJS.lib.WordArray.create(result as any);
                
                setHashes({
                    md5: CryptoJS.MD5(wordArray).toString(),
                    sha1: CryptoJS.SHA1(wordArray).toString(),
                    sha256: CryptoJS.SHA256(wordArray).toString()
                });
                setLoading(false);
            }
        };
        reader.onerror = () => {
            setLoading(false);
            alert('Error reading file');
        };
        reader.readAsArrayBuffer(file);
    };

    const handleCopy = (val: string, type: string) => {
        navigator.clipboard.writeText(val);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
             <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Hash Generator</h1>
                <p className="text-slate-500">Generate cryptographic hashes (MD5, SHA-1, SHA-256) for text or files.</p>
            </div>

            <Card>
                <div className="p-1 bg-slate-100 rounded-xl flex mb-6">
                    <button 
                        onClick={() => { setMode('text'); setHashes({ md5: '', sha1: '', sha256: '' }); setText(''); }}
                        className={`flex - 1 py - 2 rounded - lg text - sm font - bold transition - all ${ mode === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700' } `}
                    >
                        Text String
                    </button>
                    <button 
                        onClick={() => { setMode('file'); setHashes({ md5: '', sha1: '', sha256: '' }); setFile(null); }}
                        className={`flex - 1 py - 2 rounded - lg text - sm font - bold transition - all ${ mode === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700' } `}
                    >
                        File Upload
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {mode === 'text' ? (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Input Text</label>
                            <textarea 
                                value={text}
                                onChange={(e) => calculateTextHashes(e.target.value)}
                                className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none h-32 resize-none font-mono text-sm"
                                placeholder="Type something to hash..."
                            />
                        </div>
                    ) : (
                        <div>
                             <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
                                <input 
                                    type="file" 
                                    id="hash-file"
                                    className="hidden" 
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setFile(e.target.files[0]);
                                            setHashes({ md5: '', sha1: '', sha256: '' });
                                        }
                                    }}
                                />
                                <label htmlFor="hash-file" className="cursor-pointer flex flex-col items-center">
                                    <div className="w-16 h-16 bg-indigo-100/50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                                        {file ? <FileText size={32} /> : <Upload size={32} />}
                                    </div>
                                    {file ? (
                                        <>
                                            <p className="text-lg font-bold text-slate-800">{file.name}</p>
                                            <p className="text-sm text-slate-400 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-lg font-bold text-slate-800">Click to upload File</p>
                                            <p className="text-sm text-slate-400 mt-1">or drag and drop here</p>
                                        </>
                                    )}
                                </label>
                            </div>
                            {file && (
                                <div className="mt-4 flex justify-center">
                                    <Button onClick={calculateFileHashes} disabled={loading} className="w-full sm:w-auto min-w-[200px]">
                                        {loading ? <RefreshCw className="animate-spin" /> : 'Generate Hashes'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {(hashes.md5 || loading) && (
                        <div className="space-y-4 pt-6 border-t border-slate-100">
                             <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                    MD5
                                    {copied === 'md5' && <span className="text-green-600 flex items-center gap-1"><Check size={12} /> Copied</span>}
                                </label>
                                <div className="relative">
                                    <input readOnly value={hashes.md5} className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-600" />
                                    <button onClick={() => handleCopy(hashes.md5, 'md5')} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600">
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>

                             <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                    SHA-1
                                    {copied === 'sha1' && <span className="text-green-600 flex items-center gap-1"><Check size={12} /> Copied</span>}
                                </label>
                                <div className="relative">
                                    <input readOnly value={hashes.sha1} className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-600" />
                                    <button onClick={() => handleCopy(hashes.sha1, 'sha1')} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600">
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>

                             <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                    SHA-256
                                    {copied === 'sha256' && <span className="text-green-600 flex items-center gap-1"><Check size={12} /> Copied</span>}
                                </label>
                                <div className="relative">
                                    <input readOnly value={hashes.sha256} className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-600" />
                                    <button onClick={() => handleCopy(hashes.sha256, 'sha256')} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600">
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
export default HashGenerator;
