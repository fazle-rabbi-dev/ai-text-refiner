
import { GoogleGenAI } from "@google/genai";
import { Language } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const refineText = async (
  text: string,
  language: Language,
  tone: string
): Promise<string> => {
  if (!text.trim()) {
    return "";
  }

  const systemInstruction = `You are a linguistic expert specializing in text transformation. Your task is to rewrite the user's text into a specific tone while preserving the core message and the original language. You are proficient in ${Language.ENGLISH}, ${Language.BANGLISH}, and ${Language.BANGLA}. Do not add any extra commentary, just provide the refined text.`;

  const prompt = `
    Please refine the following '${language}' text into a '${tone}' tone.
    Ensure the output remains in '${language}'.

    Original Text:
    ---
    ${text}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.8,
            topP: 0.9,
        }
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error refining text with Gemini API:", error);
    if (error instanceof Error) {
        return `Error: Failed to refine text. ${error.message}`;
    }
    return "An unknown error occurred while refining text.";
  }
};
