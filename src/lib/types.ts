export type Currency = "HKD" | "TWD" | "USD" | "JPY";

export interface Receipt {
  id: string;
  title: string;
  amount: number;
  currency: Currency;
  category: string | null;
  merchant: string | null;
  date: string;
  notes: string | null;
  imagePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptAnalysis {
  title: string;
  amount: number;
  currency: Currency;
  category: string | null;
  merchant: string | null;
  date: string;
  notes: string | null;
}

export interface CreateReceiptInput {
  title: string;
  amount: number;
  currency: Currency;
  category?: string | null;
  merchant?: string | null;
  date: string;
  notes?: string | null;
}
