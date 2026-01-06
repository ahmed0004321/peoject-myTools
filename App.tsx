import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ImageToPdf from './pages/ImageToPdf';
import PdfToImage from './pages/PdfToImage';
import NoteGenerator from './pages/NoteGenerator';
import MergePdf from './pages/MergePdf';
import ImageToolkit from './pages/ImageToolkit';
import CompressTool from './pages/CompressTool';
import Converter from './pages/Converter';
import QrTool from './pages/QrTool';
import ImageEditor from './pages/ImageEditor';
import PasswordManager from './pages/PasswordManager';
import HashGenerator from './pages/HashGenerator';
import TextFormatter from './pages/TextFormatter';
import MarkdownPreview from './pages/MarkdownPreview';
import QrBatch from './pages/QrBatch';
import PasswordTool from './pages/PasswordTool';
import TypingTest from './pages/TypingTest';
import SecureVault from './pages/SecureVault';
import DocumentScanner from './pages/DocumentScanner';
import ContentDetector from './pages/ContentDetector';
import FlashcardGenerator from './pages/FlashcardGenerator';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* PDF Tools */}
          <Route path="/image-to-pdf" element={<ImageToPdf />} />
          <Route path="/pdf-to-image" element={<PdfToImage />} />
          <Route path="/note-generator" element={<NoteGenerator />} />
          <Route path="/merge-pdf" element={<MergePdf />} />
          <Route path="/document-scanner" element={<DocumentScanner />} />

          {/* Image Tools */}
          <Route path="/image-toolkit" element={<ImageToolkit />} />
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
          <Route path="/markdown-preview" element={<MarkdownPreview />} />
          <Route path="/typing-test" element={<TypingTest />} />

          {/* Web Tools (Refining) */}
          <Route path="/qr-tool" element={<QrTool />} />
          <Route path="/qr-batch" element={<QrBatch />} />
          <Route path="/content-detector" element={<ContentDetector />} />
          <Route path="/flashcards" element={<FlashcardGenerator />} />

          {/* Archives */}
          <Route path="/compress-tool" element={<CompressTool />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};
export default App;