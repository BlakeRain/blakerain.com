import { AccountInfo } from "./account";
import { Currency } from "./forex";

export type Direction = "buy" | "sell";

export interface PositionInfo {
  posCurrency: Currency;
  quoteCurrency: Currency;
  conversion: number;
  openPrice: number;
  quantity: number | null;
  direction: Direction;
  margin: number;
  takeProfit: number | null;
  stopLoss: number | null;
}

export interface SetPosCurrencyPositionAction {
  action: "setPosCurrency";
  currency: Currency;
}

export interface SetQuoteCurrencyPositionAction {
  action: "setQuoteCurrency";
  currency: Currency;
}

export interface SetConversionPositionAction {
  action: "setConversion";
  conversion: number;
}

export interface SetOpenPricePositionAction {
  action: "setOpenPrice";
  openPrice: number;
}

export interface SetQuantityPositionAction {
  action: "setQuantity";
  quantity: number | null;
}

export interface SetDirectionPositionAction {
  action: "setDirection";
  direction: Direction;
}

export interface SetMarginPositionAction {
  action: "setMargin";
  margin: number;
}

export interface SetTakeProfitPositionAction {
  action: "setTakeProfit";
  takeProfit: number | null;
}

export interface SetStopLossPositionAction {
  action: "setStopLoss";
  stopLoss: number | null;
}

export type PositionAction =
  | SetPosCurrencyPositionAction
  | SetQuoteCurrencyPositionAction
  | SetConversionPositionAction
  | SetOpenPricePositionAction
  | SetQuantityPositionAction
  | SetDirectionPositionAction
  | SetMarginPositionAction
  | SetTakeProfitPositionAction
  | SetStopLossPositionAction;

export function positionReducer(
  state: PositionInfo,
  action: PositionAction
): PositionInfo {
  switch (action.action) {
    case "setPosCurrency":
      return { ...state, posCurrency: action.currency };
    case "setQuoteCurrency":
      return { ...state, quoteCurrency: action.currency };
    case "setConversion":
      return { ...state, conversion: action.conversion };
    case "setOpenPrice":
      return { ...state, openPrice: action.openPrice };
    case "setQuantity":
      return { ...state, quantity: action.quantity };
    case "setDirection": {
      let takeProfit = state.takeProfit;
      let stopLoss = state.stopLoss;

      if (state.direction !== action.direction) {
        if (typeof takeProfit === "number") {
          let tp_distance =
            state.direction === "buy"
              ? takeProfit - state.openPrice
              : state.openPrice - takeProfit;
          takeProfit =
            action.direction === "buy"
              ? state.openPrice + tp_distance
              : state.openPrice - tp_distance;
        }

        if (typeof stopLoss === "number") {
          let sl_distance =
            state.direction === "buy"
              ? state.openPrice - stopLoss
              : stopLoss - state.openPrice;
          stopLoss =
            action.direction === "buy"
              ? state.openPrice - sl_distance
              : state.openPrice + sl_distance;
        }
      }

      return { ...state, direction: action.direction, takeProfit, stopLoss };
    }
    case "setMargin":
      return { ...state, margin: action.margin };
    case "setTakeProfit":
      return { ...state, takeProfit: action.takeProfit };
    case "setStopLoss":
      return { ...state, stopLoss: action.stopLoss };
    default:
      console.error("Unrecognized position action", action);
      return state;
  }
}

interface PositionSize {
  /// Funds available under margin risk (in account currency)
  available: number;
  /// Funds available under margin risk (in position currency)
  availablePos: number;
  /// Funds available under margin risk (in quote currency)
  availableQuote: number;
  /// Margin available under margin risk (in account currency)
  margin: number;
  /// Margin available (in position currency)
  marginPos: number;
  /// Margin available (in quote currency)
  marginQuote: number;
  /// Quantity affordable at position price (as units)
  quantity: number;
  /// Optional actual position size margin risk
  actual: null | {
    /// The actual quote cost (in quote currency)
    costQuote: number;
    /// The actual position const (in position currency)
    costPos: number;
    /// The actual position cost (in account currency)
    cost: number;
    /// The account margin required (as a %)
    margin: number;
  };
}

