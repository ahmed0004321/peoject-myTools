import React from 'react';
import {
  FileImage, Layers, ImageMinus, PenTool, Combine,
  Settings, QrCode, RefreshCcw, ShieldCheck, Lock,
  Keyboard, FileText, Sparkles, Palette, Zap, Presentation, Scan, Table
} from 'lucide-react';
import HeroSection from '../components/ui/HeroSection';
import SectionHeader from '../components/ui/SectionHeader';
import ToolCard from '../components/ui/ToolCard';
import AhaSection from '../components/ui/AhaSection';
import { motion } from 'framer-motion';

// --- Data ---
const ALL_TOOLS = [
  // --- PDF & Document Tools ---

  { name: "Edit & Sign PDF", icon: FileText, path: "/edit-sign-pdf", description: "Edit text & add signatures.", color: "#3b82f6", textColor: "text-white" },
  { name: "PDF Merge", icon: Combine, path: "/merge-pdf", description: "Combine docs easily.", color: "#a855f7", textColor: "text-white" },
  { name: "Img to PDF", icon: FileImage, path: "/image-to-pdf", description: "Convert images to docs.", color: "#10b981", textColor: "text-black" },
  { name: "PDF to Image", icon: ImageMinus, path: "/pdf-to-image", description: "Extract pages as images.", color: "#8b5cf6", textColor: "text-white" },
  { name: "Word to PDF", icon: FileText, path: "/word-to-pdf", description: "Convert .doc / .docx files to PDF.", color: "#2563eb", textColor: "text-white" },


  // --- Image & Media Tools ---
  { name: "Image Studio", icon: Palette, path: "/image-editor", description: "Crop, Resize & Edit.", color: "#ec4899", textColor: "text-white" },
  { name: "AI Upscaler", icon: Zap, path: "/image-sharpener", description: "Enhance image quality.", color: "#facc15", textColor: "text-black" },
  { name: "Compressor", icon: Layers, path: "/compress-tool", description: "Zip & Compress files.", color: "#f97316", textColor: "text-black" },
  { name: "PDF Editor", icon: Presentation, path: "/pdf-editor", description: "Edit text in PDF files directly.", color: "#4f46ae", textColor: "text-white" },

  // --- Security Tools ---
  { name: "Pass Generator", icon: ShieldCheck, path: "/password-tool", description: "Generate strong passwords.", color: "#8b5cf6", textColor: "text-white" },
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