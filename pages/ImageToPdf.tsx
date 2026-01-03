import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { X, ArrowUp, ArrowDown, FileDown, Loader2 } from 'lucide-react';
import { FileWithPreview } from '../types';

const ImageToPdf: React.FC = () => {
  const [images, setImages] = useState<FileWithPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = (files: File[]) => {
    const newImages = files.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview!);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= images.length) return;
    setImages(prev => {
      const newImages = [...prev];
      const temp = newImages[index];
      newImages[index] = newImages[index + direction];
      newImages[index + direction] = temp;
      return newImages;
    });
  };

  const convertToPdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      // @ts-ignore - Loaded via CDN
      const { PDFDocument } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();

      for (const image of images) {
        const imageBytes = await image.arrayBuffer();
        let pdfImage;
        
        if (image.type === 'image/jpeg') {
          pdfImage = await pdfDoc.embedJpg(imageBytes);
        } else {
          pdfImage = await pdfDoc.embedPng(imageBytes);
        }

        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pdfImage.width,
          height: pdfImage.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'converted-images.pdf';
      link.click();
    } catch (error) {
      console.error('Error creating PDF:', error);
      alert('Failed to create PDF. Please ensure files are valid JPG/PNG.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Image to PDF</h1>
        <p className="text-slate-500 mt-2">Convert JPG and PNG images to PDF instantly.</p>
      </div>

      {images.length === 0 ? (
        <FileUploader 
          onFilesSelected={handleFiles} 
          accept="image/png, image/jpeg, image/jpg" 
          multiple
          title="Drop your images here"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div key={img.id} className="relative group bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                <img 
                  src={img.preview} 
                  alt="preview" 
                  className="w-full h-32 object-cover rounded-lg bg-slate-100" 
                />
                <div className="absolute top-1 right-1 flex gap-1">
                  <button 
                    onClick={() => removeImage(idx)}
                    className="p-1 bg-white rounded-full shadow-md text-slate-600 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex justify-center mt-2 gap-2">
                  <button 
                    onClick={() => moveImage(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                  >
                    <ArrowUp size={16} className="rotate-[-90deg]" />
                  </button>
                  <span className="text-xs font-mono py-1.5 text-slate-400">{idx + 1}</span>
                  <button 
                    onClick={() => moveImage(idx, 1)}
                    disabled={idx === images.length - 1}
                    className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                  >
                    <ArrowDown size={16} className="rotate-[-90deg]" />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl min-h-[160px]">
              <label className="cursor-pointer flex flex-col items-center p-4 text-slate-400 hover:text-indigo-600 transition-colors">
                <span className="text-2xl font-bold">+</span>
                <span className="text-sm">Add more</span>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/png, image/jpeg" 
                  onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))} 
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t pt-6">
             <button 
              onClick={() => setImages([])}
              className="px-4 py-2 text-slate-600 hover:text-red-600 font-medium transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={convertToPdf}
              disabled={isProcessing}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Processing...
                </>
              ) : (
                <>
                  <FileDown size={20} /> Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageToPdf;