
async function testConnection() {
    console.log("Testing connectivity...");

    try {
        const start = Date.now();
        await fetch('https://www.google.com', { method: 'HEAD' });
        console.log(`Successfully connected to google.com in ${Date.now() - start}ms`);
    } catch (e) {
        console.error("Failed to connect to google.com:", e.message);
    }

    try {
        const start = Date.now();
        await fetch('https://generativelanguage.googleapis.com', { method: 'HEAD' });
        console.log(`Successfully connected to Gemini API in ${Date.now() - start}ms`);
    } catch (e) {
        console.error("Failed to connect to Gemini API:", e.message);
    }
}

testConnection();
