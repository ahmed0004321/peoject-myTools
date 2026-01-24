import React, { useState, useRef } from 'react';
import { ShieldCheck, Lock, Unlock, Upload, FileKey, X, Eye, EyeOff, AlertCircle, Download, CheckCircle2 } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

const MAGIC_BYTES = new Uint8Array([0x4F, 0x54, 0x56, 0x31]); // "OTV1" (omniTools Vault v1)

const SecureVault: React.FC = () => {
    const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus(null);
            setError(null);
        }
    };

    const deriveKey = async (password: string, salt: Uint8Array) => {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );
        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt as any,
                iterations: 250000, // Increased iterations
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    };

    const processFile = async () => {
        if (!file || !password) return;
        setIsProcessing(true);
        setStatus('Processing...');
        setError(null);

        try {
            if (mode === 'encrypt') {
                const salt = window.crypto.getRandomValues(new Uint8Array(16));
                const iv = window.crypto.getRandomValues(new Uint8Array(12));
                const key = await deriveKey(password, salt);

                const fileData = await file.arrayBuffer();
                const encrypted = await window.crypto.subtle.encrypt(
                    { name: "AES-GCM", iv: iv },
                    key,
                    fileData
                );

                // Structure: [MAGIC_BYTES (4)] + [Salt (16)] + [IV (12)] + [Ciphertext]
                const resultBuffer = new Uint8Array(MAGIC_BYTES.length + salt.length + iv.length + encrypted.byteLength);
                resultBuffer.set(MAGIC_BYTES, 0);
                resultBuffer.set(salt, MAGIC_BYTES.length);
                resultBuffer.set(iv, MAGIC_BYTES.length + salt.length);
                resultBuffer.set(new Uint8Array(encrypted), MAGIC_BYTES.length + salt.length + iv.length);

                const blob = new Blob([resultBuffer], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${file.name}.otv`; // omniTools Vault Extension
                link.click();
                setStatus('File Encrypted Successfully. (.otv)');
            } else {
                // Decrypt
                const fileData = await file.arrayBuffer();
                const data = new Uint8Array(fileData);

                // Verify Magic Bytes
                for (let i = 0; i < MAGIC_BYTES.length; i++) {
                    if (data[i] !== MAGIC_BYTES[i]) {
                        throw new Error("Invalid file format. Not a recognized vault file.");
                    }
                }

                const saltOffset = MAGIC_BYTES.length;
                const ivOffset = saltOffset + 16;
                const cipherOffset = ivOffset + 12;

                const salt = data.slice(saltOffset, saltOffset + 16);
                const iv = data.slice(ivOffset, ivOffset + 12);
                const ciphertext = data.slice(cipherOffset);

                const key = await deriveKey(password, salt);

                const decrypted = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: iv },
                    key,
                    ciphertext
                );

                const blob = new Blob([decrypted]);
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;

                // Restore logic: if input is file.pdf.mtv -> output file.pdf
                let outName = file.name;
                if (outName.endsWith('.mtv')) {
                    outName = outName.slice(0, -4);
                } else if (outName.endsWith('.otv')) {
                    outName = outName.slice(0, -4);
                } else if (outName.endsWith('.enc')) {
                    outName = outName.slice(0, -4);
                } else {
                    outName = `decrypted_${outName}`;
                }

                link.download = outName;
                link.click();
                setStatus('Decryption Successful.');
            }
        } catch (e: any) {
            console.error(e);
            let msg = "Operation Failed.";
            if (mode === 'decrypt') {
                if (e.message?.includes('format')) msg = "Invalid file format. Please used a .otv file.";
                else msg = "Decryption failed. Incorrect password or corrupted file.";
            }
            setError(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 ">
            <SectionHeader
                title="Secure File Vault"
                subtitle="AES-256 Client-Side Encryption. Your data never leaves your device."
            />

            <div className="max-w-xl mx-auto px-4 mt-8">
                <div className="bg-surface border border-border rounded-3xl shadow-xl p-8 ">
                    <div className="flex rounded-xl bg-inset p-1.5 mb-8 border border-border">
                        <button
                            onClick={() => { setMode('encrypt'); setFile(null); setStatus(null); setError(null); }}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'encrypt' ? 'bg-surface shadow-md text-brand-purple' : 'text-secondary hover:text-primary'}`}
                        >
                            <Lock size={18} /> Encrypt
                        </button>
                        <button
                            onClick={() => { setMode('decrypt'); setFile(null); setStatus(null); setError(null); }}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'decrypt' ? 'bg-surface shadow-md text-emerald-500' : 'text-secondary hover:text-primary'}`}
                        >
                            <Unlock size={18} /> Decrypt
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${file
                                ? 'border-brand-purple bg-brand-purple/5'
                                : 'border-border bg-inset/50 hover:border-brand-purple hover:bg-inset'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFile} />
                            {file ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-brand-purple mb-4">
                                        <FileKey size={32} />
                                    </div>
                                    <p className="font-bold text-primary break-all text-sm md:text-base">{file.name}</p>
                                    <p className="text-xs text-secondary mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                                        <span className="text-xs text-brand-purple font-bold uppercase py-1 px-3 bg-brand-purple/10 rounded-full">Selected</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            className="p-1 hover:bg-rose-500/10 rounded-full text-secondary hover:text-rose-500 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-secondary py-4">
                                    <div className="w-16 h-16 rounded-2xl bg-inset flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload size={32} className="opacity-50" />
                                    </div>
                                    <p className="font-bold text-primary">Click to select a file</p>
                                    <p className="text-xs mt-1">or drag and drop</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-secondary uppercase tracking-wider">Passphrase</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-4 pr-12 rounded-xl border border-border bg-inset focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple outline-none transition-all text-primary placeholder:text-secondary/30 font-medium"
                                    placeholder={mode === 'encrypt' ? "Create a strong password..." : "Enter decryption password..."}
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={processFile}
                            disabled={!file || !password || isProcessing}
                            className={`w-full py-4 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 ${mode === 'encrypt'
                                ? 'bg-brand-purple hover:bg-purple-600 shadow-purple-500/20'
                                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                                }`}
                        >
                            {isProcessing ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : mode === 'encrypt' ? (
                                <><Lock size={20} /> Encrypt & Download</>
                            ) : (
                                <><Unlock size={20} /> Decrypt & Restore</>
                            )}
                        </button>

                        {status && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 ">
                                <CheckCircle2 size={18} /> {status}
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 animate-shake">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <p className="text-[10px] text-secondary text-center px-4 leading-relaxed">
                            <span className="font-bold text-rose-500">Important:</span> We use AES-256 for military-grade protection. If you lose your password, your data is lost forever. We cannot recover it.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecureVault;
