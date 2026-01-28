import { GoogleGenAI } from "@google/genai";
import { Sale } from '../types';

export const generateSalesAnalysis = async (sales: Sale[]): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "API Key is missing. Please check your environment configuration.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Prepare a lightweight summary of sales to save tokens
  const salesSummary = sales.map(s => ({
    date: s.date.split('T')[0],
    total: s.total,
    items: s.items.map(i => `${i.brand} ${i.name} (Qty: ${i.quantity}, SoldAt: ${i.negotiatedPrice})`).join(', ')
  }));

  const prompt = `
    You are an expert retail analyst.
    Analyze the following sales data JSON:
    ${JSON.stringify(salesSummary.slice(-50))} 
    
    Provide a concise, professional executive summary in English (max 150 words).
    Focus on:
    1. Best selling brands/items.
    2. Revenue trends.
    3. Brief recommendations for stock or pricing.
    
    Format the output as plain text suitable for a UI display.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to generate AI analysis. Please try again later.";
  }
};