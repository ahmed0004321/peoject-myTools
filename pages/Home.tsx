import React from 'react';
import {
  FileImage, Layers, ImageMinus, PenTool, Combine,
  Settings, Archive, QrCode, RefreshCcw, ShieldCheck, Lock,
  Keyboard, FileText, Sparkles
} from 'lucide-react';
import HeroSection from '../components/ui/HeroSection';
import SectionHeader from '../components/ui/SectionHeader';
import ToolCard from '../components/ui/ToolCard';
import AhaSection from '../components/ui/AhaSection';

// --- Data ---
const ALL_TOOLS = [
  // --- Original Featured ---
  { name: "AI Content Check", icon: Sparkles, path: "/content-detector", description: "Plagiarism & AI Detection.", color: "#10b981", textColor: "text-black" }, // Emerald-500
  { name: "Document Scanner", icon: PenTool, path: "/document-scanner", description: "OCR & Document enhancement.", color: "#fef3c7", textColor: "text-black" }, // Cream
  { name: "Note Generator", icon: FileText, path: "/note-generator", description: "Write & export notes.", color: "#06b6d4", textColor: "text-black" }, // Cyan
  { name: "Image Toolkit", icon: Settings, path: "/image-toolkit", description: "Batch process & resize.", color: "#f472b6", textColor: "text-black" }, // Pink-400
  { name: "Secure Vault", icon: ShieldCheck, path: "/secure-vault", description: "AES-256 local storage.", color: "#ef4444", textColor: "text-white" }, // Red-500
  { name: "Typing Train", icon: Keyboard, path: "/typing-test", description: "Master precision.", color: "#f97316", textColor: "text-black" }, // Orange-500
  { name: "PDF Merge", icon: Combine, path: "/merge-pdf", description: "Combine docs easily.", color: "#a855f7", textColor: "text-white" }, // Purple-500
  { name: "Converter", icon: RefreshCcw, path: "/converter", description: "Universal file convert.", color: "#eab308", textColor: "text-black" }, // Yellow-500

  // --- Promoted Utilities ---
  { name: "Pass Gen", icon: ShieldCheck, path: "/password-tool", description: "Strong passwords instantly.", color: "#3b82f6", textColor: "text-white" }, // Blue-500
  { name: "Pass Manager", icon: Lock, path: "/password-manager", description: "Secure local vault.", color: "#6366f1", textColor: "text-white" }, // Indigo-500
  { name: "Hash Gen", icon: Layers, path: "/hash-generator", description: "Cryptographic hashing.", color: "#2dd4bf", textColor: "text-black" }, // Teal-400
  { name: "QR Batch", icon: QrCode, path: "/qr-batch", description: "Generate codes in bulk.", color: "#a3e635", textColor: "text-black" }, // Lime-400
  { name: "Format", icon: FileText, path: "/text-formatter", description: "Prettify code & JSON.", color: "#fbbf24", textColor: "text-black" }, // Amber-400
  { name: "Markdown", icon: FileText, path: "/markdown-preview", description: "Live preview editor.", color: "#fb7185", textColor: "text-black" }, // Rose-400
  { name: "Flashcards", icon: Layers, path: "/flashcards", description: "Study with ease.", color: "#c084fc", textColor: "text-black" }, // Violet-400
  { name: "Img to PDF", icon: FileImage, path: "/image-to-pdf", description: "Convert images to docs.", color: "#34d399", textColor: "text-black" }, // Emerald-400
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
        <p>&copy; {new Date().getFullYear()} OmniTools Professional. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;