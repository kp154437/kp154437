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

export async function processDocumentWithGemini(fileBase64: string, mimeType: string, fileName: string) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Calculate size: Base64 string length * 0.75 = approximate bytes
        const sizeInBytes = fileBase64.length * 0.75;
        const sizeInMB = sizeInBytes / (1024 * 1024);

        console.log(`Processing ${fileName}: ${sizeInMB.toFixed(2)} MB`);

        let inputPart;

        // Gemini Inline Data Limit is 20MB. If larger, use File API.
        if (sizeInMB > 18) { // Safe threshold
            console.log("File > 18MB, using File API upload...");

            // 1. Write temp file
            const buffer = Buffer.from(fileBase64, 'base64');
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
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error("No JSON found");
        } catch (e) {
            // Fallback if AI didn't output strict JSON
            return {
                summary: "Extracted Content",
                full_extraction: text,
                keywords: ["Document", "General"],
                subject: "General",
                topic: fileName
            };
        }

    } catch (error) {
        console.error("Gemini Error:", error);
        return { error: "Failed to process document. Ensure GOOGLE_API_KEY is set." };
    }
}

export async function chatWithGemini(history: any[], newMessage: string, context: string) {
    try {
        // We use gemini-pro (text-only) for the chat turns if no images are passed in this specific turn
        // Or we can use flash if we want to be fast.
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
