const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Chat with Groq (Text Only)
 * Uses Llama 3.3 70B (High Intelligence, Fast)
 */
export async function chatWithGroq(messages: any[], systemPrompt?: string) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is missing in .env.local");

    try {
        const chatMessages = messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        if (systemPrompt) {
            chatMessages.unshift({ role: 'system', content: systemPrompt });
        }

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: chatMessages,
                stream: false
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Groq API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error("Groq Chat Error:", error);
        throw error;
    }
}

/**
 * Process Image with Groq (Vision)
 * Uses Llama 3.2 11B Vision (Fast, Good Vision)
 */
export async function processImageWithGroq(base64Image: string, mimeType: string, prompt: string) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is missing in .env.local");

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.2-11b-vision-preview',
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Groq Vision Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error("Groq Vision Error:", error);
        throw error;
    }
}
