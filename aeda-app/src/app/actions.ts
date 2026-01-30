'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

// Initialize Gemini
const apiKey = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

export async function processDocumentWithGemini(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error("No file uploaded");

        const fileName = file.name;
        const mimeType = file.type;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileBase64 = buffer.toString('base64');

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Calculate size: Buffer length is exact bytes
        const sizeInBytes = buffer.length;
        const sizeInMB = sizeInBytes / (1024 * 1024);

        console.log(`Processing ${fileName}: ${sizeInMB.toFixed(2)} MB`);

        if (sizeInBytes === 0) {
            throw new Error("File is empty (0 bytes)");
        }

        let inputPart;

        // Gemini Inline Data Limit is 20MB. If larger, use File API.
        if (sizeInMB > 18) { // Safe threshold
            console.log("File > 18MB, using File API upload...");

            // 1. Write temp file
            const tempPath = path.join(os.tmpdir(), `aeda_${Date.now()}_${fileName}`);
            await writeFile(tempPath, buffer);

            // 2. Upload to Gemini
            const uploadResponse = await fileManager.uploadFile(tempPath, {
                mimeType,
                displayName: fileName,
            });

            console.log(`Uploaded to Gemini: ${uploadResponse.file.uri}`);

            // 3. Clean up local temp file
            await unlink(tempPath);

            // 4. Wait for processing (essential for videos, good practice for large PDFs)
            // For simple PDFs it's usually instant, but let's be safe.
            let file = await fileManager.getFile(uploadResponse.file.name);
            while (file.state === "PROCESSING") {
                console.log("File is processing...");
                await new Promise((resolve) => setTimeout(resolve, 2000));
                file = await fileManager.getFile(uploadResponse.file.name);
            }

            if (file.state === "FAILED") {
                throw new Error("Gemini failed to process the file.");
            }

            inputPart = {
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri
                }
            };

        } else {
            // Smaller file: Use inline data (faster, no extra API calls)
            inputPart = {
                inlineData: {
                    data: fileBase64,
                    mimeType: mimeType,
                },
            };
        }

        // 1. OCR & Extraction Prompt
        const prompt = `
      You are an Advanced Educational Data Agent (AEDA).
      Analyze the attached academic document (${fileName}).
      
      Protocol:
      1. EXTRACT: Capturing the full text content.
      2. DIAGRAMS: Describe any diagrams/graphs in detail (visual to text).
      3. SUMMARY: Provide a concise executive summary.
      4. KEYWORDS: Identify top 5 subject keywords.
      5. FORMAT: Return the result in a clean JSON format compatible with this structure:
         { summary: string, full_extraction: string, keywords: string[], subject: string, topic: string }
      
      Ensure all math is in LaTeX format (e.g. $E=mc^2$).
    `;

        const result = await model.generateContent([
            prompt,
            inputPart
        ]);

        const response = await result.response;
        const text = response.text();

        // Naive parsing of the JSON response from Gemini
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                // Ensure no deep nesting/circular
                return JSON.parse(JSON.stringify(parsed));
            }
            throw new Error("No JSON found");
        } catch (e) {
            // Fallback if AI didn't output strict JSON
            const cleanResult = {
                summary: "Extracted Content",
                full_extraction: text,
                keywords: ["Document", "General"],
                subject: "General",
                topic: fileName
            };
            return JSON.parse(JSON.stringify(cleanResult));
        }

    } catch (error: any) {
        console.error("Server Action Failed:", error.message);
        return { error: `Processing Failed: ${error.message}` };
    }
}

import { chatWithOllama } from '@/lib/ollama-client';
import { chatWithGroq } from '@/lib/groq-client';

export async function chatWithGemini(history: any[], newMessage: string, context: string) {
    // Check Provider
    const provider = process.env.NEXT_PUBLIC_AI_PROVIDER || 'gemini';

    if (provider === 'groq') {
        try {
            // Groq Llama 3.3
            const systemPrompt = `You are an expert tutor. Context: ${context.slice(0, 5000)}`;
            return await chatWithGroq(history, systemPrompt);
        } catch (e) {
            console.error(e);
            return "Groq Error: Check GROQ_API_KEY in .env.local";
        }
    }

    if (provider === 'ollama') {
        try {
            const systemPrompt = `You are an expert tutor. Context: ${context.slice(0, 3000)}`;
            return await chatWithOllama('mistral', history, systemPrompt);
        } catch (e) {
            console.error(e);
            return "Ollama Error: Ensure Ollama is running and 'mistral' is pulled.";
        }
    }

    // Default: Gemini
    try {
        // We use gemini-pro (text-only) for the chat turns if no images are passed in this specific turn
        // Or we can use flash if we want to be fast.
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const systemPrompt = `
      Pretend you are an expert tutor.
      Context from uploaded document: """${context.slice(0, 5000)}..."""
      
      Student Question: ${newMessage}
      
      Task:
      - Answer the student's question based PRIMARILY on the context.
      - If the question asks for "PYQ" (Previous Year Questions), generate 3 relevant practice questions.
      - If the question asks for "Notes", generate bulleted revision notes.
      - Always cite the document.
      - Use LaTeX for math.
    `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "I'm having trouble connecting to my brain right now. Please check my API Key setup.";
    }
}
