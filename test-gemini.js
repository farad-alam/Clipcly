const fs = require('fs');
const path = require('path');

async function testGemini() {
    // Manual .env parsing
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        try {
            const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
            const match = envContent.match(/GEMINI_API_KEY=(.+)/);
            if (match && match[1]) {
                apiKey = match[1].trim();
            }
        } catch (e) {
            console.error("Could not read .env file");
        }
    }

    if (!apiKey) {
        console.error("Error: GEMINI_API_KEY not found");
        return;
    }

    console.log("API Key found (length):", apiKey.length);

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
            return;
        }

        if (!data.models) {
            console.log("No models found.");
        } else {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        }

    } catch (error) {
        console.error("Global Error:", error);
    }
}

testGemini();
