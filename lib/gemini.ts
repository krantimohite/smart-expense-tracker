import { GoogleGenAI, Type } from "@google/genai";
import "server-only";

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function categorizeExpense(notes: string, amount: number) {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Categorize this expense: "${notes}" for amount ${amount}. Return only the category name from this list: Food, Travel, Shopping, Bills, Health, Entertainment, Others.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "The category name",
            },
          },
          required: ["category"],
        },
      },
    });

    const result = JSON.parse(response.text || '{"category": "Others"}');
    return result.category;
  } catch (error) {
    console.error("AI Categorization failed:", error);
    return "Others";
  }
}
