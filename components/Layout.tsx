import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Layers, FileImage, ImageMinus, PenTool, Home, Combine, Settings,
  QrCode, ShieldCheck, Lock, FileKey, RefreshCcw, Keyboard, FileText,
  Menu, X, Sun, Moon, ChevronRight, Scan, Wrench, Zap, Presentation
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
        { name: 'PPTX to PDF', path: '/pptx-to-pdf', icon: Presentation },
        { name: 'Merge PDF', path: '/merge-pdf', icon: Combine },
        { name: 'Image to PDF', path: '/image-to-pdf', icon: FileImage },
        { name: 'PDF to Image', path: '/pdf-to-image', icon: ImageMinus },
      ]
    },
    {
      title: "Image Studio",
      items: [
        { name: 'Img Sharpener', path: '/image-sharpener', icon: Zap },
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
        { name: 'Unit Convert', path: '/converter', icon: RefreshCcw },
        { name: 'Text Format', path: '/text-formatter', icon: FileText },
        { name: 'QR Batch', path: '/qr-batch', icon: QrCode },
      ]
    },
    {
      title: "AI Tools",
      items: [
        { name: 'Content Check', path: '/content-detector', icon: Scan },
      ]
    }
  ];

  // Vibrant Colors for Hover States
  const HOVER_COLORS = [
    'hover:bg-brand-green',
    'hover:bg-brand-pink',
    'hover:bg-brand-yellow',
    'hover:bg-brand-cyan',
    'hover:bg-brand-orange'
  ];

  const NavItem = ({ item, index, isActive }: { item: any, index: number, isActive: boolean }) => {
    // Deterministic color assignment based on name length + index to stay consistent
    const colorClass = HOVER_COLORS[(index + item.name.length) % HOVER_COLORS.length];

    return (
      <Link
        to={item.path}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 border-2
          ${isActive
            ? 'bg-transparent border-black text-[var(--text-primary)] shadow-[4px_4px_0px_#000] translate-x-1 translate-y-[-2px] dark:border-white dark:shadow-[4px_4px_0px_#ffffff] dark:text-white'
            : `border-transparent text-[var(--text-secondary)] hover:text-black hover:border-black hover:shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] ${colorClass} dark:hover:text-white dark:hover:border-white dark:hover:bg-zinc-900 dark:hover:shadow-[4px_4px_0px_#ffffff]`
          }
        `}
      >
        <item.icon size={18} strokeWidth={2.5} className={isActive ? 'text-[var(--text-primary)] dark:text-white' : 'currentColor'} />
        <span className="font-display tracking-wide">{item.name}</span>
        {isActive && <ChevronRight size={14} className="ml-auto" />}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex font-sans text-[var(--text-primary)] transition-colors duration-300">

      {/* --- Aesthetic Desktop Sidebar --- */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 left-0 z-50 bg-[var(--bg-secondary)] border-r-2 border-black">
        <div className="p-8 pb-6 border-b-2 border-dashed border-black/10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-[4px_4px_0px_var(--brand-yellow)] group-hover:shadow-[2px_2px_0px_var(--brand-yellow)] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all border-2 border-transparent">
              <Wrench size={24} strokeWidth={2.5} />
            </div>
            <h1 className="font-display font-black text-2xl tracking-tighter uppercase">my<span className="text-[var(--accent-primary)]">Tools</span></h1>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Dashboard Home */}
          <div>
            <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider border-2 transition-all duration-200 ${location.pathname === '/' ? 'bg-[var(--accent-primary)] text-white border-black shadow-[4px_4px_0px_#000] dark:border-white dark:shadow-[4px_4px_0px_#ffffff]' : 'border-transparent text-[var(--text-secondary)] hover:bg-white hover:border-black hover:shadow-[4px_4px_0px_#000] hover:text-black dark:hover:bg-zinc-900 dark:hover:text-white dark:hover:border-white dark:hover:shadow-[4px_4px_0px_#ffffff]'}`}>
              <Home size={18} />
              <span>Dashboard</span>
            </Link>
          </div>

          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-2">
              <h3 className="px-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-3 opacity-60 font-display">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => (
                  <NavItem key={item.path} item={item} index={itemIdx + groupIdx} isActive={location.pathname === item.path} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t-2 border-black bg-[var(--bg-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-black flex items-center justify-center overflow-hidden">
              <img src="/assets/testimonial_profile_real.png" alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--text-primary)]">Guest User</p>
              <p className="text-xs text-[var(--text-secondary)]">Local Account</p>
            </div>
            <Settings size={18} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors" />
          </div>
        </div>
      </aside>

      {/* --- Mobile Header --- */}
      <div className="md:hidden fixed top-0 w-full z-50 bg-[var(--bg-secondary)] border-b-2 border-black h-18 flex items-center justify-between px-4 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-primary)] text-white flex items-center justify-center border-2 border-transparent">
            <Wrench size={20} strokeWidth={2.5} />
          </div>
          <span className="font-display font-black text-xl tracking-tighter uppercase">my<span className="text-[var(--accent-primary)]">Tools</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center text-[var(--text-primary)] hover:bg-black hover:text-white transition-all active:translate-y-1 shadow-[2px_2px_0px_#000]">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Menu size={28} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* --- Desktop Top Right Action Bar (Theme Toggle) --- */}
      <div className="hidden md:flex fixed top-6 right-8 z-50 items-center gap-4">
        <div className="flex items-center gap-3 bg-[var(--bg-secondary)]/80 backdrop-blur-md p-1.5 rounded-full border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-y-[2px] transition-all">
          <button
            onClick={() => setIsDark(false)}
            className={`p-2 rounded-full transition-all ${!isDark ? 'bg-brand-yellow text-black border-2 border-black shadow-sm scale-110' : 'text-[var(--text-primary)]'}`}
          >
            <Sun size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setIsDark(true)}
            className={`p-2 rounded-full transition-all ${isDark ? 'bg-zinc-800 text-white border-2 border-black shadow-sm scale-110' : 'text-[var(--text-primary)] hover:opacity-70'}`}
          >
            <Moon size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* --- Main Content --- */}
      <main className="flex-1 md:pl-72 pt-20 md:pt-0 min-h-screen relative overflow-x-hidden bg-[var(--bg-primary)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={location.pathname === '/' ? 'w-full' : 'max-w-7xl mx-auto px-6 lg:px-12 py-10 md:py-16'}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* --- Minimalist Mobile Menu --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-[var(--bg-primary)] z-[70] shadow-2xl border-l-4 border-black p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10 border-b-2 border-black/10 pb-4">
                <span className="font-black text-2xl font-display uppercase tracking-tighter">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-black hover:text-white rounded-lg transition-colors border-2 border-transparent hover:border-black"><X size={28} /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-8">
                {navGroups.map((g, i) => (
                  <div key={i}>
                    <h3 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4 opacity-50">{g.title}</h3>
                    <div className="space-y-2">
                      {g.items.map((item, idx) => (
                        <Link
                          key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent hover:border-black hover:shadow-[4px_4px_0px_#000] hover:bg-brand-yellow hover:text-black dark:hover:bg-zinc-900 dark:hover:text-white dark:hover:border-white dark:hover:shadow-[4px_4px_0px_#ffffff] transition-all font-bold text-lg"
                        >
                          <item.icon size={20} />
                          <span>{item.name}</span>
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