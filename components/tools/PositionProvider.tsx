import React, { FC } from "react";
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

export const PositionProvider: FC = ({ children }) => {
  const [position, dispatch] = React.useReducer(positionReducer, {
    currency: "GBP",
    openPrice: 0,
    direction: "buy",
    margin: 0.05,
    takeProfit: null,
    stopLoss: null,
  });

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
