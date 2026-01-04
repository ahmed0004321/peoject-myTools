import React, { useState, useRef, useEffect, useCallback } from 'react';
import FileUploader from '../components/FileUploader';
import {
  MousePointer, Type, Square, Circle as CircleIcon, Image as ImageIcon,
  Eraser, Save, Layers, ZoomIn, ZoomOut, ChevronUp, ChevronDown,
  Trash2, Move, GripVertical, Check, X, RotateCw, Copy, FilePlus,
  Undo, Redo, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Plus
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// --- Types ---
type EditorMode = 'select' | 'text' | 'rect' | 'circle' | 'image' | 'whiteout' | 'draw';

interface PageObject {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'image' | 'path' | 'whiteout';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  src?: string;
  points?: { x: number, y: number }[];
}

interface PageData {
  id: string;
  sourceId: string;
  sourcePageIndex: number;
  thumbnail: string;
  width: number;
  height: number;
  rotation: number;
  objects: PageObject[];
}

interface SourceFile {
  id: string;
  data: ArrayBuffer;
  name: string;
  type: 'pdf' | 'image';
}

const FONTS = ['Helvetica', 'Times-Roman', 'Courier', 'Symbol'];

const PdfEditor: React.FC = () => {
  const [sources, setSources] = useState<SourceFile[]>([]);
  const [history, setHistory] = useState<PageData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [pages, setPages_Raw] = useState<PageData[]>([]);

  const setPages = (newPagesOrFn: PageData[] | ((prev: PageData[]) => PageData[])) => {
    setPages_Raw(prev => {
      const next = typeof newPagesOrFn === 'function' ? newPagesOrFn(prev) : newPagesOrFn;
      if (historyIndex === -1 || JSON.stringify(next) !== JSON.stringify(history[historyIndex])) {
        const newHist = history.slice(0, historyIndex + 1);
        newHist.push(next);
        if (newHist.length > 20) newHist.shift();
        setHistory(newHist);
        setHistoryIndex(newHist.length - 1);
      }
      return next;
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setPages_Raw(history[prevIndex]);
    }
  };
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setPages_Raw(history[nextIndex]);
    }
  };

  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.8);
  const [mode, setMode] = useState<EditorMode>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeColor, setActiveColor] = useState('#4f46e5');
  const [activeFill, setActiveFill] = useState('transparent');
  const [activeFontSize, setActiveFontSize] = useState(16);
  const [activeFont, setActiveFont] = useState('Helvetica');

  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    setStatus("Importing...");
    try {
      const newSources: SourceFile[] = [];
      const newPages: PageData[] = [];

      for (const f of files) {
        const ab = await f.arrayBuffer();
        const sourceId = Math.random().toString(36).substr(2, 9);
        if (f.type === 'application/pdf') {
          newSources.push({ id: sourceId, data: ab, name: f.name, type: 'pdf' });
          const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1 });
            const canvas = document.createElement('canvas');
            const thumbScale = 300 / viewport.width;
            canvas.width = 300;
            canvas.height = viewport.height * thumbScale;
            await page.render({ canvasContext: canvas.getContext('2d')!, viewport: page.getViewport({ scale: thumbScale }), canvas }).promise;

            newPages.push({
              id: Math.random().toString(36).substr(2, 9),
              sourceId,
              sourcePageIndex: i - 1,
              thumbnail: canvas.toDataURL(),
              width: viewport.width,
              height: viewport.height,
              rotation: 0,
              objects: []
            });
          }
        }
      }
      setSources(prev => [...prev, ...newSources]);
      setPages(prev => {
        const next = [...prev, ...newPages];
        if (!activePageId && next.length > 0) setActivePageId(next[0].id);
        return next;
      });
    } catch (e) {
      console.error(e);
      alert("Error loading files");
    } finally {
      setStatus(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (mode === 'select' && (e.target === containerRef.current)) {
      setSelectedIds([]);
    }
    if (['rect', 'circle', 'text', 'whiteout'].includes(mode)) {
      if (!activePageId) return;
      const rect = containerRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const newObj: PageObject = {
        id: Math.random().toString(36).substr(2, 9),
        type: mode as any,
        x, y: y - (mode === 'text' ? 10 : 0),
        width: mode === 'text' ? 150 : 100,
        height: mode === 'text' ? 24 : 100,
        rotation: 0,
        fill: mode === 'whiteout' ? '#ffffff' : activeFill,
        stroke: mode === 'whiteout' ? 'transparent' : activeColor,
        strokeWidth: mode === 'whiteout' ? 0 : 2,
        text: mode === 'text' ? 'New Text' : undefined,
        fontSize: activeFontSize,
        fontFamily: activeFont
      };

      setPages(cur => cur.map(p => p.id === activePageId ? { ...p, objects: [...p.objects, newObj] } : p));
      setSelectedIds([newObj.id]);
      setMode('select');
    }
  };

  const updateObject = (id: string, patch: Partial<PageObject>) => {
    if (!activePageId) return;
    setPages(cur => cur.map(p => p.id === activePageId ? { ...p, objects: p.objects.map(o => o.id === id ? { ...o, ...patch } : o) } : p));
  };

  const deleteSelected = () => {
    if (!activePageId) return;
    setPages(cur => cur.map(p => p.id === activePageId ? { ...p, objects: p.objects.filter(o => !selectedIds.includes(o.id)) } : p));
    setSelectedIds([]);
  };

  const activePage = pages.find(p => p.id === activePageId);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] luxe-card overflow-hidden">
      {/* Main Toolbar */}
      <div className="glass-toolbar p-3 flex items-center justify-between z-40 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-4">
          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
            {[
              { id: 'select', icon: MousePointer, title: 'Select' },
              { id: 'text', icon: Type, title: 'Text' },
              { id: 'whiteout', icon: Eraser, title: 'Whiteout' },
              { id: 'rect', icon: Square, title: 'Rectangle' },
              { id: 'circle', icon: CircleIcon, title: 'Circle' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setMode(item.id as any)}
                className={`p-2.5 rounded-lg transition-all ${mode === item.id ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                title={item.title}
              >
                <item.icon size={18} />
              </button>
            ))}
          </div>

          <div className="flex gap-1">
            <button onClick={undo} disabled={historyIndex <= 0} className="p-2.5 rounded-lg hover:bg-white/5 disabled:opacity-20 transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Undo"><Undo size={18} /></button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2.5 rounded-lg hover:bg-white/5 disabled:opacity-20 transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Redo"><Redo size={18} /></button>
          </div>

          <AnimatePresence>
            {mode === 'text' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 gap-3 items-center text-xs">
                <select value={activeFont} onChange={e => setActiveFont(e.target.value)} className="bg-transparent outline-none font-medium text-[var(--text-primary)]">
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="w-px h-4 bg-[var(--border-color)]" />
                <input type="number" value={activeFontSize} onChange={e => setActiveFontSize(Number(e.target.value))} className="w-10 text-center bg-transparent outline-none font-bold" />
                <input type="color" value={activeColor} onChange={e => setActiveColor(e.target.value)} className="w-5 h-5 rounded-full cursor-pointer border-none p-0 overflow-hidden" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-1">
            <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-1.5 hover:bg-white/5 rounded-lg text-[var(--text-secondary)] transition-colors"><ZoomOut size={16} /></button>
            <span className="text-[10px] font-bold w-12 text-center text-[var(--text-secondary)]">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-1.5 hover:bg-white/5 rounded-lg text-[var(--text-secondary)] transition-colors"><ZoomIn size={16} /></button>
          </div>
          <Button variant="primary" onClick={() => { }} disabled={!!status} size="sm">
            <Save size={16} className="mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Context Sidebar (Pages) */}
        <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col z-10 overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-md">
            <span className="font-bold text-[10px] uppercase tracking-widest opacity-40">Pages</span>
            <div className="flex gap-1">
              <FileUploader onFilesSelected={handleFiles} accept=".pdf" title="" />
              <button className="p-2 hover:bg-[var(--accent-primary)] hover:text-white rounded-lg transition-colors text-[var(--accent-primary)]" onClick={() => {
                const newPage: PageData = {
                  id: Math.random().toString(36).substr(2, 9),
                  sourceId: 'blank', sourcePageIndex: 0,
                  thumbnail: '', width: 595, height: 842, rotation: 0, objects: []
                };
                setPages(prev => [...prev, newPage]);
                setActivePageId(newPage.id);
              }} title="Add Blank Page"><Plus size={16} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <Reorder.Group axis="y" values={pages} onReorder={setPages}>
              {pages.map((p, i) => (
                <Reorder.Item key={p.id} value={p}
                  className={`relative group p-2.5 rounded-2xl border cursor-pointer transition-all ${activePageId === p.id ? 'bg-[var(--accent-primary)] border-transparent shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-white/5 border-[var(--border-color)] hover:border-[var(--accent-secondary)]'}`}
                  onClick={() => setActivePageId(p.id)}
                >
                  <div className="flex gap-3 items-center">
                    <span className={`text-[10px] font-bold w-4 ${activePageId === p.id ? 'text-white' : 'text-[var(--text-secondary)]/30'}`}>{i + 1}</span>
                    <div className="flex-1 aspect-[3/4] bg-slate-100 dark:bg-black/20 rounded-lg overflow-hidden flex items-center justify-center border border-black/5">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : <div className="text-[10px] opacity-20 italic">Blank</div>}
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setPages(curr => curr.filter(x => x.id !== p.id)) }} className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"><Trash2 size={13} /></button>
                      <button onClick={(e) => { e.stopPropagation(); /* Duplicate */ }} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"><Copy size={13} /></button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 bg-[var(--bg-primary)] overflow-auto flex items-center justify-center p-12 relative pattern-dots">
          {activePage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              ref={containerRef}
              className="bg-white shadow-2xl relative"
              style={{
                width: activePage.width * scale,
                height: activePage.height * scale,
                transition: 'width 0.2s ease, height 0.2s ease'
              }}
              onClick={handleCanvasClick}
            >
              {activePage.thumbnail && (
                <PageRenderer page={activePage} source={sources.find(s => s.id === activePage.sourceId)} scale={scale} />
              )}

              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Overlay for grid if needed */}
              </div>

              {activePage.objects.map(obj => (
                <CanvasObject
                  key={obj.id}
                  obj={obj}
                  scale={scale}
                  isSelected={selectedIds.includes(obj.id)}
                  onSelect={(multi) => setSelectedIds(multi ? [...selectedIds, obj.id] : [obj.id])}
                  onChange={(patch) => updateObject(obj.id, patch)}
                />
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center text-[var(--text-secondary)]/20 animate-pulse">
              <Layers size={80} strokeWidth={1} />
              <p className="mt-4 font-bold text-sm tracking-widest uppercase">Import PDF to start</p>
            </div>
          )}

          {/* Floating Contextual Actions */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-8 glass p-2 rounded-2xl flex items-center gap-3 shadow-2xl z-50 border border-white/20"
              >
                <button onClick={deleteSelected} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={20} /></button>
                <div className="w-px h-6 bg-[var(--border-color)]" />
                <div className="px-4 text-xs font-bold text-[var(--text-primary)] opacity-60">{selectedIds.length} Selected</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const CanvasObject: React.FC<{
  obj: PageObject,
  scale: number,
  isSelected: boolean,
  onSelect: (multi: boolean) => void,
  onChange: (patch: Partial<PageObject>) => void
}> = ({ obj, scale, isSelected, onSelect, onChange }) => {

  // Drag Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(e.shiftKey);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = obj.x;
    const initialY = obj.y;

    const onMove = (mv: MouseEvent) => {
      const dx = (mv.clientX - startX) / scale;
      const dy = (mv.clientY - startY) / scale;
      onChange({ x: initialX + dx, y: initialY + dy });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Resize Logic
  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialW = obj.width || 0;
    const initialH = obj.height || 0;

    const onMove = (mv: MouseEvent) => {
      const dx = (mv.clientX - startX) / scale;
      const dy = (mv.clientY - startY) / scale;
      onChange({ width: Math.max(10, initialW + dx), height: Math.max(10, initialH + dy) });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: obj.x * scale,
    top: obj.y * scale,
    width: (obj.width || 0) * scale,
    height: (obj.height || 0) * scale,
    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid transparent',
    cursor: 'move',
    transform: `rotate(${obj.rotation}deg)`,
    transformOrigin: 'center center',
    zIndex: isSelected ? 30 : 20,
    boxSizing: 'content-box'
  };

  if (obj.type === 'text') {
    style.height = 'auto';
    style.fontSize = (obj.fontSize || 12) * scale;
    style.fontFamily = obj.fontFamily;
    style.color = obj.stroke;
    style.whiteSpace = 'pre-wrap';
    style.padding = '4px';
  } else if (obj.type === 'whiteout') {
    style.backgroundColor = '#ffffff';
  } else {
    style.backgroundColor = obj.fill;
    style.border = `${(obj.strokeWidth || 0) * scale}px solid ${obj.stroke}`;
  }

  return (
    <div
      style={style}
      onMouseDown={handleMouseDown}
      className={`transition-shadow ${isSelected ? 'shadow-xl' : ''}`}
    >
      {obj.type === 'text' ? (
        <div
          contentEditable={isSelected}
          suppressContentEditableWarning
          onBlur={(e) => onChange({ text: e.currentTarget.innerText })}
          className="outline-none min-w-[20px] transition-all"
          style={{ cursor: isSelected ? 'text' : 'move' }}
          onMouseDown={(e) => isSelected && e.stopPropagation()}
        >
          {obj.text}
        </div>
      ) : null}

      {isSelected && obj.type !== 'text' && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 bg-white border-2 border-indigo-600 -translate-x-1/2 -translate-y-1/2 rounded-full" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-white border-2 border-indigo-600 translate-x-1/2 -translate-y-1/2 rounded-full" />
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-white border-2 border-indigo-600 -translate-x-1/2 translate-y-1/2 rounded-full" />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-600 translate-x-1/2 translate-y-1/2 rounded-full cursor-nwse-resize shadow-md"
            onMouseDown={handleResize}
          />
        </>
      )}
    </div>
  );
};

const PageRenderer: React.FC<{ page: PageData, scale: number, source?: SourceFile }> = ({ page, scale, source }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!source || !canvasRef.current) return;
    const render = async () => {
      // @ts-ignore
      if (source.type === 'pdf') {
        const pdf = await pdfjsLib.getDocument({ data: source.data }).promise;
        const p = await pdf.getPage(page.sourcePageIndex + 1);
        const viewport = p.getViewport({ scale: scale * 2 }); // Higher resolution internal render
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await p.render({ canvasContext: ctx!, viewport, canvas }).promise;
      }
    };
    render();
  }, [page, source, scale]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export default PdfEditor;