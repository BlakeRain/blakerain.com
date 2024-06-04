import { h, render, createContext } from "https://esm.sh/preact";
import { useContext, useEffect, useReducer, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

function formatNumber(value, thousands, places, prefix, suffix) {
  const aval = Math.abs(value);
  const neg = value < 0 ? "-" : "";

  const formatter = new Intl.NumberFormat(undefined, {
    style: "decimal",
    useGrouping: thousands ? "always" : false,
    minimumFractionDigits: places
  });

  return neg + (prefix || "") + formatter.format(aval) + (suffix || "");
}

const CURRENCY_SYMBOLS = {
  "AUD": "$",
  "CAD": "$",
  "EUR": "€",
  "GBP": "£",
  "JPY": "¥",
  "USD": "$"
};

async function getExchangeRates(base, target) {
  if (!target) {
    target = "AUD,CAD,EUR,GBP,JPY,USD";
  }

  const res = await fetch(`https://api.fxratesapi.com/latest?base=${base}&symbols=${target}`)
  return { base, rates: (await res.json()).rates };
}

function getDefaultExchangeRates(base) {
  return {
    [base]: 1
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
    case "setPlaces":
      return { ...account, places: action.payload };
    case "setCurrency":
      return { ...account, currency: action.payload };
    case "setExchangeRates":
      return { ...account, exchangeRates: action.payload };
    case "setAmount":
      return { ...account, amount: action.payload };
    case "setMarginRisk":
      return { ...account, marginRisk: action.payload };
    case "setPositionRisk":
      return { ...account, positionRisk: action.payload };
    default:
      console.error("Unknown action type", action.type);
      return account;
  }
}

const AccountContext = createContext();

function AccountProvider(props) {
  const [account, dispatch] = useReducer(accountReducer, () => getDefaultAccount("GBP"));

  useEffect(() => {
    getExchangeRates(account.currency).then((result) => {
      dispatch({ type: "setExchangeRates", payload: result.rates });
    })
  }, [account.currency]);

  return html`
    <${AccountContext.Provider} value=${{ account, dispatch }}>
      ${props.children}
    </${AccountContext.Provider}>
  `;
}

function getDefaultPosition(currency) {
  if (!currency) {
    currency = "GBP";
  }

  return {
    positionCurrency: currency,
    quoteCurrency: currency,
    conversion: 1,
    openPrice: 0,
    quantity: null,
    direction: "BUY",
    margin: 0.05,
    takeProfit: null,
    stopLoss: null
  };
}

function positionReducer(position, action) {
  switch (action.type) {
    case "setPositionCurrency":
      return { ...position, positionCurrency: action.payload };
    case "setQuoteCurrency":
      return { ...position, quoteCurrency: action.payload };
    case "setConversion":
      return { ...position, conversion: action.payload };
    case "setOpenPrice":
      return { ...position, openPrice: action.payload };
    case "setQuantity":
      return { ...position, quantity: action.payload };
    case "setDirection":
      return { ...position, direction: action.payload };
    case "setMargin":
      return { ...position, margin: action.payload };
    case "setTakeProfit":
      return { ...position, takeProfit: action.payload };
    case "setStopLoss":
      return { ...position, stopLoss: action.payload };
    default:
      console.error("Unknown action type", action.type);
      return position;
  }
}

const PositionContext = createContext();

function PositionProvider(props) {
  const [position, dispatch] = useReducer(positionReducer, () => getDefaultPosition("GBP"));

  return html`
    <${PositionContext.Provider} value=${{ position, dispatch }}>
      ${props.children}
    </${PositionContext.Provider}>
  `;
}

function computePositionSize(account, position) {
  const pRate = account.exchangeRates[position.positionCurrency] || 1;
  const qRate = position.conversion;
  const available = account.amount * account.marginRisk;
  const availablePosition = available * pRate;
  const availableQuote = availablePosition * qRate;

  const margin = available / (position.margin === 0 ? 1 : position.margin);
  const marginPosition = margin * pRate;
  const marginQuote = marginPosition * qRate;

  const affordable = position.openPrice === 0 ? 0 : (marginQuote / position.openPrice);

  return {
    available,
    availablePosition,
    availableQuote,
    margin,
    marginPosition,
    marginQuote,
    affordable,
    actual: computeActualPositionSize(account, position, pRate, qRate)
  }
}

function computeActualPositionSize(account, position, qRate, pRate) {
  if (position.quantity === null) {
    return null;
  }

  const costQuote = position.quantity * position.openPrice * position.margin;
  const costPosition= costQuote / qRate;
  const cost = costPosition / pRate;
  const margin = cost / account.amount;

  return {
    cost,
    costQuote,
    costPosition,
    margin,
  };
}

function computeStopLoss(account, position, quantity) {
  const pRate = account.exchangeRates[position.positionCurrency] || 1;
  const qRate = position.conversion;
  const available = account.amount * account.positionRisk;
  const availablePosition = available * pRate;
  const availableQuote = availablePosition * qRate;
  const distance = quantity === 0 ? 0 : (availableQuote / quantity);

  return {
    available,
    availablePosition,
    availableQuote,
    distance,
    actual: computeActualStopLoss(account, position, pRate, qRate)
  };
}

function computeActualStopLoss(account, position, pRate, qRate) {
  if (position.stopLoss === null) {
    return null;
  }

  const distance = position.direction === "BUY" ? (position.openPrice - position.stopLoss) : (position.stopLoss - position.openPrice);
  const loss = (distance * position.quantity) / (pRate * qRate);
  const risk = loss / account.amount;

  return {
    distance,
    loss,
    risk,
  };
}

function computeStopLossQuantity(account, position) {
  const distance = position.stopLoss === null ? 0 : (position.direction === "BUY" ? (position.openPrice - position.stopLoss) : (position.stopLoss - position.openPrice));
  const pRate = account.exchangeRates[position.positionCurrency] || 1;
  const qRate = position.conversion;
  const available = account.amount * account.positionRisk;
  const availablePosition = available * pRate;
  const availableQuote = availablePosition * qRate;
  const affordable = availableQuote / distance;
  const margin = (affordable * position.openPrice * position.margin) / (pRate * qRate);

  return {
    available,
    availablePosition,
    availableQuote,
    distance,
    affordable,
    margin,
  };
}

function Label(props) {
  const klass = `flex flex-col gap-2 ${props.class || ""}`;

  return html`
    <div class=${klass}>
      <label class="text-sm font-medium">
        ${props.title}
      </label>
      ${props.children}
    </div>
  `;
}

function Number(props) {
  const [inputValue, setInputValue] = useState(formatNumber(props.value, false, props.places, null, null));
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!focused) {
      setInputValue(formatNumber(props.value, false, props.places, null, null))
    }
  }, [props.value, props.places]);

  const parseInput = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      setInputValue(formatNumber(parsed, false, props.places, null, null));
      props.onchange(parsed);
    }
  };

  const onfocus = () => {
    setFocused(true);
    window.setTimeout(() => {
      inputRef.current.select();
    }, 50);
  };

  const onblur = () => {
    setFocused(false);
    parseInput();
  };

  const onchange = () => parseInput();

  const oninput = (event) => {
    setInputValue(event.target.value);
  };

  const rendered = focused ? inputValue : formatNumber(props.value, props.thousands, props.places, props.prefix, props.suffix);

  return html`
    <input
      ref=${inputRef}
      class=${"field text-right " + props.class}
      type="text"
      id=${props.id}
      name=${props.name}
      placeholder=${props.placeholder}
      disabled=${props.disabled}
      value=${rendered}
      onfocus=${onfocus}
      onblur=${onblur}
      onchange=${onchange}
      oninput=${oninput} />
  `;
}

