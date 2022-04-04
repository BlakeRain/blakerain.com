export type Currency = "AUD" | "CAD" | "EUR" | "GBP" | "JPY" | "USD";

export const CURRENCIES: Currency[] = [
  "AUD",
  "CAD",
  "EUR",
  "GBP",
  "JPY",
  "USD",
];

export const CURRENCY_SYMBOLS: Map<Currency, string> = new Map([
  ["AUD", "$"],
  ["CAD", "$"],
  ["EUR", "€"],
  ["GBP", "£"],
  ["JPY", "¥"],
  ["USD", "$"],
]);

export interface ExchangeRates {
  /// The base currency
  base: Currency;
  /// The rates converting from this currency
  rates: Map<Currency, number>;
}

interface ExchangeRateResult {
  motd?: { msg?: string; url?: string };
  success: boolean;
  base: string;
  date: string;
  rates: { [key: string]: number };
}

export async function getExchangeRates(
  base: Currency,
  target?: Currency
): Promise<ExchangeRates> {
  const symbols = target || CURRENCIES.join(",");
  const res: ExchangeRateResult = await (
    await fetch(
      `https://api.exchangerate.host/latest?base=${base}&symbols=${symbols}`
    )
  ).json();

  const rates = new Map<Currency, number>();
  for (let symbol of Object.keys(res.rates)) {
    rates.set(symbol as Currency, res.rates[symbol]);
  }

  return { base, rates };
}
