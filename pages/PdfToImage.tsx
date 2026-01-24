import React, { useState } from 'react';
import { Loader2, Download, Archive, FileText, Upload } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

const PdfToImage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pages, setPages] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      processPdf(files[0]);
    }
  };

  const processPdf = async (pdfFile: File) => {
    setIsProcessing(true);
    setPages([]);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      // @ts-ignore
      const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;

      const newPages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality scale

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context!,
          viewport: viewport
        }).promise;

        newPages.push(canvas.toDataURL('image/png'));
      }

      setPages(newPages);
    } catch (err) {
      console.error(err);
      alert("Error reading PDF. Please try another file.");
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = async () => {
    // @ts-ignore
    const zip = new window.JSZip();

    pages.forEach((dataUrl, idx) => {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      zip.file(`page-${idx + 1}.png`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "converted-pages.zip";
    link.click();
  };

  return (
    <div className="min-h-screen bg-background pb-20 ">
      <SectionHeader
        title="PDF to Image Converter"
        subtitle="Extract every page as a high-quality image."
      />

      <div className={`max-w-6xl mx-auto px-4 ${!file ? 'max-w-3xl' : ''}`}>
        {!file ? (
          /* Initial State: Standard Centered Card */
          <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl text-center space-y-8 ">
            <div className="space-y-6">
              <div className="w-24 h-24 bg-brand-purple/10 text-brand-purple rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={48} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Upload PDF Document</h3>
                <p className="text-secondary">Convert entire PDF documents into separate image files.</p>
              </div>

              <label className="inline-flex items-center gap-3 px-8 py-4 bg-purple-600 text-white rounded-xl font-bold text-lg cursor-pointer hover:bg-purple-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20">
                <Upload size={24} />
                Select PDF
                <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
              </label>

              <p className="text-xs text-secondary/60 pt-4">
                *Processing happens locally. Large files may take a moment.
              </p>
            </div>
          </div>
        ) : (
          /* Workspace State */
          <div className="space-y-8 ">
            {/* Toolbar / Status */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                  PDF
                </div>
                <div>
                  <p className="font-bold text-primary truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-secondary opacity-70">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setFile(null); setPages([]); }}
                  className="px-4 py-2 text-secondary font-bold hover:text-primary transition-colors text-sm"
                >
                  Cancel
                </button>
                {pages.length > 0 && (
                  <button
                    onClick={downloadAll}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20"
                  >
                    <Archive size={18} /> Download ZIP
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            {isProcessing ? (
              <div className="text-center py-20 bg-surface border border-border rounded-3xl shadow-sm">
                <Loader2 className="animate-spin text-brand-purple mx-auto mb-6" size={48} />
                <h3 className="text-xl font-bold text-primary mb-2">Extracting Pages...</h3>
                <p className="text-secondary">Please wait while we process your document.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-xl font-bold text-primary">Extracted Pages ({pages.length})</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {pages.map((imgSrc, idx) => (
                    <div key={idx} className="group relative bg-surface p-3 rounded-2xl border border-border hover:border-brand-purple transition-all hover:shadow-lg">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-border/50">
                        <img src={imgSrc} alt={`Page ${idx + 1}`} className="w-full h-full object-contain" />
                      </div>
                      <div className="mt-3 flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-secondary opacity-50 uppercase tracking-widest">Page {idx + 1}</span>
                        <a
                          href={imgSrc}
                          download={`page-${idx + 1}.png`}
                          className="p-2 text-secondary hover:text-brand-purple hover:bg-brand-purple/10 rounded-lg transition-all"
                          title="Download Image"
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfToImage;