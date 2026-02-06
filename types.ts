export interface Product {
  id: string;
  name: string;
  brand: string;
  stock: number;
  basePrice: number; // The standard listing price
  costPrice: number; // Cost to store, for profit calc
}

export interface CartItem extends Product {
  quantity: number;
  negotiatedPrice: number; // The actual price sold at
}

export interface Sale {
  id: string;
  date: string; // ISO string
  items: CartItem[];
  total: number;
  profit: number;
}

export interface SalesReport {
  totalRevenue: number;
  totalProfit: number;
  totalItemsSold: number;
  salesCount: number;
  aiAnalysis?: string;
}

export interface HighScore {
  id: string;
  name: string;
  score: number;
  date: string;
}

export interface Note {
  id: string;
  text: string;
  date: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}