function Toggle(props) {
  const klass = "toggle " + (props.value ? "active" : "inactive") + (props.disabled ? " disabled " : " ") + props.class;
  const label = props.label ? html`<div>${props.label}</div>` : null;

  const onclick = () => {
    if (!props.disabled) {
      props.onchange(!props.value);
    }
  };

  return html`
    <div class="flex flex-row items-center gap-2">
      <div class=${klass} onclick=${onclick}>
        <div class="toggle-background"></div>
        <div class="toggle-inner"></div>
      </div>
      ${label}
    </div>
  `;
}

function Tooltip(props) {
  const [open, setOpen] = useState(false);

  const onmouseover = () => setOpen(true);
  const onmouseout = () => setOpen(false);

  const tooltip = `tooltip ${props.position || "top"}`;
  const popup = open ? html`
    <div class=${tooltip}>
      <div class="relative">
        ${props.children}
      </div>
    </div>
  ` : null;

  return html`
    <div class="relative inline-block cursor-pointer mx-2" onmouseover=${onmouseover} onmouseout=${onmouseout}>
      <svg xmlns="http://www.w3.org/2000/svg" data-license="From https://github.com/twbs/icons - Licensed under MIT" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
        <title>BOOTSTRAP_QUESTION_CIRCLE_FILL</title>
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.496 6.033h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286a.237.237 0 0 0 .241.247zm2.325 6.443c.61 0 1.029-.394 1.029-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94 0 .533.425.927 1.01.927z"></path>
      </svg>
      ${popup}
    </div>
  `;
}

