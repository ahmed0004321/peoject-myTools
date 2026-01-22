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
  { name: "Archive Tool", icon: Layers, path: "/compress-tool", description: "Zip & Compress files.", color: "#f97316", textColor: "text-black" }, // Orange-500

  // --- Image & Media Tools ---
  { name: "Image Studio", icon: Palette, path: "/image-editor", description: "Crop, Resize & Edit.", color: "#ec4899", textColor: "text-white" }, // Pink-500
  { name: "AI Upscaler", icon: Zap, path: "/image-sharpener", description: "Enhance image quality.", color: "#facc15", textColor: "text-black" }, // Yellow-400
  { name: "Converter", icon: RefreshCcw, path: "/converter", description: "Change file formats.", color: "#3b82f6", textColor: "text-white" }, // Blue-500

  // --- Security Tools ---
  { name: "Pass Manager", icon: ShieldCheck, path: "/password-manager", description: "Secure your passwords.", color: "#10b981", textColor: "text-black" }, // Emerald-500
  { name: "Lock System", icon: Lock, path: "/lock-system", description: "Protect your data.", color: "#ef4444", textColor: "text-white" }, // Red-500
  { name: "Deep Clean", icon: Layers, path: "/cleaner", description: "Remove metadata.", color: "#6b7280", textColor: "text-white" }, // Gray-500

  // --- Creative Tools ---
  { name: "QR Master", icon: QrCode, path: "/qr-tool", description: "Generate & Scan QRs.", color: "#a855f7", textColor: "text-white" }, // Purple-500
  { name: "AI Writer", icon: Sparkles, path: "/ai-writer", description: "Generate smart content.", color: "#3b82f6", textColor: "text-white" }, // Blue-500
  { name: "Note Pad", icon: FileText, path: "/notepade", description: "Quick text editor.", color: "#f97316", textColor: "text-black" }, // Orange-500
];

const Home: React.FC = () => {
  return (
    <div className="bg-background min-h-screen">
      <HeroSection />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-20" id="tools">
        <SectionHeader
          title="The Toolset"
          subtitle="Everything you need to manage your digital life, locally and securely."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12">
          {ALL_TOOLS.map((tool) => (
            <ToolCard key={tool.name} {...tool} />
          ))}
        </div>

        <AhaSection />
      </main>
    </div>
  );
};

export default Home;