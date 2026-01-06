import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Layers, FileImage, ImageMinus, PenTool, Home, Combine, Settings,
  QrCode, ShieldCheck, Lock, FileKey, RefreshCcw, Keyboard, FileText,
  Menu, X, Sun, Moon, ChevronRight, Scan
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Theme State
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const navGroups = [
    {
      title: "PDF Suite",
      items: [
        { name: 'Doc Scanner', path: '/document-scanner', icon: PenTool },
        { name: 'Merge PDF', path: '/merge-pdf', icon: Combine },
        { name: 'Note Gen', path: '/note-generator', icon: FileText },
        { name: 'Image to PDF', path: '/image-to-pdf', icon: FileImage },
        { name: 'PDF to Image', path: '/pdf-to-image', icon: ImageMinus },
      ]
    },
    {
      title: "Image Studio",
      items: [
        { name: 'Img Toolkit', path: '/image-toolkit', icon: Settings },
      ]
    },
    {
      title: "Security",
      items: [
        { name: 'File Vault', path: '/secure-vault', icon: ShieldCheck },
        { name: 'Pass Generator', path: '/password-tool', icon: ShieldCheck },
        { name: 'Pass Manager', path: '/password-manager', icon: Lock },
        { name: 'Hash Gen', path: '/hash-generator', icon: FileKey },
      ]
    },
    {
      title: "Productivity",
      items: [
        { name: 'Typing Training', path: '/typing-test', icon: Keyboard },
        { name: 'Unit Convert', path: '/converter', icon: RefreshCcw },
        { name: 'Text Format', path: '/text-formatter', icon: FileText },
        { name: 'QR Batch', path: '/qr-batch', icon: QrCode },
      ]
    },
    {
      title: "AI Tools",
      items: [
        { name: 'Content Check', path: '/content-detector', icon: Scan },
        { name: 'Flashcards', path: '/flashcards', icon: Layers },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex font-sans text-[var(--text-primary)] transition-colors duration-300">

      {/* --- Aesthetic Desktop Sidebar --- */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-50 bg-[var(--bg-secondary)] border-r border-[var(--border-color)]">
        <div className="p-8 pb-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Layers size={20} strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-xl tracking-tight font-[Outfit]">omniTools</h1>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pb-8">
          <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${location.pathname === '/' ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white dark:hover:bg-white/5'}`}>
            <Home size={18} />
            <span>Dashboard</span>
          </Link>

          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="px-4 text-[11px] font-bold text-[var(--text-secondary)]/50 uppercase tracking-[0.1em] mb-2 font-[Outfit]">{group.title}</h3>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all group ${isActive ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white dark:hover:bg-white/5'}`}
                    >
                      <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-[var(--text-secondary)]/70 group-hover:text-[var(--accent-primary)]'} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-[var(--border-color)]">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-white/5 border border-[var(--border-color)] hover:border-[var(--accent-secondary)] transition-all text-xs font-semibold group"
          >
            <div className="flex items-center gap-2">
              {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-[var(--accent-primary)]" />}
              <span>{isDark ? 'Light' : 'Dark'} Mode</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>
      </aside>

      {/* --- Mobile Header --- */}
      <div className="md:hidden fixed top-0 w-full z-50 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] h-16 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white">
            <Layers size={18} />
          </div>
          <span className="font-bold font-[Outfit]">omniTools</span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-[var(--border-color)] transition-all">
            {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-[var(--accent-primary)]" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* --- Main Content --- */}
      <main className="flex-1 md:pl-64 pt-16 md:pt-0 min-h-screen relative overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 md:py-16">
          {children}
        </div>
      </main>

      {/* --- Minimalist Mobile Menu --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-[var(--text-primary)]/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[80%] max-w-sm bg-[var(--bg-primary)] z-[70] shadow-2xl p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <span className="font-bold text-lg font-[Outfit]">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-6">
                {navGroups.map((g, i) => (
                  <div key={i}>
                    <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4">{g.title}</h3>
                    <div className="space-y-2">
                      {g.items.map(item => (
                        <Link
                          key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm font-medium"
                        >
                          <item.icon size={18} className="text-[var(--accent-primary)]" />
                          <span>{item.name}</span>
                          <ChevronRight size={14} className="ml-auto opacity-30" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Layout;