function Panel(props) {
  const start = props.skip ? "md:col-start-2" : "";
  const klass = `flex flex-col gap-8 border border-primary rounded-md p-4 ${start}`;

  return html`
    <div class=${klass}>
      <h1 class="text-2xl font-semibold">${props.title}</h1>
      <div class=${props.class}>
        ${props.children}
      </div>
    </div>
  `;
}

function Table(props) {
  const klass = `tighter borderless ${props.class || ""}`;

  return html`
    <table class=${klass}>
      <tbody>
        ${props.children}
      </tbody>
    </table>
  `;
}

function TableRow(props) {
  const title = props.title ? html`<th class="text-left">${props.title}</th>` : html`<th></th>`;
  const number = formatNumber(props.value, true, props.places, props.currency ? CURRENCY_SYMBOLS[props.currency] : null, props.suffix);
  const tooltip = props.children ? html`<${Tooltip} position=${props.tooltipPosition}>${props.children}</${Tooltip}>` : null;

  return html`
    <tr class=${props.error ? "text-red-500" : ""}>
      ${title}
      <td class="text-right">
        ${number}
        ${tooltip}
      </td>
    </tr>
  `;
}

function CurrencySelect(props) {
  const currencies = ["GBP", "USD", "EUR", "AUD", "CAD", "JPY"].map((currency) => {
    return html`<option value=${currency}>${currency}</option>`
  });

  const onchange = (event) => props.onchange(event.target.value);

  return html`
    <select class="field" onchange=${onchange} value=${props.value}>
      ${currencies}
    </select>
  `
}

function AccountInfo() {
  const { account, dispatch } = useContext(AccountContext);
  const { position } = useContext(PositionContext);

  const pc = account.currency !== position.positionCurrency;
  const qc = position.positionCurrency !== position.quoteCurrency;

  const onAmountChange = (value) => dispatch({ type: "setAmount", payload: value });
  const onMarginRiskChange = (value) => dispatch({ type: "setMarginRisk", payload: value / 100 });
  const onPositionRiskChange = (value) => dispatch({ type: "setPositionRisk", payload: value / 100 });
  const onPlacesChange = (value) => dispatch({ type: "setPlaces", payload: value });

  const pcRow = pc ? html`
    <tr>
      <td>${account.currency}${position.positionCurrency}</td>
      <td class="text-right">
        ${formatNumber(account.exchangeRates[position.positionCurrency] || 0, false, account.places, CURRENCY_SYMBOLS[position.positionCurrency], null)}
      </td>
    </tr>
  ` : null;

  const qcRow = qc ? html`
    <tr>
      <td>${position.positionCurrency}${position.quoteCurrency}</td>
      <td class="text-right">
        ${formatNumber(position.conversion, false, account.places, CURRENCY_SYMBOLS[position.quoteCurrency], null)}
      </td>
    </tr>
  ` : null;

  const rateTable = (pc || qc) ? html`
    <div class="table-wrapper">
      <table class="tighter">
        <thead>
          <tr>
            <th>Currency Pair</th>
            <th>Exchange Rate</th>
          </tr>
        </thead>
        <tbody>
          ${pcRow}
          ${qcRow}
        </tbody>
      </table>
    </div>
  ` : null;

  return html`
  <${Panel} title="Account Information" class="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
    <${Label} title="Account Currency">
      <${CurrencySelect} value=${account.currency} onchange=${(currency) => dispatch({ type: "setCurrency", payload: currency })} />
    </${Label}>
    <${Label} title="Account Value">
      <${Number} thousands prefix=${CURRENCY_SYMBOLS[account.currency]} places=${account.places} value=${account.amount} onchange=${onAmountChange} />
    </${Label}>
    <${Label} title="Margin Risk">
      <${Number} value=${account.marginRisk * 100} places=${0} suffix="%" onchange=${onMarginRiskChange} />
    </${Label}>
    <${Label} title="Position Risk">
      <${Number} value=${account.positionRisk * 100} places=${0} suffix="%" onchange=${onPositionRiskChange} />
    </${Label}>
    <${Label} title="Decimal Places">
      <${Number} value=${account.places} places=${0} suffix=" digits" onchange=${onPlacesChange} />
    </${Label}>
    ${rateTable}
  </${Panel}>
  `;
}

