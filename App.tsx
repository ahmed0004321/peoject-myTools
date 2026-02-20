import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ImageToPdf from './pages/ImageToPdf';
import PdfToImage from './pages/PdfToImage';
import MergePdf from './pages/MergePdf';
import ImageSharpener from './pages/ImageSharpener';

import CompressTool from './pages/CompressTool';
import PasswordTool from './pages/PasswordTool';
import QrTool from './pages/QrTool';
import ImageEditor from './pages/ImageEditor';
import PdfEditor from './pages/PdfEditor';
import ContentDetector from './pages/ContentDetector';
import EditSignPdf from './pages/EditSignPdf';
import WordToPdf from './pages/WordToPdf';

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

          <Route path="/merge-pdf" element={<MergePdf />} />
          <Route path="/edit-sign-pdf" element={<EditSignPdf />} />
          <Route path="/word-to-pdf" element={<WordToPdf />} />


          {/* Image Tools */}
          <Route path="/image-sharpener" element={<ImageSharpener />} />
          <Route path="/image-editor" element={<ImageEditor />} />

          {/* Security Tools */}
          <Route path="/password-tool" element={<PasswordTool />} />

          <Route path="/pdf-editor" element={<PdfEditor />} />
          <Route path="/qr-tool" element={<QrTool />} />
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