import React, { useState } from 'react';
import { X, ArrowUp, ArrowDown, Combine, Loader2, FileText, Upload, Plus } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

interface PdfFile {
  file: File;
  id: string;
}

const MergePdf: React.FC = () => {
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = (files: File[]) => {
    // Basic validation
    const validFiles = files.filter(f => f.type === 'application/pdf');
    if (validFiles.length !== files.length) {
      alert("Some files were skipped because they are not PDFs.");
    }

    const newPdfs = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7)
    }));

    setPdfs(prev => [...prev, ...newPdfs]);
  };

  const removePdf = (index: number) => {
    setPdfs(prev => {
      const newPdfs = [...prev];
      newPdfs.splice(index, 1);
      return newPdfs;
    });
  };

  const movePdf = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= pdfs.length) return;
    setPdfs(prev => {
      const newPdfs = [...prev];
      const temp = newPdfs[index];
      newPdfs[index] = newPdfs[index + direction];
      newPdfs[index + direction] = temp;
      return newPdfs;
    });
  };

  const mergeFiles = async () => {
    if (pdfs.length < 2) {
      alert("Please select at least 2 PDF files to merge.");
      return;
    }
    setIsProcessing(true);

    try {
      // @ts-ignore
      const { PDFDocument } = window.PDFLib;
      const mergedPdf = await PDFDocument.create();

      for (const pdfItem of pdfs) {
        const arrayBuffer = await pdfItem.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page: any) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `merged-document-${Date.now()}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error merging PDF:', error);
      alert('Failed to merge PDFs. One of the files might be encrypted or corrupted.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 ">
      <SectionHeader
        title="PDF Merger"
        subtitle="Combine multiple PDF documents into a single file."
      />

      <div className={`max-w-4xl mx-auto px-4 ${pdfs.length === 0 ? 'max-w-3xl' : ''}`}>
        {pdfs.length === 0 ? (
          /* Initial State */
          <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl text-center space-y-8 ">
            <div className="space-y-6">
              <div className="w-24 h-24 bg-brand-purple/10 text-brand-purple rounded-full flex items-center justify-center mx-auto mb-6">
                <Combine size={48} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Merge PDF Files</h3>
                <p className="text-secondary">Combine multiple documents into one organized PDF.</p>
              </div>

              <label className="inline-flex items-center gap-3 px-8 py-4 bg-purple-600 text-white rounded-xl font-bold text-lg cursor-pointer hover:bg-purple-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20">
                <Upload size={24} />
                Select PDFs
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  multiple
                  onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                />
              </label>
            </div>
          </div>
        ) : (
          /* Workspace State */
          <div className="space-y-8 ">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-bold text-primary">Files to Merge ({pdfs.length})</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setPdfs([])}
                  className="text-secondary hover:text-red-500 font-bold text-sm transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={mergeFiles}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-wait"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Combine size={18} />}
                  Merge PDFs
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {pdfs.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between bg-surface p-4 rounded-xl shadow-sm border border-border hover:border-brand-purple/50 transition-colors">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <span className="w-6 text-center font-mono text-sm text-secondary text-opacity-50">{idx + 1}</span>
                    <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-primary truncate">{item.file.name}</p>
                      <p className="text-xs text-secondary">{(item.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 mr-2 border border-border">
                      <button
                        onClick={() => movePdf(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm rounded-md disabled:opacity-30 transition-all text-secondary"
                        title="Move Up"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => movePdf(idx, 1)}
                        disabled={idx === pdfs.length - 1}
                        className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm rounded-md disabled:opacity-30 transition-all text-secondary"
                        title="Move Down"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => removePdf(idx)}
                      className="p-2 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add More Button */}
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-brand-purple hover:bg-brand-purple/5 transition-all group text-secondary hover:text-brand-purple gap-2 font-bold">
                <Plus size={20} />
                Add more PDFs
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  multiple
                  onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MergePdf;