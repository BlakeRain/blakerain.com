import React, { FC, useEffect } from "react";
import {
  AccountAction,
  AccountInfo,
  accountReducer,
  loadAccount,
} from "../../lib/tools/account";
import { getExchangeRates } from "../../lib/tools/forex";

export interface AccountContextProps {
  account: AccountInfo;
  dispatch: React.Dispatch<AccountAction>;
}

export const AccountContext = React.createContext<
  AccountContextProps | undefined
>(undefined);

function load(): AccountInfo {
  const res = loadAccount();
  if (res === null) {
    return {
      places: 4,
      currency: "GBP",
      exchangeRates: {
        base: "GBP",
        rates: new Map(),
      },
      amount: 500,
      marginRisk: 0.01,
      positionRisk: 0.01,
    };
  }

  return res;
}

export const AccountProvider: FC = ({ children }) => {
  const [account, dispatch] = React.useReducer(accountReducer, load());

  useEffect(() => {
    getExchangeRates(account.currency).then((exchangeRates) => {
      dispatch({ action: "setExchangeRates", exchangeRates });
    });
  }, [account.currency]);

  return (
    <AccountContext.Provider value={{ account, dispatch }}>
      {children}
    </AccountContext.Provider>
  );
};

export function useAccount(): AccountContextProps {
  const context = React.useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within an AccountProvider");
  }

  return context;
}
