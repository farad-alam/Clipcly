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
