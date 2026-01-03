import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { Loader2, Download, Archive, RefreshCw } from 'lucide-react';

const PdfToImage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pages, setPages] = useState<string[]>([]);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">PDF to Image</h1>
        <p className="text-slate-500 mt-2">Convert each page of your PDF into high-quality PNGs.</p>
      </div>

      {!file && (
        <FileUploader 
          onFilesSelected={handleFile} 
          accept="application/pdf" 
          title="Drop your PDF here"
        />
      )}

      {file && (
        <div className="space-y-8">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold">
                PDF
              </div>
              <div>
                <p className="font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={() => { setFile(null); setPages([]); }}
              className="text-sm text-slate-500 hover:text-red-500 font-medium px-3 py-1 hover:bg-red-50 rounded-md transition-colors"
            >
              Change File
            </button>
          </div>

          {isProcessing ? (
            <div className="text-center py-20">
               <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
               <p className="text-lg font-medium text-slate-700">Extracting pages...</p>
               <p className="text-slate-500">This might take a moment for large files.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold text-slate-900">Extracted Pages ({pages.length})</h3>
                 <button 
                   onClick={downloadAll}
                   className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                 >
                   <Archive size={18} /> Download ZIP
                 </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {pages.map((imgSrc, idx) => (
                  <div key={idx} className="group relative bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-slate-100">
                      <img src={imgSrc} alt={`Page ${idx + 1}`} className="w-full h-full object-contain" />
                    </div>
                    <div className="mt-3 flex items-center justify-between px-1">
                      <span className="text-sm font-medium text-slate-600">Page {idx + 1}</span>
                      <a 
                        href={imgSrc} 
                        download={`page-${idx + 1}.png`}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
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
  );
};

export default PdfToImage;