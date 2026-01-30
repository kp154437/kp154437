
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function listModels() {
    const key = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.log("Error:", response.status);
            return;
        }
        const data = await response.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("No models found or bad format");
        }
    } catch (error) {
        console.error("Fetch failed:", error.message);
    }
}

listModels();