function PositionInfo() {
  const { account } = useContext(AccountContext);
  const { position, dispatch } = useContext(PositionContext);

  const onPositionCurrencyChange = (currency) => dispatch({ type: "setPositionCurrency", payload: currency });
  const onQuoteCurrencyChange = (currency) => dispatch({ type: "setQuoteCurrency", payload: currency });
  const onMarginChange = (margin) => dispatch({ type: "setMargin", payload: margin / 100 });
  const onDirectionChange = (direction) => dispatch({ type: "setDirection", payload: direction });
  const onPriceChange = (value) => dispatch({ type: "setOpenPrice", payload: value });
  const onQuantityToggle = (value) => dispatch({ type: "setQuantity", payload: value ? 1 : null })
  const onQuantityChange = (value) => dispatch({ type: "setQuantity", payload: value });
  const onStopLossToggle = (value) => dispatch({ type: "setStopLoss", payload: value ? position.openPrice : null });
  const onStopLossChange = (value) => dispatch({ type: "setStopLoss", payload: value });
  const onTakeProfitToggle = (value) => dispatch({ type: "setTakeProfit", payload: value ? position.openPrice : null });
  const onTakeProfitChange = (value) => dispatch({ type: "setTakeProfit", payload: value });

  const onStopLossDistanceChange = (value) => dispatch({
    type: "setStopLoss",
    payload: position.direction === "BUY" ? position.openPrice - value : position.openPrice + value
  });

  const onTakeProfitDistanceChange = (value) => dispatch({
    type: "setTakeProfit",
    payload: position.direction === "BUY" ? position.openPrice + value : position.openPrice - value
  });

  const onAffordableClick = () => {
    if (!position.quantity) {
      return;
    }

    const { affordable } = computePositionSize(account, position);
    dispatch({
      type: "setQuantity",
      payload: affordable
    });
  };

  const onStopLossClick = () => {
    if (!position.quantity) {
      return;
    }

    const { affordable } = computeStopLossQuantity(account, position);
    dispatch({
      type: "setQuantity",
      payload: affordable
    });
  };

  const positionLeverage = position.margin !== 0 ? ` (${formatNumber(1 / position.margin, false, 0, null, null)}x leverage)` : "";
  const positionMargin = `Position Margin${positionLeverage}`;

  const takeProfitDistance = position.takeProfit === null ? 0 : (position.direction === "BUY" ? position.takeProfit - position.openPrice : position.openPrice - position.takeProfit);
  const stopLossDistance = position.stopLoss === null ? 0 : (position.direction === "BUY" ? position.openPrice - position.stopLoss : position.stopLoss - position.openPrice);

  return html`
    <${Panel} title="Position Information" class="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
      <div class="grid grid-cols-2 gap-4">
        <${Label} title="Position">
          <${CurrencySelect} value=${position.positionCurrency} onchange=${onPositionCurrencyChange} />
        </${Label}>
        <${Label} title="Quote">
          <${CurrencySelect} value=${position.quoteCurrency} onchange=${onQuoteCurrencyChange} />
        </${Label}>
      </div>
      <${Label} title=${positionMargin}>
        <${Number} value=${position.margin * 100} places=${2} suffix="%" onchange=${onMarginChange} />
      </${Label}>
      <${Label} title="Position Direction">
        <select class="field" value=${position.direction} onchange=${onDirectionChange}>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
      </${Label}>
      <${Label} title="Open Price">
        <${Number} value=${position.openPrice} thousands places=${account.places} prefix=${CURRENCY_SYMBOLS[position.quoteCurrency]} onchange=${onPriceChange} />
      </${Label}>
      <${Label} title="Quantity" class="col-start-1">
        <div class="flex flex-row gap-4">
          <${Toggle} value=${position.quantity !== null} onchange=${onQuantityToggle} />
          <${Number} class="w-full" value=${position.quantity || 0} thousands places=${4} suffix=" units" disabled=${position.quantity === null} onchange=${onQuantityChange} />
        </div>
      </${Label}>
      <div class="grid grid-flow-col justify-stretch gap-2 pt-7">
        <button type="button" class="button" onclick=${onAffordableClick} disabled=${position.quantity === null || position.openPrice === 0}>Affordable Quantity</button>
        <button type="button" class="button" onclick=${onStopLossClick} disabled=${position.stopLoss === null || stopLossDistance === 0}>Stop Loss Quantity</button>
      </div>
      <${Label} title="Stop Loss">
        <div class="flex flex-row gap-4">
          <${Toggle} value=${position.stopLoss !== null} onchange=${onStopLossToggle} />
          <${Number} class="w-full" value=${position.stopLoss || 0} thousands places=${account.places} prefix=${CURRENCY_SYMBOLS[position.quoteCurrency]} disabled=${position.stopLoss === null} onchange=${onStopLossChange} />
        </div>
      </${Label}>
      <${Label} title="Stop Loss Distance">
        <${Number} value=${stopLossDistance} thousands places=${account.places} prefix=${CURRENCY_SYMBOLS[position.quoteCurrency]} disabled=${position.stopLoss === null} onchange=${onStopLossDistanceChange} />
      </${Label}>
      <${Label} title="Take Profit">
        <div class="flex flex-row gap-4">
          <${Toggle} value=${position.takeProfit !== null} onchange=${onTakeProfitToggle} />
          <${Number} class="w-full" value=${position.takeProfit || 0} thousands places=${account.places} prefix=${CURRENCY_SYMBOLS[position.quoteCurrency]} disabled=${position.takeProfit === null} onchange=${onTakeProfitChange} />
        </div>
      </${Label}>
      <${Label} title="Take Profit Distance">
        <${Number} value=${takeProfitDistance} thousands places=${account.places} prefix=${CURRENCY_SYMBOLS[position.quoteCurrency]} disabled=${position.takeProfit === null} onchange=${onTakeProfitDistanceChange} />
      </${Label}>
    </${Panel}>
  `;
}

function ReportPositionSize() {
  const { account } = useContext(AccountContext);
  const { position } = useContext(PositionContext);

  const { available, availablePosition, availableQuote, margin, marginPosition, marginQuote, affordable, actual } = computePositionSize(account, position);

  const qc = CURRENCY_SYMBOLS[position.quoteCurrency];
  const ap = account.currency !== position.positionCurrency;
  const pq = position.positionCurrency !== position.quoteCurrency;

  const marginFormat = formatNumber(position.margin * 100, true, 2, null, "%");
  const quantityFormat = formatNumber(position.quantity || 0, true, 2, null, " units");
  const openPriceFormat = formatNumber(position.openPrice, true, account.places, qc, null);

  const excessRisk = actual ? ( Math.round(actual.margin * 100) > account.marginRisk * 100 ) : false;
  const actualTable = actual ? html`
    <${TableRow} title="Actual Quantity" value=${position.quantity} places=${2} suffix=" units">
      Quantity entered into the position form.
    </${TableRow}>
    <${TableRow} title="Actual Cost" value=${position.quantity * position.openPrice} places=${account.places} currency=${position.quoteCurrency}>
      Actual const of opening a position of ${quantityFormat} units at ${openPriceFormat}.
    </${TableRow}>
    <${TableRow} title="Required Margin" value=${actual.costQuote} places=${account.places} currency=${position.quoteCurrency}>
      Ammount required at ${marginFormat} position margin (${formatNumber(1 / (position.margin === 0 ? 1 : position.margin), false, 0, null, null)}x leverage)
    </${TableRow}>
    ${pq && html`<${TableRow} value=${actual.costPosition} places=${account.places} currency=${position.positionCurrency}>
      Amount required at ${marginFormat} margin, converted into the position currency.
    </${TableRow}`}
    ${ap && html`<${TableRow} value=${actual.cost} places=${account.places} currency=${account.currency}>
      Amount required at ${marginFormat} margin, converted into the account currency.
    </${TableRow}`}
    <${TableRow} title="Committed Account" value=${actual.margin * 100} places=${2} suffix="%" error=${excessRisk}>
      The percentage of the account that will be committed as margin to open the position.
    </${TableRow}>
    ${excessRisk && html`
      <tr class="text-red-500">
        <th colSpan="2" class="text-left font-normal">
          Actual quantity of ${quantityFormat} exceeds account margin risk
          of ${formatNumber(account.marginRisk * 100, true, 2, null, "%")}
          by ${formatNumber(actual.cost - available, true, account.places, CURRENCY_SYMBOLS[account.currency], null)}.
        </th>
      </tr>
    `}
  ` : null;

  return html`
    <${Panel} title="Position Size Information">
      <${Table}>
        <${TableRow} title="Available Account" value=${available} places=${account.places} currency=${account.currency}>
          Amount of account available under margin risk in the account currency.
        </${TableRow}>
        ${ap && html`<${TableRow} value=${availablePosition} places=${account.places} currency=${position.positionCurrency}>
          Amount of account available under margin risk in the position currency.
        </${TableRow}>`}
        ${pq && html`<${TableRow} value=${availableQuote} places=${account.places} currency=${position.quoteCurrency}>
          Amount of account available under margin risk in the quote currency.
        </${TableRow}>`}
        <${TableRow} title="Available Margin" value=${margin} places=${account.places} currency=${account.currency}>
          Available amount with a ${marginFormat} position margin.
        </${TableRow}>
        ${ap && html`<${TableRow} value=${marginPosition} places=${account.places} currency=${position.positionCurrency}>
          Available amount with a ${marginFormat} position margin converted to the position currency.
        </${TableRow}>`}
        ${pq && html`<${TableRow} value=${marginQuote} places=${account.places} currency=${position.quoteCurrency}>
          Available amount with a ${marginFormat} position margin converted to the quote currency.
        </${TableRow}>`}
        <${TableRow} title="Affordable Quantity" value=${affordable} places=${2} suffix=" units">
          Position size that can be taken at an open price of ${openPriceFormat} with an
          available margin of ${formatNumber(marginQuote, true, account.places, qc, null)}.
        </${TableRow}>
        ${actualTable}
      </${Table}>
    </${Panel}>
  `;
}

