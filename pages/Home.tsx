import React from 'react';
import {
  FileImage, Layers, ImageMinus, PenTool, Combine,
  Settings, QrCode, RefreshCcw, ShieldCheck, Lock,
  Keyboard, FileText, Sparkles, Palette, Zap, Presentation
} from 'lucide-react';
import HeroSection from '../components/ui/HeroSection';
import SectionHeader from '../components/ui/SectionHeader';
import ToolCard from '../components/ui/ToolCard';
import AhaSection from '../components/ui/AhaSection';

// --- Data ---
const ALL_TOOLS = [
  // --- PDF & Document Tools ---
  { name: "PPTX to PDF", icon: Presentation, path: "/pptx-to-pdf", description: "Convert Slides to PDF.", color: "#f97316", textColor: "text-black" }, // Orange-500
  { name: "PDF to Image", icon: FileImage, path: "/pdf-to-image", description: "Extract pages as images.", color: "#8b5cf6", textColor: "text-white" }, // Violet-500
  { name: "Img to PDF", icon: ImageMinus, path: "/image-to-pdf", description: "Convert images to docs.", color: "#10b981", textColor: "text-black" }, // Emerald-500
  { name: "PDF Merge", icon: Combine, path: "/merge-pdf", description: "Combine docs easily.", color: "#a855f7", textColor: "text-white" }, // Purple-500
  { name: "Doc Scanner", icon: PenTool, path: "/document-scanner", description: "OCR & Cleanup.", color: "#fef3c7", textColor: "text-black" }, // Cream
  { name: "Archive Tool", icon: Layers, path: "/compress-tool", description: "Zip & Compress files.", color: "#f97316", textColor: "text-black" }, // Orange-500
  { name: "Note Gen", icon: FileText, path: "/note-generator", description: "Write & export notes.", color: "#06b6d4", textColor: "text-black" }, // Cyan

  // --- Image & Media Tools ---
  { name: "Image Studio", icon: Palette, path: "/image-editor", description: "Crop, Resize & Edit.", color: "#ec4899", textColor: "text-white" }, // Pink-500
  { name: "Img Sharpener", icon: Zap, path: "/image-sharpener", description: "AI-Grade Detail Boost.", color: "#f472b6", textColor: "text-black" }, // Pink-400
  { name: "Converter", icon: RefreshCcw, path: "/converter", description: "Universal file convert.", color: "#eab308", textColor: "text-black" }, // Yellow-500

  // --- Security & Privacy ---
  { name: "Secure Vault", icon: ShieldCheck, path: "/secure-vault", description: "AES-256 local storage.", color: "#ef4444", textColor: "text-white" }, // Red-500
  { name: "Pass Gen", icon: ShieldCheck, path: "/password-tool", description: "Strong passwords.", color: "#3b82f6", textColor: "text-white" }, // Blue-500
  { name: "Pass Manager", icon: Lock, path: "/password-manager", description: "Secure local vault.", color: "#6366f1", textColor: "text-white" }, // Indigo-500
  { name: "Hash Gen", icon: Layers, path: "/hash-generator", description: "Cryptographic hashing.", color: "#2dd4bf", textColor: "text-black" }, // Teal-400

  // --- Web & Text Utilities ---
  { name: "QR Generator", icon: QrCode, path: "/qr-tool", description: "Custom QR codes.", color: "#84cc16", textColor: "text-black" }, // Lime-500
  { name: "QR Batch", icon: QrCode, path: "/qr-batch", description: "Generate in bulk.", color: "#a3e635", textColor: "text-black" }, // Lime-400
  { name: "AI Detect", icon: Sparkles, path: "/content-detector", description: "Plagiarism & AI Check.", color: "#14b8a6", textColor: "text-black" }, // Teal-500
  { name: "Text Format", icon: FileText, path: "/text-formatter", description: "Prettify code & JSON.", color: "#fbbf24", textColor: "text-black" }, // Amber-400
  { name: "Markdown", icon: FileText, path: "/markdown-preview", description: "Live preview editor.", color: "#fb7185", textColor: "text-black" }, // Rose-400

];

const Home: React.FC = () => {
  return (
    <div className="bg-background min-h-screen animate-fade-in font-sans">

      {/* Hero Section */}
      <HeroSection />

      {/* Main Tools Grid */}
      <section id="tools" className="bg-background relative z-10 py-20 border-t border-border">

        <SectionHeader
          title="Feed Your Developer Brain"
          subtitle="Our tools are the ultimate brain food"
        />

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ALL_TOOLS.map((tool, idx) => (
              <ToolCard key={idx} {...tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Aha Moment Section */}
      <AhaSection />

      {/* Footer */}
      <footer className="py-12 text-center text-secondary/40 text-sm border-t border-white/5">
        <p>&copy; {new Date().getFullYear()} myTools Professional. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;