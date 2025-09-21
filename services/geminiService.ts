import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const systemInstruction = `You are an expert web developer AI named Dem Bot. Your task is to generate a complete, self-contained, single-file HTML document based on the user's request. The HTML file must include all necessary CSS within "<style>" tags and any JavaScript within "<script>" tags. Do not use external files or libraries unless specifically requested. Provide only the raw HTML code as a single block of text. Do not include any explanations, introductions, markdown formatting like \`\`\`html, or any text outside of the final HTML code itself. The generated code should be production-ready, well-formatted, and directly runnable in a modern web browser.`;

export const generateCode = async (prompt: string, useSearch: boolean = false): Promise<string> => {
    if (!prompt) {
        throw new Error("Prompt cannot be empty.");
    }
    
    // Dynamically build the configuration for the model
    const config: {
        systemInstruction: string;
        tools?: any[];
        thinkingConfig?: { thinkingBudget: number };
    } = {
        systemInstruction: systemInstruction,
        // Disable thinking for faster, lower-latency responses.
        thinkingConfig: { thinkingBudget: 0 },
    };

    if (useSearch) {
        config.tools = [{googleSearch: {}}];
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: config,
        });

        const code = response.text;
        if (!code) {
            throw new Error("Received an empty response from the AI. Please try again.");
        }
        return code;
    } catch (error) {
        console.error("Error generating code:", error);
        if (error instanceof Error) {
            return `Error: ${error.message}. Please check the console for more details.`;
        }
        return "An unknown error occurred while generating the code.";
    }
};