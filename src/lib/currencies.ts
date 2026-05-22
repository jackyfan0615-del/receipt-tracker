import type { Currency } from "./types";

export const DEFAULT_CURRENCY: Currency = "HKD";

export const CURRENCIES: {
  code: Currency;
  label: string;
  symbol: string;
}[] = [
  { code: "HKD", label: "港幣", symbol: "HK$" },
  { code: "TWD", label: "新台幣", symbol: "NT$" },
  { code: "USD", label: "美元", symbol: "US$" },
  { code: "JPY", label: "日圓", symbol: "¥" },
];

export function formatAmount(amount: number, currency: Currency): string {
  const info = CURRENCIES.find((c) => c.code === currency);
  const symbol = info?.symbol ?? currency;

  if (currency === "JPY") {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }

  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function isValidCurrency(value: string): value is Currency {
  return CURRENCIES.some((c) => c.code === value);
}
