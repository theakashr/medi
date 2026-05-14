import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getGeminiModel = (modelName: string = "gemini-1.5-flash") => {
  if (!genAI) throw new Error("Generative AI not initialized. Check API key.");
  return genAI.getGenerativeModel({ model: modelName });
};

export async function getMedicineSuggestions(query: string) {
  try {
    const model = getGeminiModel();
    const prompt = `As a medical assistant for a pharmacy, provide brief information about the medicine: "${query}". Include common use, dosage range, and precautions. Keep it concise.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Error:", error);
    return "Could not fetch AI suggestions at this time.";
  }
}

export async function analyzePrescription(ocrText: string) {
  try {
    const model = getGeminiModel();
    const prompt = `Analyze the following OCR text from a prescription and extract medicine names and instructions in a JSON format. OCR Text: ${ocrText}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
}