export function computePositionSize(
  account: AccountInfo,
  position: PositionInfo
): PositionSize {
  const p_rate = account.exchangeRates.rates.get(position.posCurrency) || 1;
  const q_rate = position.conversion;
  const available = account.amount * account.marginRisk;
  const availablePos = available * p_rate;
  const availableQuote = availablePos * q_rate;
  const margin = available / (position.margin || 1);
  const marginPos = margin * p_rate;
  const marginQuote = marginPos * q_rate;
  const quantity = marginQuote / position.openPrice;

  const computeActual = (actualQuantity: number) => {
    const costQuote = actualQuantity * position.openPrice * position.margin;
    const costPos = costQuote / q_rate;
    const cost = costPos / p_rate;
    const margin = cost / account.amount;

    return { costQuote, costPos, cost, margin };
  };

  const actual =
    typeof position.quantity === "number"
      ? computeActual(position.quantity)
      : null;

  return {
    available,
    availablePos,
    availableQuote,
    margin,
    marginPos,
    marginQuote,
    quantity,
    actual,
  };
}

interface StopLoss {
  /// Funds available under position risk (in account currency)
  available: number;
  /// Funds available under position risk (in position currency)
  availablePos: number;
  /// Funds available under position risk (in quote currency)
  availableQuote: number;
  /// Specified position size
  quantity: number;
  /// Required stop-loss distance
  distance: number;
  /// Optional actual stop-loss assessment
  actual: null | {
    /// The actual stop-loss distance (in position currency)
    distance: number;
    /// The possible loss
    loss: number;
    /// The actual position risk (as a %)
    risk: number;
  };
}

export function computeStopLoss(
  account: AccountInfo,
  position: PositionInfo,
  quantity: number
): StopLoss {
  const p_rate = account.exchangeRates.rates.get(position.posCurrency) || 1;
  const q_rate = position.conversion;
  const available = account.amount * account.positionRisk;
  const availablePos = available * p_rate;
  const availableQuote = availablePos * q_rate;
  const distance = quantity === 0 ? 0 : availableQuote / quantity;

  const computeActual = (stopLoss: number) => {
    const actualDistance =
      position.direction === "buy"
        ? position.openPrice - stopLoss
        : stopLoss - position.openPrice;
    const loss = (actualDistance * quantity) / (p_rate * q_rate);
    const risk = loss / account.amount;

    return {
      distance: actualDistance,
      loss,
      risk,
    };
  };

  const actual =
    typeof position.stopLoss === "number"
      ? computeActual(position.stopLoss)
      : null;

  return {
    available,
    availablePos,
    availableQuote,
    quantity,
    distance,
    actual,
  };
}

interface StopLossQuantity {
  /// Funds available under position risk (in account currency)
  available: number;
  /// Funds available under position risk (in position currency)
  availablePos: number;
  /// Funds available under positin risk (in quote currency)
  availableQuote: number;
  /// Computed stop loss distance (in position currency)
  stopLossDistance: number;
  /// Amount that can be bought at the given stop loss (as units)
  quantity: number;
  /// Required margin for that amount (in account currency)
  margin: number;
}

export function computedStopLossQuantity(
  account: AccountInfo,
  position: PositionInfo
): StopLossQuantity {
  const stopLossDistance =
    typeof position.stopLoss === "number"
      ? position.direction === "buy"
        ? position.openPrice - position.stopLoss
        : position.stopLoss - position.openPrice
      : 0;

  const p_rate = account.exchangeRates.rates.get(position.posCurrency) || 1;
  const q_rate = position.conversion;
  const available = account.amount * account.positionRisk;
  const availablePos = available * p_rate;
  const availableQuote = availablePos * q_rate;
  const quantity = availableQuote / stopLossDistance;
  const margin =
    (quantity * position.openPrice * position.margin) / (p_rate * q_rate);

  return {
    available,
    availablePos,
    availableQuote,
    stopLossDistance,
    quantity,
    margin,
  };
}
