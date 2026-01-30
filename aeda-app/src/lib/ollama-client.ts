export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
}

const OLLAMA_HOST = 'http://127.0.0.1:11434';

/**
 * Chat with a text-based model (e.g., Mistral)
 */
export async function chatWithOllama(model: string, messages: any[], systemPrompt?: string) {
    try {
        // Construct prompt from messages (simple concatenation for now, or use /api/chat)
        // Ollama /api/chat is better for history
        const chatMessages = messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        if (systemPrompt) {
            chatMessages.unshift({ role: 'system', content: systemPrompt });
        }

        const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model, // 'mistral' or 'llama3'
                messages: chatMessages,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.message.content;

    } catch (error) {
        console.error("Ollama Chat Error:", error);
        throw error;
    }
}

/**
 * Process an image with a vision model (e.g., Llava)
 */
export async function processImageWithOllama(base64Image: string, prompt: string) {
    try {
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llava', // Must utilize a vision model
                prompt: prompt,
                images: [base64Image],
                stream: false,
                format: "json" // Force JSON output mode if supported (Ollama v0.1.28+)
            })
        });

        if (!response.ok) {
            // Fallback: Maybe they don't have llava?
            throw new Error(`Ollama API Error: ${response.statusText}. Ensure 'ollama pull llava' is run.`);
        }

        const data = await response.json();
        return data.response;

    } catch (error) {
        console.error("Ollama Vision Error:", error);
        throw error;
    }
}
