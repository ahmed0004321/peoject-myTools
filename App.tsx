import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ImageToPdf from './pages/ImageToPdf';
import PdfToImage from './pages/PdfToImage';
import MergePdf from './pages/MergePdf';
import ImageSharpener from './pages/ImageSharpener';
import PptxToPdf from './pages/PptxToPdf';
import CompressTool from './pages/CompressTool';
import Converter from './pages/Converter';
import QrTool from './pages/QrTool';
import ImageEditor from './pages/ImageEditor';
import PasswordManager from './pages/PasswordManager';
import HashGenerator from './pages/HashGenerator';
import TextFormatter from './pages/TextFormatter';
import QrBatch from './pages/QrBatch';
import PasswordTool from './pages/PasswordTool';
import SecureVault from './pages/SecureVault';
import ContentDetector from './pages/ContentDetector';
import OfflineIndicator from './components/OfflineIndicator';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Toaster position="top-center" reverseOrder={false} />
        <OfflineIndicator />
        <Routes>
          <Route path="/" element={<Home />} />

          {/* PDF Tools */}
          <Route path="/image-to-pdf" element={<ImageToPdf />} />
          <Route path="/pdf-to-image" element={<PdfToImage />} />
          <Route path="/pptx-to-pdf" element={<PptxToPdf />} />
          <Route path="/merge-pdf" element={<MergePdf />} />

          {/* Image Tools */}
          <Route path="/image-sharpener" element={<ImageSharpener />} />
          <Route path="/image-editor" element={<ImageEditor />} />

          {/* Security Tools */}
          <Route path="/secure-vault" element={<SecureVault />} />
          <Route path="/password-tool" element={<PasswordTool />} />
          <Route path="/password-manager" element={<PasswordManager />} />
          <Route path="/hash-generator" element={<HashGenerator />} />

          {/* Converters */}
          <Route path="/converter" element={<Converter />} />

          {/* Text & Productivity */}
          <Route path="/text-formatter" element={<TextFormatter />} />


          {/* Web Tools (Refining) */}
          <Route path="/qr-tool" element={<QrTool />} />
          <Route path="/qr-batch" element={<QrBatch />} />
          <Route path="/content-detector" element={<ContentDetector />} />

          {/* Archives */}
          <Route path="/compress-tool" element={<CompressTool />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};
export default App;