import { Currency, ExchangeRates } from "./forex";

const ACCOUNT_VERSION: number = 1;

export interface AccountInfo {
  places: number;
  currency: Currency;
  exchangeRates: ExchangeRates;
  amount: number;
  marginRisk: number;
  positionRisk: number;
}

export interface SetPlacesAccountAction {
  action: "setPlaces";
  places: number;
}

export interface SetCurrencyAccountAction {
  action: "setCurrency";
  currency: Currency;
}

export interface SetExchangeRatesAccountAction {
  action: "setExchangeRates";
  exchangeRates: ExchangeRates;
}

export interface SetAmountAccountAction {
  action: "setAmount";
  amount: number;
}

export interface SetMarginRiskAction {
  action: "setMarginRisk";
  risk: number;
}

export interface SetPositionRiskAction {
  action: "setPositionRisk";
  risk: number;
}

export type AccountAction =
  | SetPlacesAccountAction
  | SetCurrencyAccountAction
  | SetExchangeRatesAccountAction
  | SetAmountAccountAction
  | SetMarginRiskAction
  | SetPositionRiskAction;

export function accountReducer(
  state: AccountInfo,
  action: AccountAction
): AccountInfo {
  let new_value = null;
  switch (action.action) {
    case "setPlaces":
      new_value = { ...state, places: action.places };
      break;
    case "setCurrency":
      new_value = { ...state, currency: action.currency };
      break;
    case "setExchangeRates":
      new_value = { ...state, exchangeRates: action.exchangeRates };
      break;
    case "setAmount":
      new_value = { ...state, amount: action.amount };
      break;
    case "setMarginRisk":
      new_value = { ...state, marginRisk: action.risk };
      break;
    case "setPositionRisk":
      new_value = { ...state, positionRisk: action.risk };
      break;
    default:
      console.error("Unrecognized account action", action);
      return state;
  }

  storeAccount(new_value);
  return new_value;
}

export function storeAccount(account: AccountInfo) {
  window.localStorage.setItem(
    "blakerain.tools.accountinfo",
    JSON.stringify({
      ...account,
      exchangeRates: {
        base: account.currency,
        rates: Array.from(account.exchangeRates.rates).reduce(
          (obj, [key, value]) => {
            obj[key] = value;
            return obj;
          },
          {} as { [currency: string]: number }
        ),
      },
      __version: ACCOUNT_VERSION,
    })
  );
}

export function deleteStoredAccount() {
  window.localStorage.removeItem("blakerain.tools.accountinfo");
}

export function loadAccount(): AccountInfo | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem("blakerain.tools.accountinfo");
  if (typeof value === "string") {
    const account = JSON.parse(value) as AccountInfo & {
      exchangeRates: { rates: { [name: string]: number } };
      __version: number;
    };

    if (
      typeof account.__version !== "number" ||
      account.__version !== ACCOUNT_VERSION
    ) {
      deleteStoredAccount();
      return null;
    }

    const rates = new Map<Currency, number>();
    for (let symbol of Object.keys(account.exchangeRates.rates)) {
      rates.set(symbol as Currency, account.exchangeRates.rates[symbol]);
    }

    return {
      ...account,
      exchangeRates: {
        base: account.currency,
        rates,
      },
    };
  }

  return null;
}