function ReportStopLoss() {
  const { account } = useContext(AccountContext);
  const { position } = useContext(PositionContext);

  const ac = CURRENCY_SYMBOLS[account.currency];
  const qc = CURRENCY_SYMBOLS[position.quoteCurrency];
  const ap = account.currency !== position.positionCurrency;
  const pq = position.positionCurrency !== position.quoteCurrency;

  const positionRiskFormat = formatNumber(account.positionRisk * 100, true, 2, null, "%");
  const quantity = position.quantity !== null ? position.quantity : computePositionSize(account, position).affordable;
  const quantityFormat = formatNumber(quantity, true, 2, null, " units");
  const openPriceFormat = formatNumber(position.openPrice, true, account.places, qc, null);

  const { available, availablePosition, availableQuote, distance, actual } = computeStopLoss(account, position, quantity);

  const maximumStopLoss = position.direction === "BUY" ? position.openPrice - distance : position.openPrice + distance;

  let actualTable = null;
  if (actual) {
    const { distance, loss, risk } = actual;
    const excessRisk = Math.round(100 * risk) > (account.positionRisk * 100);
    const stopLossFormat = formatNumber(position.stopLoss || 0, true, account.places, qc, null);

    actualTable = html`
      <tr />
      <${TableRow} title="Actual Distance" value=${distance} places=${account.places} currency=${position.positionCurrency}>
        The distance provided in the position form.
      </${TableRow}>
      <${TableRow} title="Actual Loss" value=${loss} places=${account.places} currency=${account.currency}>
        The actual account loss that will be incurred should the position close at the provided
        stop loss position of ${stopLossFormat}.
      </${TableRow}>
      <${TableRow} title="Actual Risk" error=${excessRisk} value=${risk * 100} places=${2} suffix="%">
        Percentage of account at risk for the provided stop loss position of ${stopLossFormat}.
      </${TableRow}>
      ${excessRisk && html`
        <tr class="text-red-500">
          <th colSpan="2" class="text-left font-normal">
            Actual stop loss of ${stopLossFormat} exceeds account position risk of ${positionRiskFormat} by ${formatNumber(loss - available, true, account.places, ac, null)}.
          </th>
        </tr>
      `}
    `;
  }

  return html`
    <${Panel} title="Stop Loss Position" class="flex flex-col gap-4">
      <${Table}>
        <${TableRow} title="Available Account" value=${available} places=${account.places} currency=${account.currency}>
          Amount of account available under position risk of ${positionRiskFormat}.
        </${TableRow}>
        ${ap && html`<${TableRow} value=${availablePosition} places=${account.places} currency=${position.positionCurrency}>
          Amount of account available under position risk of ${positionRiskFormat} in the position currency.
        </${TableRow}>`}
        ${pq && html`<${TableRow} value=${availableQuote} places=${account.places} currency=${position.quoteCurrency}>
          Amount of account available under position risk of ${positionRiskFormat} in the quote currency.
        </${TableRow}>`}
        <${TableRow} title="Maximum Stop Loss Price Distance" value=${distance} places=${account.places} currency=${position.positionCurrency}>
          The maximum stop loss distance for a position of ${quantityFormat} at ${openPriceFormat} to remain within the position risk of ${positionRiskFormat} of the account.
        </${TableRow}>
        <${TableRow} title="Maximum Stop Loss" value=${maximumStopLoss} places=${account.places} currency=${position.positionCurrency}>
          The maximum stop loss for a position of ${quantityFormat} at ${openPriceFormat} to remain within the position risk of ${positionRiskFormat} of the account.
        </${TableRow}>
        ${actualTable}
      </${Table}>
      <p class="text-neutral-500 text-sm">
        This panel shows the maximum available stop loss, given the ${position.quantity ? "specified" : "calculated"} position size of ${quantityFormat}, and the account position risk.
      </p>
    </${Panel}>
  `;
}

