import { Currency } from "./forex";

export type Direction = "buy" | "sell";

export interface PositionInfo {
  currency: Currency;
  openPrice: number;
  direction: Direction;
  margin: number;
  takeProfit: number | null;
  stopLoss: number | null;
}

export interface SetCurrencyPositionAction {
  action: "setCurrency";
  currency: Currency;
}

export interface SetOpenPricePositionAction {
  action: "setOpenPrice";
  openPrice: number;
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
  | SetCurrencyPositionAction
  | SetOpenPricePositionAction
  | SetDirectionPositionAction
  | SetMarginPositionAction
  | SetTakeProfitPositionAction
  | SetStopLossPositionAction;

export function positionReducer(
  state: PositionInfo,
  action: PositionAction
): PositionInfo {
  switch (action.action) {
    case "setCurrency":
      return { ...state, currency: action.currency };
    case "setOpenPrice":
      return { ...state, openPrice: action.openPrice };
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
