import mammoth from 'mammoth';

// Removed global declaration to avoid conflicts

export const extractTextFromFile = async (file: File): Promise<string> => {
    const fileType = file.type;

    if (fileType === 'application/pdf') {
        return await extractTextFromPdf(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await extractTextFromDocx(file);
    } else if (fileType.startsWith('image/')) {
        return await extractTextFromImage(file);
    } else if (fileType === 'text/plain') {
        return await file.text();
    }

    throw new Error(`Unsupported file type: ${fileType}`);
};

const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdf = await (window as any).pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
    }

    return fullText;
};

const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

const extractTextFromImage = async (file: File): Promise<string> => {
    // Check if Tesseract is available via window (from CDN)
    if ((window as any).Tesseract) {
        const result = await (window as any).Tesseract.recognize(file, 'eng');
        return result.data.text;
    }

    // Fallback if imported via npm (though typically Tesseract.js workers need path configs)
    // Logic: We rely on the script tag in index.html as per existing patterns
};
