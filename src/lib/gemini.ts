import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateStoreConfigWithGemini(userPrompt: string): Promise<any> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent(
        `You are an AI POS & Print Designer assistant. Transform this request into structured JSON for a thermal layout or store setup:\nPrompt: ${userPrompt}`
      );

      if (response.response.text()) {
        return JSON.parse(response.response.text());
      }
    } catch (err) {
      console.warn('Gemini API call warning:', err);
    }
  }

  return { success: true, prompt: userPrompt };
}
