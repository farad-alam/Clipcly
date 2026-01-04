'use server'

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateCaption(topic: string, tone: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { error: 'Gemini API Key is missing' }
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
      You are an expert Social Media Manager.
      Write an engaging Instagram caption about "${topic}".
      Tone: ${tone}.
      
      Requirements:
      1. Start with a hook line.
      2. Use emojis relevant to the content.
      3. Keep paragraphs short and readable.
      4. End with a Call to Action (CTA).
      5. Append exactly 2 to 6 relevant hashtags at the very end.
      
      Return ONLY the caption text. Do not include any meta-text like "Here is the caption".
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            caption: text.trim(),
            success: true
        }
    } catch (error) {
        console.error('Gemini AI Error:', error)
        return { error: 'Failed to generate content. Please try again.' }
    }
}

export async function rewriteCaption(originalCaption: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("Gemini API Key missing. Skipping caption rewrite.");
        return originalCaption;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        You are an Instagram social media manager.
        Rewrite the following TikTok caption for an Instagram Reel.
        
        Rules:
        1. Remove any @mentions of other users.
        2. Make it engaging and catchy.
        3. Maintain the original context/meaning.
        4. Keep relevant hashtags or add better ones (max 5-7 hashtags).
        5. Return ONLY the new caption text, nothing else.
        
        Original Caption: "${originalCaption}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text.trim() || originalCaption;
    } catch (error) {
        console.error("Gemini Caption Rewrite Error:", error);
        return originalCaption; // Fallback to original
    }
}

export async function analyzeAudio(audioBase64: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { error: 'Gemini API Key is missing' }
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `
        Analyze this audio clip and determine if it contains Music, Speech, or Both.
        
        Return a JSON object strictly in this format:
        {
            "hasMusic": boolean,
            "hasSpeech": boolean,
            "confidence": number (0-1),
            "description": "Short 1 sentence description of the audio content"
        }
        
        Do not acknowledge the request, just return the JSON.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "audio/mp3",
                    data: audioBase64
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(jsonStr);
            return { success: true, data };
        } catch (e) {
            console.error("Failed to parse Gemini response:", text);
            return { error: "Failed to parse analysis result" };
        }

    } catch (error) {
        console.error('Gemini Audio Analysis Error:', error)
        return { error: 'Failed to analyze audio.' }
    }
}
