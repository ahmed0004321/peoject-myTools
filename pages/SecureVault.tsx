import React, { useState, useRef } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ShieldCheck, Lock, Unlock, Upload, FileKey, X, Eye, EyeOff, AlertCircle } from 'lucide-react';

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
                if (e.message?.includes('format')) msg = "Invalid file format. Please used a .mtv file.";
                else msg = "Decryption failed. Incorrect password or corrupted file.";
            }
            setError(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <Card>
                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 mb-4">
                        <ShieldCheck size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Secure File Vault</h2>
                    <p className="text-[var(--text-secondary)] mt-2">AES-256 Client-Side Encryption (.mtv format)</p>
                </div>

                <div className="flex rounded-lg bg-inset p-1 mb-8">
                    <button
                        onClick={() => { setMode('encrypt'); setFile(null); setStatus(null); setError(null); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'encrypt' ? 'bg-[var(--bg-secondary)] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Lock size={16} /> Encrypt
                    </button>
                    <button
                        onClick={() => { setMode('decrypt'); setFile(null); setStatus(null); setError(null); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'decrypt' ? 'bg-[var(--bg-secondary)] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Unlock size={16} /> Decrypt
                    </button>
                </div>

                {/* Main Logic Same, just updated file parsing */}
                <div className="space-y-6">
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors bg-inset ${file ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/10' : 'border-[var(--border-color)] hover:border-indigo-500'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFile} />
                        {file ? (
                            <div className="flex flex-col items-center">
                                <FileKey size={32} className="text-indigo-500 mb-2" />
                                <p className="font-medium text-[var(--text-primary)] break-all">{file.name}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                <div className="flex gap-2 mt-4">
                                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase py-1 px-2 bg-indigo-100 dark:bg-indigo-900/30 rounded">Selected</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                        className="p-1 hover:bg-[var(--bg-primary)] rounded text-slate-400 hover:text-red-500"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-slate-400 dark:text-slate-600">
                                <Upload size={32} className="mb-2 opacity-50" />
                                <p className="font-medium text-[var(--text-secondary)]">Click to select a file</p>
                                <p className="text-xs mt-1 text-slate-500">or drag and drop</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Passphrase</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 pr-10 rounded-lg border border-[var(--border-color)] bg-inset outline-none focus:border-indigo-500 transition-colors text-[var(--text-primary)]"
                                placeholder="Enter a strong password..."
                            />
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        onClick={processFile}
                        disabled={!file || !password || isProcessing}
                        className="w-full h-12 text-lg"
                        variant={mode === 'encrypt' ? 'primary' : 'secondary'}
                    >
                        {mode === 'encrypt' ? 'Encrypt & Download' : 'Decrypt & Restore'}
                    </Button>

                    {status && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-center text-sm font-medium border border-emerald-100 dark:border-emerald-900/50">
                            {status}
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-center text-sm font-medium border border-red-100 dark:border-red-900/50 flex items-center justify-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <p className="text-xs text-[var(--text-secondary)] text-center px-4">
                        <b>Important:</b> We use AES-256 for military-grade protection. If you lose your password, your data is lost forever. We cannot recover it.
                    </p>
                </div>
            </Card>
        </div>
    );
};
export default SecureVault;
