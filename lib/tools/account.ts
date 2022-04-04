import { Currency, ExchangeRates } from "./forex";

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
  switch (action.action) {
    case "setPlaces":
      return { ...state, places: action.places };
    case "setCurrency":
      return { ...state, currency: action.currency };
    case "setExchangeRates":
      return { ...state, exchangeRates: action.exchangeRates };
    case "setAmount":
      return { ...state, amount: action.amount };
    case "setMarginRisk":
      return { ...state, marginRisk: action.risk };
    case "setPositionRisk":
      return { ...state, positionRisk: action.risk };
    default:
      console.error("Unrecognized account action", action);
      return state;
  }
}
