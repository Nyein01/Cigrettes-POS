import { GoogleGenAI, Chat } from "@google/genai";
import { Sale, Product } from '../types';

const getAIClient = () => {
    // Use process.env.API_KEY as mandated by guidelines.
    // Assume it is pre-configured and valid.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateSalesAnalysis = async (sales: Sale[]): Promise<string> => {
  const ai = getAIClient();
  
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

export const createOracleSession = async (products: Product[], recentSales: Sale[]) => {
    const ai = getAIClient();
    
    // Prepare Context
    const inventoryList = products.map(p => `- ${p.name} (${p.brand}): ${p.stock} units @ ฿${p.basePrice}`).join('\n');
    
    const today = new Date().toISOString().split('T')[0];
    const todaysSales = recentSales.filter(s => s.date.startsWith(today));
    const totalRevenue = todaysSales.reduce((sum, s) => sum + s.total, 0);
    const totalProfit = todaysSales.reduce((sum, s) => sum + s.profit, 0);

    const systemInstruction = `
        You are K.A.I (Khao San Artificial Intelligence), a witty, helpful, and slightly cyberpunk shop assistant for a cigarette store.
        
        CURRENT STATUS:
        - Date: ${new Date().toLocaleString()}
        - Today's Revenue: ฿${totalRevenue.toFixed(2)}
        - Today's Profit: ฿${totalProfit.toFixed(2)}
        - Transactions Today: ${todaysSales.length}
        
        INVENTORY SNAPSHOT:
        ${inventoryList}

        YOUR ROLE:
        1. Answer questions about stock ("Do we have Marlboro?").
        2. Analyze performance based on the data provided above.
        3. Be concise (max 2-3 sentences unless asked for details).
        4. Use emojis occasionally.
        5. If asked for a "Shop Horoscope", invent a funny, mystical prediction for the business day related to retail/customers.

        Tone: Professional but fun, like a smart teammate.
    `;

    const chat: Chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: systemInstruction,
        },
    });

    return chat;
};