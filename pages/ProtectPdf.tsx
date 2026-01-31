import React, { useState, useRef } from 'react';
import { Lock, Upload, FileKey, X, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ProtectPdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                toast.error('Please select a valid PDF file.');
                return;
            }
            setFile(selectedFile);
            setStatus(null);
            setError(null);
        }
    };

    const protectPdf = async () => {
        if (!file || !password) return;
        if (password !== confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }
        if (password.length < 4) {
            toast.error('Password too short (min 4 characters)');
            return;
        }

        setIsProcessing(true);
        setStatus('Uploading and encrypting...');
        setError(null);

        try {
            const formData = new FormData();
            formData.append('pdf', file);
            formData.append('password', password);

            const response = await fetch('/api/protect-pdf', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            // Get the blob from the response
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `protected_${file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setStatus('PDF Protected Successfully!');
            toast.success('PDF encrypted and downloaded!');
        } catch (e: any) {
            console.error("Protection Error:", e);
            setError(e.message || 'Encryption failed. Please try again.');
            toast.error('Failed to protect PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <SectionHeader
                title="Protect PDF"
                subtitle="Lock your PDF with a permanent password. Industry-standard AES-256 encryption."
            />

            <div className="max-w-2xl mx-auto px-4 mt-8">
                <div className="bg-surface border-2 border-black rounded-3xl shadow-[12px_12px_0px_#000] dark:border-white dark:shadow-[12px_12px_0px_#ffffff] p-8 md:p-12">
                    {!file ? (
                        <div
                            className="border-4 border-dashed border-black/10 dark:border-white/20 rounded-3xl p-16 text-center cursor-pointer hover:border-[#ef4444] hover:bg-[#ef4444]/5 transition-all group"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#ef4444]', 'bg-[#ef4444]/5'); }}
                            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-[#ef4444]', 'bg-[#ef4444]/5'); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-[#ef4444]', 'bg-[#ef4444]/5');
                                if (e.dataTransfer.files[0]) {
                                    handleFile({ target: { files: e.dataTransfer.files } } as any);
                                }
                            }}
                        >
                            <input type="file" className="hidden" ref={fileInputRef} accept="application/pdf" onChange={handleFile} />
                            <div className="w-24 h-24 bg-[#ef4444]/10 text-[#ef4444] rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-black shadow-[6px_6px_0px_#000] group-hover:rotate-6 transition-transform">
                                <Upload size={48} />
                            </div>
                            <h3 className="text-2xl font-black font-display uppercase italic text-primary">Drop PDF here</h3>
                            <p className="text-secondary mt-2">or click to browse your files</p>
                        </div>
                    ) : (
                        <div className="space-y-8 text-primary">
                            <div className="flex items-center gap-4 p-6 bg-inset border-2 border-black rounded-2xl shadow-[6px_6px_0px_#000] dark:border-white">
                                <div className="w-16 h-16 bg-[#ef4444] text-white rounded-xl flex items-center justify-center shrink-0 border-2 border-black shadow-[4px_4px_0px_#000]">
                                    <FileKey size={32} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-black text-xl truncate">{file.name}</p>
                                    <p className="text-sm font-bold opacity-50 uppercase tracking-widest text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button
                                    onClick={() => { setFile(null); setStatus(null); setError(null); }}
                                    className="ml-auto p-3 hover:bg-rose-500/10 rounded-xl text-secondary hover:text-rose-500 transition-colors border-2 border-transparent hover:border-rose-200"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-secondary uppercase tracking-[0.2em]">Set Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full p-4 pr-12 rounded-xl border-2 border-black bg-background text-primary focus:ring-4 focus:ring-[#ef4444]/20 outline-none transition-all font-bold placeholder:opacity-30"
                                            placeholder="Min. 4 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-secondary uppercase tracking-[0.2em]">Confirm Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full p-4 rounded-xl border-2 border-black bg-background text-primary focus:ring-4 focus:ring-[#ef4444]/20 outline-none transition-all font-bold placeholder:opacity-30"
                                        placeholder="Repeat password"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={protectPdf}
                                disabled={!file || !password || password !== confirmPassword || isProcessing}
                                className="w-full py-6 bg-[#ef4444] text-white rounded-2xl font-black text-2xl border-2 border-black shadow-[8px_8px_0px_#000] flex items-center justify-center gap-4 hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_#000] transition-all active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={32} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Lock size={32} />
                                        Protect PDF
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    <AnimatePresence>
                        {status && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 p-6 bg-emerald-500/10 border-2 border-emerald-500 rounded-2xl text-emerald-600 font-black text-center flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={24} /> {status}
                            </motion.div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 p-6 bg-rose-500/10 border-2 border-rose-500 rounded-2xl text-rose-500 font-black text-center flex items-center justify-center gap-3 italic"
                            >
                                <AlertCircle size={24} /> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-12 p-6 bg-black/5 dark:bg-white/5 rounded-2xl border-2 border-black/5 flex items-start gap-4">
                        <ShieldCheck className="text-[#ef4444] shrink-0" size={24} />
                        <div className="text-xs font-bold leading-relaxed space-y-2 opacity-60 uppercase tracking-wider text-secondary">
                            <p>Military-grade AES-256 encryption applied at the file level.</p>
                            <p>Works with Adobe Reader, Chrome, and all major PDF platforms.</p>
                            <p className="text-[#ef4444]">Warning: We cannot recover forgotten passwords.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProtectPdf;
