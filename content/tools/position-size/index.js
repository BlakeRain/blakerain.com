import { h, render, createContext } from "https://esm.sh/preact";
import { useEffect, useReducer } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";

async function getExchangeRates(base, target) {
  if (!target) {
    target = "AUD,CAD,EUR,GBP,JPY,USD";
  }

  const res = await fetch(`https://api.exchangerate.host/latest?base=${base}&symbols=${target}`);
  return { base, rates: await res.json() };
}

function getDefaultExchangeRates(base) {
  return {
    base,
    rates: { [base]: 1 }
  };
}

function getDefaultAccount(currency) {
  if (!currency) {
    currency = "GBP";
  }

  return {
    places: 4,
    currency,
    exchangeRates: getDefaultExchangeRates(currency),
    amount: 500,
    marginRisk: 0.01,
    positionRisk: 0.01
  };
}

function accountReducer(account, action) {
  switch (action.type) {
    case "setExchangeRates":
      return { ...account, exchangeRates: action.payload };
    default:
      console.error("Unknown action type", action.type);
      return account;
  }
}

const AccountContext = createContext();

function AccountProvider(props) {
  const [account, dispatcher] = useReducer(accountReducer, () => getDefaultAccount("GBP"));

  useEffect(() => {
    console.log(account);
    getExchangeRates(account.currency).then((result) => {
      dispatcher({ type: "setExchangeRates", payload: result.rates });
    })
  }, []);

  return html`
    <${AccountContext.Provider} value=${{ account, dispatcher }}>
      ${props.children}
    </${AccountContext.Provider}>
  `;
}

const html = htm.bind(h);

function App(props) {
  return html`
    <${AccountProvider}>

    </${AccountProvider}>
  `;
}

render(html`<${App} name="World" />`, document.getElementById("tool-container"));
