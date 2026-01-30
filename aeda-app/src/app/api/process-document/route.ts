import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

// Initialize Gemini
const apiKey = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

import { processImageWithOllama } from '@/lib/ollama-client';
import { processImageWithGroq } from '@/lib/groq-client';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        // Check for Provider Header
        const provider = req.headers.get('x-ai-provider') || process.env.NEXT_PUBLIC_AI_PROVIDER || 'gemini';
        console.log(`[API] Using Provider: ${provider}`);

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const fileName = file.name;
        const mimeType = file.type;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileBase64 = buffer.toString('base64');
        const sizeInBytes = buffer.length;
        const sizeInMB = sizeInBytes / (1024 * 1024);

        if (sizeInBytes === 0) {
            return NextResponse.json({ error: "File is empty (0 bytes)" }, { status: 400 });
        }

        let text = "";

        // --- GROQ PATH ---
        if (provider === 'groq') {
            const prompt = `
            Analyze this academic document (${fileName}).
            1. Extract text.
            2. Describe diagrams.
            3. Summary.
            4. 5 Keywords.
            5. Return strict JSON: { "summary": "...", "full_extraction": "...", "keywords": ["..."], "subject": "...", "topic": "..." }
            `;

            // Groq Vision Limitation: Currently supports Images well. PDF support is experimental or needs conversion.
            // We will treat it same as Ollama for now (Image focused).
            if (mimeType === 'application/pdf') {
                return NextResponse.json({ error: "Groq Llama Vision currently handles Images (JPG/PNG). For PDFs, use Gemini or convert to images." }, { status: 400 });
            }

            console.log(`[API] Sending ${mimeType} to Groq Vision...`);
            text = await processImageWithGroq(fileBase64, mimeType, prompt);
            console.log(`[API] Groq Response: ${text.substring(0, 100)}...`);

        }
        // --- OLLAMA PATH ---
        else if (provider === 'ollama') {
            const prompt = `
            Analyze this academic document (${fileName}).
            1. Extract the text.
            2. Describe diagrams.
            3. Provide a summary.
            4. List 5 keywords.
            5. Return strict JSON: { "summary": "...", "full_extraction": "...", "keywords": ["..."], "subject": "...", "topic": "..." }
            `;

            // Ollama Vision only supports Images usually. PDF support depends on if we convert to image first.
            // For this demo, we assume the user uploads an Image or the Client handles PDF->Image.
            // But wait, our client sends PDFs too. 
            // Gemini handles PDFs natively. Ollama (Llava) DOES NOT.
            // LIMITATION: Ollama path usually only Works for Images (png/jpg) unless we use a PDF parser here.

            if (mimeType === 'application/pdf') {
                // Fallback or Error for PDF on Ollama without dedicated PDF parser
                return NextResponse.json({ error: "Ollama (Local) currently supports Images only (JPG/PNG). For PDFs, please use Gemini or convert to images." }, { status: 400 });
            }

            text = await processImageWithOllama(fileBase64, prompt);

        } else {
            // --- GEMINI PATH (Existing) ---
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            let inputPart;

            if (sizeInMB > 18) {
                const tempPath = path.join(os.tmpdir(), `aeda_${Date.now()}_${fileName}`);
                await writeFile(tempPath, buffer);
                const uploadResponse = await fileManager.uploadFile(tempPath, { mimeType, displayName: fileName });
                await unlink(tempPath);

                let fileState = await fileManager.getFile(uploadResponse.file.name);
                while (fileState.state === "PROCESSING") {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    fileState = await fileManager.getFile(uploadResponse.file.name);
                }
                if (fileState.state === "FAILED") throw new Error("Gemini processing failed");

                inputPart = { fileData: { mimeType: uploadResponse.file.mimeType, fileUri: uploadResponse.file.uri } };
            } else {
                inputPart = { inlineData: { data: fileBase64, mimeType: mimeType } };
            }

            const prompt = `
            You are an Advanced Educational Data Agent (AEDA).
            Analyze the attached academic document (${fileName}).
            Return strict JSON: { summary, full_extraction, keywords[], subject, topic }
            Ensure Math is LaTeX.
            `;

            const result = await model.generateContent([prompt, inputPart]);
            const response = await result.response;
            text = response.text();
        }

        // Shared Parsing Logic
        let finalData;
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                finalData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found");
            }
        } catch (e) {
            console.warn("JSON Parse Failed, returning raw text");
            finalData = {
                summary: "Extracted Content",
                full_extraction: text,
                keywords: ["Document", "General"],
                subject: "General",
                topic: fileName
            };
        }

        return NextResponse.json(finalData);

    } catch (error: any) {
        console.error("[API] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
