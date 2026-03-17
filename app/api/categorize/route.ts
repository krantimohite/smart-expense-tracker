import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { notes, amount } = await request.json();

    if (!notes || amount === undefined) {
      return NextResponse.json(
        { error: "Notes and amount are required" },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
    return NextResponse.json({ category: result.category });
  } catch (error) {
    console.error("AI Categorization failed:", error);
    return NextResponse.json({ category: "Others" });
  }
}
