import React, { useRef, useState } from 'react';
import { Upload, X, FileText, ImageIcon, Music, Video, File as FileIcon } from 'lucide-react';
import Button from './ui/Button';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  accept,
  multiple = false,
  title = "Drop your files here",
  subtitle = "or click to browse"
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      // Reset input value to allow selecting same file again
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
        group flex flex-col items-center justify-center min-h-[300px]
        ${isDragging
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.02]'
          : 'border-slate-300 dark:border-[var(--border-color)] hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-white/5 bg-white dark:bg-black/20'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Upload size={32} />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto mb-6">{subtitle}</p>
      <Button variant="primary" className="px-6 py-3">
        Select Files
      </Button>
      <p className="mt-4 text-xs text-slate-400 uppercase tracking-wide">
        {accept.replace(/\./g, ' ').toUpperCase()}
      </p>
    </div>
  );
};

export default FileUploader;