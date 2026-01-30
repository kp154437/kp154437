
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function testKey() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const modelName = "gemini-2.5-flash";

    console.log(`Testing model: ${modelName}`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello!");
        const response = await result.response;
        console.log(`Success! Response:`, response.text());
    } catch (error) {
        console.error(`Failed with ${modelName}:`, error.message);
    }
}

testKey();
