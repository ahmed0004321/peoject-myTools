import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

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
const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'online', service: 'myTools Utils Backend' });
});

// Gemini Analysis Endpoint
app.post('/analyze', async (req, res) => {
    try {
        const { text } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "Server Configuration Error: Gemini API Key missing." });
        }

        if (!text) {
            return res.status(400).json({ error: "No text provided" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are a top-tier linguistic forensics expert. Analyze the following text for:
        1. AI-Generated Probability: Is this likely written by an LLM?
        2. Authorship Style: Is it Formal Academic, Casual, Technical, or Robotic?
        3. Plagiarism Risk: Does it contain generic, copied, or template-like phrasing common in SOPs or essays?

        IMPORTANT:
        - Do NOT classify "Formal Academic" or "SOP" writing as AI simply because it is structured.
        - High perplexity and varied sentence structure suggests Human.
        - Repetitive, overly smooth, or hallucinated logic suggests AI.

        Return ONLY a raw JSON object (no markdown formatting) with this structure:
        {
            "aiScore": number (0.0 to 1.0, where 1.0 is definitely AI),
            "aiConfidence": number (0.0 to 1.0),
            "classification": "Human" | "AI" | "Mixed",
            "reasoning": "string (Explain WHY in 2 sentences. Mention specific stylistic traits observed.)",
            "plagiarismRisk": number (0.0 to 1.0),
            "estimatedOriginality": number (0.0 to 1.0)
        }

        Text to Analyze:
        "${text.slice(0, 100000)}" 
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        // Clean markdown code blocks if present
        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResponse = JSON.parse(cleanJson);

        res.json(jsonResponse);

    } catch (error) {
        console.error("Backend Analysis Error:", error);
        res.status(500).json({ error: "Analysis Failed" });
    }
});


// We can add simple file handling routes if necessary, 
// but most new tools (Zip, QR, Converter, Password) will be client-side.
// Keeping server for potential future backend needs or specific heavy lifting.

if (process.env.NODE_ENV !== 'production') {
    const startServer = (port) => {
        const server = app.listen(port, () => {
            console.log(`\n✅ Utils Server running on http://localhost:${port}`);
            console.log(`- Health Check: GET /`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                if (process.env.IS_AUTOMATED === 'true') {
                    console.log(`⚠️ Port ${port} is busy, trying ${port + 1} (Automated Mode)...`);
                    startServer(port + 1);
                } else {
                    console.error(`\n❌ CRITICAL ERROR: Port ${port} is already in use.`);
                    console.error(`   To fix this, either:`);
                    console.error(`   1. Stop the process occupying port ${port} (likely another instance of this server).`);
                    console.error(`   2. Run 'npm run dev' to automatically find a free port.`);
                    console.error(`   3. Specify a different port: 'PORT=3002 npm run server'\n`);
                    process.exit(1);
                }
            } else {
                console.error("Server failed to start:", err);
            }
        });
    };

    startServer(PORT);
}

export default app;