function ReportTakeProfit() {
  const { account } = useContext(AccountContext);
  const { position } = useContext(PositionContext);

  if (position.takeProfit === null) {
    return null;
  }

  const pc = CURRENCY_SYMBOLS[position.positionCurrency];
  const takeProfitFormat = formatNumber(position.takeProfit, true, account.places, pc, null);
  const quantityFormat = formatNumber(position.quantity || 0, true, 2, null, " units");

  const takeProfitDistance = position.direction === "BUY" ? position.takeProfit - position.openPrice : position.openPrice - position.takeProfit;
  const stopLossRatio = position.stopLoss === null ? 0 : takeProfitDistance / (position.direction === "BUY" ? position.openPrice - position.stopLoss : position.stopLoss - position.openPrice);
  const realized = (position.takeProfit - position.openPrice) * (position.quantity || 0);
  const realizedAccount = realized / (position.conversion * (account.exchangeRates[position.positionCurrency] || 1));

  return html`
    <${Panel} title="Take Profit" class="flex flex-col gap-4">
      <${Table}>
        <${TableRow} title="Take Profit" value=${position.takeProfit} places=${account.places} currency=${position.positionCurrency}>
          Take profit entered into the position form.
        </${TableRow}>
        <${TableRow} title="Take Profit Distance" value=${takeProfitDistance} places=${account.places} currency=${position.positionCurrency}>
          Take profit distance, based on take profit entered into the position form.
        </${TableRow}>
        ${position.stopLoss !== null && html`<${TableRow} title="Ratio to Stop Loss" error=${stopLossRatio < 2} value=${stopLossRatio * 100} places=${account.places} suffix="%">
          The ratio of the take profit distance to the stop loss distance.
        </${TableRow}>
        ${stopLossRatio < 2 && html`<tr class="text-red-500">
          <th colSpan="2" class="text-left font-normal">
            A profit/loss ratio of ${formatNumber(stopLossRatio * 100, true, 0, null, "%")} is below the recommended minimum of 2:1
          </th>
        </tr>`}`}
        <${TableRow} title="Total Profit" value=${realized} places=${account.places} currency=${position.positionCurrency}>
          Total realized profit if closing a position of ${quantityFormat} at ${takeProfitFormat}.
        </${TableRow}>
        <${TableRow} title="Realized Profit" value=${realizedAccount} places=${account.places} currency=${account.currency}>
          Total realized account profit if closing a position of ${quantityFormat} at ${takeProfitFormat}.
        </${TableRow}>
      </${Table}>
    </${Panel}>
  `;
}

