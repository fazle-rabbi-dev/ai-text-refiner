import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
	throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const callGemini = async (prompt: string, systemInstruction: string) => {
	if (!prompt.trim()) {
		return "";
	}
	try {
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: prompt,
			config: {
				systemInstruction: systemInstruction,
				temperature: 0.8,
				topP: 0.9,
			},
		});
		return response.text.trim();
	} catch (error) {
		console.error("Error calling Gemini API:", error);
		if (error instanceof Error) {
			return `Error: Failed to process text. ${error.message}`;
		}
		return "An unknown error occurred while processing text.";
	}
};

export const refineText = async (text: string, language: string, tone: string): Promise<string> => {
	const systemInstruction = `You are a linguistic expert specializing in text transformation. Your task is to rewrite the user's text into a specific tone while preserving the core message and the original language. You are proficient in English, Banglish (Bengali in English letters), and Bengali (Bangla script). Do not add any extra commentary, just provide the refined text.`;
	const prompt = `
    Please refine the following '${language}' text into a '${tone}' tone.
    Ensure the output remains in '${language}'.

    Original Text:
    ---
    ${text}
    ---
  `;
	return callGemini(prompt, systemInstruction);
};

export const convertBanglishToEnglish = async (text: string, tone: string): Promise<string> => {
	const systemInstruction = `You are an expert linguist specializing in translating and transliterating 'Banglish' (Bengali written using the English alphabet) into fluent, grammatically correct English. After translating, you will rewrite the text into a specific tone, while preserving the original message. Your final output must only be the translated and toned English text, with no extra commentary.`;
	const prompt = `
    Please translate the following 'Banglish' text into English with a '${tone}' tone.

    Original Banglish Text:
    ---
    ${text}
    ---
  `;
	return callGemini(prompt, systemInstruction);
};
