import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileImage, Layers, ImageMinus, PenTool, ArrowRight, Combine,
  Settings, Archive, QrCode, RefreshCcw, ShieldCheck, Lock,
  Keyboard, FileText, Zap, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- Data ---
const GROUPS = [
  {
    title: "Most Used",
    items: [
      { name: "Note Generator", icon: FileText, path: "/note-generator", desc: "Write & export professional notes as PDFs.", color: "bg-indigo-500" },
      { name: "Image Toolkit", icon: Settings, path: "/image-toolkit", desc: "Batch process, resize & convert.", color: "bg-rose-500" },
      { name: "Secure Vault", icon: ShieldCheck, path: "/secure-vault", desc: "AES-256 local encrypted storage.", color: "bg-slate-900" },
      { name: "Typing Train", icon: Keyboard, path: "/typing-test", desc: "Master precision & WPM analytics.", color: "bg-amber-500" },
    ]
  },
  {
    title: "PDF Essentials",
    items: [
      { name: "Merge PDF", icon: Combine, path: "/merge-pdf", desc: "Combine multiple docs." },
      { name: "Image to PDF", icon: FileImage, path: "/image-to-pdf", desc: "Convert photos." },
      { name: "PDF to Image", icon: Layers, path: "/pdf-to-image", desc: "Extract high-quality." },
      { name: "Compress", icon: Archive, path: "/compress-tool", desc: "Optimize file size." },
    ]
  }
];

const UTILITIES = [
  { name: "Pass Gen", icon: ShieldCheck, path: "/password-tool" },
  { name: "Pass Manager", icon: Lock, path: "/password-manager" },
  { name: "Hash Gen", icon: Layers, path: "/hash-generator" },
  { name: "QR Batch", icon: QrCode, path: "/qr-batch" },
  { name: "Converter", icon: RefreshCcw, path: "/converter" },
  { name: "Format", icon: FileText, path: "/text-formatter" },
  { name: "Markdown", icon: FileText, path: "/markdown-preview" },
];

const Home: React.FC = () => {
  return (
    <div className="space-y-20 pb-20 animate-fade-in">

      {/* --- Luxe Header --- */}
      <header className="space-y-8">
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--text-primary)]"
          >
            Professional toolkit <br />
            <span className="text-[var(--accent-primary)]">Simplified.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[var(--text-secondary)] max-w-2xl font-light"
          >
            Everything you need for documents, images, and security.
            Privacy-first, blazing fast, and professional grade.
          </motion.p>
        </div>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link to="/pdf-editor">
            <button className="btn-luxe flex items-center gap-2 group">
              Start PDF Editing
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link to="/secure-vault">
            <button className="px-5 py-2.5 rounded-lg border border-[var(--border-color)] font-semibold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              Explore Vault
            </button>
          </Link>
        </div>
      </header>

      {/* --- Main Sections --- */}
      {GROUPS.map((group, gIdx) => (
        <section key={gIdx} className="space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight uppercase text-xs tracking-widest text-[var(--text-secondary)]/60">{group.title}</h2>
            <div className="h-px bg-[var(--border-color)] flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {group.items.map((tool, tIdx) => (
              <Link key={tIdx} to={tool.path} className="group">
                <article className="luxe-card p-6 h-full flex flex-col items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${tool.color || 'bg-[var(--bg-secondary)] text-[var(--accent-primary)] border border-[var(--border-color)]'} transition-all group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-indigo-500/10`}>
                    <tool.icon size={22} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{tool.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-normal leading-relaxed">{tool.desc}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* --- Tiny Utility Map --- */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold tracking-tight uppercase text-xs tracking-widest text-[var(--text-secondary)]/60">Toolkit Map</h2>
          <div className="h-px bg-[var(--border-color)] flex-1" />
        </div>

        <div className="flex flex-wrap gap-2">
          {UTILITIES.map((u, i) => (
            <Link key={i} to={u.path}>
              <div className="px-4 py-3 rounded-xl border border-[var(--border-color)] bg-white dark:bg-white/5 hover:border-[var(--accent-primary)] hover:shadow-sm transition-all flex items-center gap-2 group">
                <u.icon size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]" />
                <span className="text-sm font-semibold">{u.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --- Footer Signature --- */}
      <footer className="pt-20 text-center opacity-40">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Layers size={14} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">omniTools Professional</span>
        </div>
        <p className="text-xs font-medium">Built for Privacy. Designed for Excellence.</p>
      </footer>
    </div>
  );
};

export default Home;