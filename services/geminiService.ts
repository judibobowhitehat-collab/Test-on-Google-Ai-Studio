
import { GoogleGenAI, Modality } from '@google/genai';

// The user must provide their own API key.
// It is recommended to use a secret manager.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY is not defined in environment variables");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType,
    },
  };
};

export const analyzeImage = async (
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const imagePart = fileToGenerativePart(imageBase64, mimeType);
    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image. Please check the console for details.');
  }
};

export const editImage = async (
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const imagePart = fileToGenerativePart(imageBase64, mimeType);
    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    throw new Error('No image was generated in the response.');
  } catch (error) {
    console.error('Error editing image:', error);
    throw new Error('Failed to edit image. Please check the console for details.');
  }
};