function ReportPlannedStopLoss() {

  const { account } = useContext(AccountContext);
  const { position } = useContext(PositionContext);

  if (position.stopLoss === null) {
    return null;
  }

  const qc = CURRENCY_SYMBOLS[position.quoteCurrency];
  const ap = account.currency !== position.positionCurrency;
  const pq = position.positionCurrency !== position.quoteCurrency;

  const positionRiskFormat = formatNumber(account.positionRisk * 100, true, 2, null, "%");
  const marginFormat = formatNumber(position.margin * 100, true, 2, null, "%");
  const leverageFormat = formatNumber(1 / position.margin, true, 0, "(", "x leverage)");
  const quantityFormat = formatNumber(position.quantity || 0, true, 2, null, " units");
  const openPriceFormat = formatNumber(position.openPrice, true, account.places, qc, null);

  const { available, availablePosition, availableQuote, distance, affordable, margin } = computeStopLossQuantity(account, position);

  let marginTable = null;
  if (distance !== 0) {
    marginTable = html`
      <${TableRow} title="Required Margin" value=${margin} places=${account.places} currency=${account.currency}>
        The amount of account margin that will be committed to open a position of ${quantityFormat} at ${openPriceFormat} with a position margin of ${marginFormat} ${leverageFormat}.
      </${TableRow}>
      <${TableRow} value=${(margin / account.amount) * 100} places=${2} suffix="%">
        The amount of account margin, as a percentage of the account value, that will be committed to opening a position of ${quantityFormat} at ${openPriceFormat} with a position margin of ${marginFormat} ${leverageFormat}.
      </${TableRow}>
    `;
  }

  return html`
    <${Panel} title="Planned Stop Loss Maximum" skip class="flex flex-col gap-4">
      <${Table}>
        <${TableRow} title="Available Account" value=${available} places=${account.places} currency=${account.currency}>
          Amount of account available under position risk of ${positionRiskFormat}.
        </${TableRow}>
        ${ap && html`<${TableRow} value=${availablePosition} places=${account.places} currency=${position.positionCurrency}>
          Amount of account available under position risk of ${positionRiskFormat} in the position currency.
        </${TableRow}>`}
        ${pq && html`<${TableRow} value=${availableQuote} places=${account.places} currency=${position.quoteCurrency}>
          Amount of account available under position risk of ${positionRiskFormat} in the quote currency.
        </${TableRow}>`}
        <${TableRow} title="Stop Loss" value=${position.stopLoss || 0} places=${account.places} currency=${position.positionCurrency}>
          Stop loss entered into the position form.
        </${TableRow}>
        <${TableRow} title="Stop Loss Distance" value=${distance} places=${account.places} currency=${position.positionCurrency}>
          Stop loss distance entered into the position form.
        </${TableRow}>
        <${TableRow} title="Available Quantity" value=${affordable} places=${2} suffix=" units">
          The position size that can be taken at an open price of ${formatNumber(position.openPrice, true, account.places, qc, null)}, given an account position risk of ${positionRiskFormat}.
        </${TableRow}>
      </${Table}>
      <p class="text-neutral-500 text-sm">
        This panel shows the maximum position size available, given the entered position stop loss and the account position risk.
      </p>
    </${Panel}>
  `;
}

function App() {
  return html`
    <${AccountProvider}>
      <${PositionProvider}>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <${AccountInfo} />
          <${PositionInfo} />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <${ReportPositionSize} />
          <${ReportStopLoss} />
          <${ReportTakeProfit} />
          <${ReportPlannedStopLoss} />
        </div>
      </${PositionProvider}>
    </${AccountProvider}>
  `;
}

render(html`<${App} />`, document.getElementById("tool-container"));
