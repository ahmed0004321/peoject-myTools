import React from 'react';
import {
  FileImage, Layers, ImageMinus, PenTool, Combine,
  Settings, QrCode, RefreshCcw, ShieldCheck, Lock,
  Keyboard, FileText, Sparkles, Palette, Zap, Presentation, Scan
} from 'lucide-react';
import HeroSection from '../components/ui/HeroSection';
import SectionHeader from '../components/ui/SectionHeader';
import ToolCard from '../components/ui/ToolCard';
import AhaSection from '../components/ui/AhaSection';
import { motion } from 'framer-motion';

// --- Data ---
const ALL_TOOLS = [
  // --- PDF & Document Tools ---
  { name: "PPTX to PDF", icon: Presentation, path: "/pptx-to-pdf", description: "Convert Slides to PDF.", color: "#f97316", textColor: "text-black" },
  { name: "PDF Merge", icon: Combine, path: "/merge-pdf", description: "Combine docs easily.", color: "#a855f7", textColor: "text-white" },
  { name: "Img to PDF", icon: FileImage, path: "/image-to-pdf", description: "Convert images to docs.", color: "#10b981", textColor: "text-black" },
  { name: "PDF to Image", icon: ImageMinus, path: "/pdf-to-image", description: "Extract pages as images.", color: "#8b5cf6", textColor: "text-white" },

  // --- Image & Media Tools ---
  { name: "Image Studio", icon: Palette, path: "/image-editor", description: "Crop, Resize & Edit.", color: "#ec4899", textColor: "text-white" },
  { name: "AI Upscaler", icon: Zap, path: "/image-sharpener", description: "Enhance image quality.", color: "#facc15", textColor: "text-black" },
  { name: "Compressor", icon: Layers, path: "/compress-tool", description: "Zip & Compress files.", color: "#f97316", textColor: "text-black" },
  { name: "Converter", icon: RefreshCcw, path: "/converter", description: "Change file formats.", color: "#3b82f6", textColor: "text-white" },

  // --- Security Tools ---
  { name: "Secure Vault", icon: ShieldCheck, path: "/secure-vault", description: "Secure your sensitive files.", color: "#10b981", textColor: "text-black" },
  { name: "Pass Generator", icon: ShieldCheck, path: "/password-tool", description: "Generate strong passwords.", color: "#8b5cf6", textColor: "text-white" },
  { name: "Pass Manager", icon: Lock, path: "/password-manager", description: "Secure your credentials.", color: "#ec4899", textColor: "text-white" },
  { name: "Hash Generator", icon: Lock, path: "/hash-generator", description: "MD5, SHA-256 Hashes.", color: "#6b7280", textColor: "text-white" },

  // --- Productivity & AI ---
  { name: "QR Master", icon: QrCode, path: "/qr-tool", description: "Generate & Scan QRs.", color: "#a855f7", textColor: "text-white" },
  { name: "QR Batch", icon: QrCode, path: "/qr-batch", description: "Generate multiple QRs.", color: "#3b82f6", textColor: "text-white" },
  { name: "Text Format", icon: FileText, path: "/text-formatter", description: "Beautify & Clean text.", color: "#f97316", textColor: "text-black" },
  { name: "Content Check", icon: Scan, path: "/content-detector", description: "AI & Plagiarism check.", color: "#10b981", textColor: "text-black" },
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

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12"
        >
          {ALL_TOOLS.map((tool) => (
            <ToolCard key={tool.name} {...tool} />
          ))}
        </motion.div>

        <AhaSection />
      </main>
    </div>
  );
};

export default Home;