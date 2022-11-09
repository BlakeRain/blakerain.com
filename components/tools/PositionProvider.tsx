import React, { FC, useEffect } from "react";
import { getExchangeRates } from "../../lib/tools/forex";
import {
  PositionAction,
  PositionInfo,
  positionReducer,
} from "../../lib/tools/position";

export interface PositionContextProps {
  position: PositionInfo;
  dispatch: React.Dispatch<PositionAction>;
}

export const PositionContext = React.createContext<
  PositionContextProps | undefined
>(undefined);

export const PositionProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const [position, dispatch] = React.useReducer(positionReducer, {
    posCurrency: "GBP",
    quoteCurrency: "GBP",
    conversion: 1,
    openPrice: 0,
    quantity: null,
    direction: "buy",
    margin: 0.05,
    takeProfit: null,
    stopLoss: null,
  });

  useEffect(() => {
    getExchangeRates(position.posCurrency, position.quoteCurrency).then(
      (exchangeRates) => {
        dispatch({
          action: "setConversion",
          conversion: exchangeRates.rates.get(position.quoteCurrency) || 1,
        });
      }
    );
  }, [position.posCurrency, position.quoteCurrency]);

  return (
    <PositionContext.Provider value={{ position, dispatch }}>
      {children}
    </PositionContext.Provider>
  );
};

export function usePosition(): PositionContextProps {
  const context = React.useContext(PositionContext);
  if (!context) {
    throw new Error("usePosition must be used within a PositionProvider");
  }

  return context;
}
