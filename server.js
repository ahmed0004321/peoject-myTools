import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// Configure Multer
const upload = multer({ dest: UPLOAD_DIR });

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'online', service: 'omniTools Utils Backend' });
});

// We can add simple file handling routes if necessary, 
// but most new tools (Zip, QR, Converter, Password) will be client-side.
// Keeping server for potential future backend needs or specific heavy lifting.

app.listen(PORT, () => {
    console.log(`Utils Server running on http://localhost:${PORT}`);
    console.log(`- Health Check: GET /`);
});