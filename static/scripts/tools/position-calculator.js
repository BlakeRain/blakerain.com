import { CurrencySelectElement } from "../elements/currency-select.js";
import { NumberInputElement } from "../elements/number-input.js";
import { ToggleElement } from "../elements/toggle.js";
import { formatNumber } from "../format.js";

/** @type {Record<string, Record<string, number>>} */
const EXCHANGE_RATES = {};

(function () {
  const cached = window.sessionStorage.getItem("exchangeRates");
  if (cached) {
    const parsed = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    if (age < 24 * 60 * 60 * 1000) {
      console.log(`Loaded exchange rates from cache (${Math.round(age / 1000)} seconds old)`);
      Object.assign(EXCHANGE_RATES, parsed.rates);
    }
  }
})();

/** Save exchange rates to session storage */
function saveExchangeRates() {
  const toSave = { timestamp: Date.now(), rates: EXCHANGE_RATES };
  window.sessionStorage.setItem("exchangeRates", JSON.stringify(toSave));
}

/**
 * Load exchange rates for the given base currency
 *
 * @param {string} base The base currency
 * @param {AbortController} controller The abort controller to cancel the request
 * @return {Promise<void>} A promise that resolves when the exchange rates are loaded
 */
async function loadExchangeRates(base) {
  const target = "AUD,CAD,EUR,GBP,JPY,USD";

  if (base in EXCHANGE_RATES) {
    console.log(`Exchange rates for ${base} already loaded`);
    return;
  }

  console.log(`Loading exchange rates for ${base} ...`);
  const res = await fetch(`https://api.fxratesapi.com/latest?base=${base}&symbols=${target}`);
  const data = await res.json();

  if (!data || !data.rates) {
    console.warn(`Failed to load exchange rates for ${base}`);
    return;
  }

  console.log(`Loaded exchange rates for ${base}: ${Object.keys(data.rates).join(", ")}`);
  EXCHANGE_RATES[base] = data.rates;
  saveExchangeRates();
}

/**
 * Get the exchange rate from base currency to target currency
 *
 * @param {string} base The base currency
 * @param {string} target The target currency
 * @returns {number} The exchange rate, or 1 if not found
 */
function getExchangeRate(base, target) {
  if (base === target) {
    return 1;
  }

  if (base in EXCHANGE_RATES) {
    const rates = EXCHANGE_RATES[base];
    if (target in rates) {
      return rates[target];
    }
  }

  return 1;
}

class Account extends EventTarget {
  constructor() {
    super();
    this._places = 4;
    this._currency = "GBP";
    this._amount = 500;
    this._marginRisk = 0.01;
    this._positionRisk = 0.01;

    loadExchangeRates(this._currency).then(() => {
      this.onChange();
    });
  }

  get places() {
    return this._places;
  }

  set places(value) {
    this._places = value;
    this.onChange();
  }

  get currency() {
    return this._currency;
  }

  set currency(value) {
    this._currency = value;
    loadExchangeRates(this._currency).then(() => {
      this.onChange();
    });
  }

  get amount() {
    return this._amount;
  }

  set amount(value) {
    this._amount = value;
    this.onChange();
  }

  get marginRisk() {
    return this._marginRisk;
  }

  set marginRisk(value) {
    this._marginRisk = value;
    this.onChange();
  }

  get positionRisk() {
    return this._positionRisk;
  }

  set positionRisk(value) {
    this._positionRisk = value;
    this.onChange();
  }

  onChange() {
    this.dispatchEvent(new Event("change"));
  }
}

class Position extends EventTarget {
  constructor() {
    super();
    this._positionCurrency = "GBP";
    this._quoteCurrency = "GBP";
    this._openPrice = 0;
    /** @type {number | null} */
    this._quantity = null;
    this._direction = "long";
    this._margin = 0.05;
    /** @type {number | null} */
    this._takeProfit = null;
    /** @type {number | null} */
    this._stopLoss = null;
  }

  get positionCurrency() {
    return this._positionCurrency;
  }

  set positionCurrency(value) {
    this._positionCurrency = value;
    loadExchangeRates(this._positionCurrency).then(() => {
      this.onChange();
    });
  }

  get quoteCurrency() {
    return this._quoteCurrency;
  }

  set quoteCurrency(value) {
    this._quoteCurrency = value;
    this.onChange();
  }

  get openPrice() {
    return this._openPrice;
  }

  set openPrice(value) {
    this._openPrice = value;
    this.onChange();
  }

  get quantity() {
    return this._quantity;
  }

  set quantity(value) {
    this._quantity = value;
    this.onChange();
  }

  get direction() {
    return this._direction;
  }

  set direction(value) {
    this._direction = value;
    this.onChange();
  }

  get margin() {
    return this._margin;
  }

  set margin(value) {
    this._margin = value;
    this.onChange();
  }

  get takeProfit() {
    return this._takeProfit;
  }

  set takeProfit(value) {
    this._takeProfit = value;
    this.onChange();
  }

  get stopLoss() {
    return this._stopLoss;
  }

  set stopLoss(value) {
    this._stopLoss = value;
    this.onChange();
  }

  onChange() {
    this.dispatchEvent(new Event("change"));
  }
}

/**
 * @param {Position} position
 * @returns {number} The stop loss distance
 */
function getStopLossDistance(position) {
  if (position.stopLoss === null) {
    return 0;
  }

  return position.direction === "long"
    ? position.openPrice - position.stopLoss
    : position.stopLoss - position.openPrice;
}

/**
 * @param {Position} position
 * @returns {number} The take profit distance
 */
function getTakeProfitDistance(position) {
  if (position.takeProfit === null) {
    return 0;
  }

  return position.direction === "long"
    ? position.takeProfit - position.openPrice
    : position.openPrice - position.takeProfit;
}

/**
 * Computed position size information
 * @typedef {Object} PositionSize
 * @property {number} available - Available risk amount in account currency
 * @property {number} availablePosition - Available risk amount in position currency
 * @property {number} availableQuote - Available risk amount in quote currency
 * @property {number} margin - Maximum margin affordable in account currency
 * @property {number} marginPosition - Maximum margin affordable in position currency
 * @property {number} marginQuote - Maximum margin affordable in quote currency
 * @property {number} affordable - Maximum quantity affordable
 * @property {ActualPositionSize} actual - Actual position size information or null if quantity is not set
 */

/**
 * @param {Account} account information
 * @param {Position} position information
 * @returns {PositionSize} position size information
 */
function computePositionSize(account, position) {
  const pRate = getExchangeRate(account.currency, position.positionCurrency);
  const qRate = getExchangeRate(position.positionCurrency, position.quoteCurrency);
  const available = account.amount * account.marginRisk;
  const availablePosition = available * pRate;
  const availableQuote = availablePosition * qRate;

  const margin = available / (position.margin === 0 ? 1 : position.margin);
  const marginPosition = margin * pRate;
  const marginQuote = marginPosition * qRate;

  const affordable = position.openPrice === 0 ? 0 : marginQuote / position.openPrice;

  return {
    available,
    availablePosition,
    availableQuote,
    margin,
    marginPosition,
    marginQuote,
    affordable,
    actual: computeActualPositionSize(account, position, pRate, qRate),
  };
}

/**
 * @typedef {Object} ActualPositionSize
 * @property {number} cost - Actual cost in account currency
 * @property {number} costPosition - Actual cost in position currency
 * @property {number} costQuote - Actual cost in quote currency
 * @property {number} margin - Actual margin used in account currency
 */

/**
 * Computed actual position size information
 *
 * @param {Account} account information
 * @param {Position} position information
 * @param {number} pRate - Exchange rate from account currency to position currency
 * @param {number} qRate - Exchange rate from position currency to quote currency
 * @returns {ActualPositionSize} actual position size information or null if quantity is not set
 */
function computeActualPositionSize(account, position, qRate, pRate) {
  if (position.quantity === null) {
    return null;
  }

  const costQuote = position.quantity * position.openPrice * position.margin;
  const costPosition = costQuote / qRate;
  const cost = costPosition / pRate;
  const margin = cost / account.amount;

  return {
    cost,
    costQuote,
    costPosition,
    margin,
  };
}

/** Computed stop loss information
 * @typedef {Object} StopLossInfo
 * @property {number} available - Available risk amount in account currency
 * @property {number} availablePosition - Available risk amount in position currency
 * @property {number} availableQuote - Available risk amount in quote currency
 * @property {number} distance - Maximum stop loss distance affordable in quote currency
 * @property {ActualStopLoss} actual - Actual stop loss information or null if stop loss is not set
 */

/**
 * Compute the stop loss information
 *
 * @param {Account} account information
 * @param {Position} position information
 * @param {number} quantity - The position quantity
 * @returns {StopLossInfo} stop loss information
 */
function computeStopLoss(account, position, quantity) {
  const pRate = getExchangeRate(account.currency, position.positionCurrency);
  const qRate = getExchangeRate(position.positionCurrency, position.quoteCurrency);
  const available = account.amount * account.positionRisk;
  const availablePosition = available * pRate;
  const availableQuote = availablePosition * qRate;
  const distance = quantity === 0 ? 0 : availableQuote / quantity;

  return {
    available,
    availablePosition,
    availableQuote,
    distance,
    actual: computeActualStopLoss(account, position, pRate, qRate),
  };
}

/**
 * @typedef {Object} ActualStopLoss
 * @property {number} distance - Actual stop loss distance in quote currency
 * @property {number} loss - Actual loss in account currency
 * @property {number} risk - Actual risk as a fraction of account amount
 */

/**
 * Compute the actual stop loss information
 *
 * @param {Account} account information
 * @param {Position} position information
 * @param {number} pRate - Exchange rate from account currency to position currency
 * @param {number} qRate - Exchange rate from position currency to quote currency
 * @returns {ActualStopLoss} actual stop loss information or null if stop loss is not set
 */
function computeActualStopLoss(account, position, pRate, qRate) {
  if (position.stopLoss === null) {
    return null;
  }

  const distance =
    position.direction === "long"
      ? position.openPrice - position.stopLoss
      : position.stopLoss - position.openPrice;
  const loss = (distance * position.quantity) / (pRate * qRate);
  const risk = loss / account.amount;

  return {
    distance,
    loss,
    risk,
  };
}

/**
 * @typedef {Object} StopLossQuantity
 * @property {number} available - Available risk amount
 * @property {number} availablePosition - Available risk amount in position currency
 * @property {number} availableQuote - Available risk amount in quote currency
 * @property {number} distance - Maximum stop loss distance affordable in quote currency
 * @property {number} affordable - Maximum quantity affordable
 * @property {number} margin - Maximum margin affordable in account currency
 */

/**
 * Compute the stop loss quantity information
 *
 * @param {Account} account information
 * @param {Position} position information
 * @return {StopLossQuantity} stop loss quantity information
 */
function computeStopLossQuantity(account, position) {
  const distance =
    position.stopLoss === null
      ? 0
      : position.direction === "long"
        ? position.openPrice - position.stopLoss
        : position.stopLoss - position.openPrice;
  const pRate = getExchangeRate(account.currency, position.positionCurrency);
  const qRate = getExchangeRate(position.positionCurrency, position.quoteCurrency);
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

class CalculatorControllerElement extends HTMLElement {
  constructor() {
    super();
    /** @type {Account} */
    this.account = new Account();
    /** @type {Position} */
    this.position = new Position();
  }
}

/**
 * Find the nearest parent <calculator-controller> element
 *
 * @param {HTMLElement} element The starting element
 * @returns {CalculatorControllerElement | null} The nearest parent <calculator-controller> element or null if not found
 */
function findControllerParent(element) {
  let parent = element.parentElement;
  while (parent) {
    if (parent instanceof CalculatorControllerElement) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

class AccountCurrencyElement extends CurrencySelectElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<account-currency> must be inside a <calculator-controller>");
    }

    this._controller.account.addEventListener("change", () => {
      if (this.value !== this._controller.account.currency) {
        this.value = this._controller.account.currency;
      }
    });

    this.value = this._controller.account.currency;
    this.addEventListener("change", () => {
      this._controller.account.currency = this.value;
    });
  }
}

class AccountAmountElement extends NumberInputElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<account-amount> must be inside a <calculator-controller>");
    }

    this.places = this._controller.account.places;
    this.prefix = "";
    this.suffix = " " + this._controller.account.currency;
    this.thousands = true;
    this.value = this._controller.account.amount;

    this._controller.account.addEventListener("change", () => {
      this.places = this._controller.account.places;
      this.suffix = " " + this._controller.account.currency;

      if (this.value !== this._controller.account.amount) {
        this.value = this._controller.account.amount;
      }
    });

    this.addEventListener("change", () => {
      this._controller.account.amount = this.value;
    });
  }
}

class AccountRiskElement extends NumberInputElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<account-risk> must be inside a <calculator-controller>");
    }

    this.places = 0;
    this.prefix = "";
    this.suffix = " %";
    this.thousands = false;
    this.value = this.getRisk() * 100;

    this.addEventListener("change", () => {
      this.setRisk(this.value / 100);
    });
  }
}

class MarginRiskElement extends AccountRiskElement {
  getRisk() {
    return this._controller.account.marginRisk;
  }

  setRisk(value) {
    this._controller.account.marginRisk = value;
  }

  connectedCallback() {
    super.connectedCallback();

    this._controller.account.addEventListener("change", () => {
      const newValue = this._controller.account.marginRisk * 100;
      if (this.value !== newValue) {
        this.value = newValue;
      }
    });
  }
}

class PositionRiskElement extends AccountRiskElement {
  getRisk() {
    return this._controller.account.positionRisk;
  }

  setRisk(value) {
    this._controller.account.positionRisk = value;
  }

  connectedCallback() {
    super.connectedCallback();

    this._controller.account.addEventListener("change", () => {
      const newValue = this._controller.account.positionRisk * 100;
      if (this.value !== newValue) {
        this.value = newValue;
      }
    });
  }
}

class AccountPlacesElement extends NumberInputElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<account-places> must be inside a <calculator-controller>");
    }

    this.places = 0;
    this.prefix = "";
    this.suffix = " places";
    this.thousands = false;
    this.value = this._controller.account.places;

    this._controller.account.addEventListener("change", () => {
      if (this.value !== this._controller.account.places) {
        this.value = this._controller.account.places;
      }
    });

    this.addEventListener("change", () => {
      this._controller.account.places = Math.max(0, Math.min(10, Math.round(this.value)));
    });
  }
}

class PositionCurrencyElement extends CurrencySelectElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-currency> must be inside a <calculator-controller>");
    }

    this._controller.position.addEventListener("change", () => {
      if (this.value !== this._controller.position.positionCurrency) {
        this.value = this._controller.position.positionCurrency;
      }
    });

    this.value = this._controller.position.positionCurrency;
    this.addEventListener("change", () => {
      this._controller.position.positionCurrency = this.value;
    });
  }
}

class PositionQuoteCurrencyElement extends CurrencySelectElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-quote-currency> must be inside a <calculator-controller>");
    }

    this._controller.position.addEventListener("change", () => {
      if (this.value !== this._controller.position.quoteCurrency) {
        this.value = this._controller.position.quoteCurrency;
      }
    });

    this.value = this._controller.position.quoteCurrency;
    this.addEventListener("change", () => {
      this._controller.position.quoteCurrency = this.value;
    });
  }
}

class PositionMarginLabelElement extends HTMLElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-margin-label> must be inside a <calculator-controller>");
    }

    this._label = this.querySelector("label");
    if (!this._label) {
      throw new Error("<position-margin-label> must contain a <label> element");
    }

    this._controller.position.addEventListener("change", () => {
      this._updateLabel();
    });

    this._updateLabel();
  }

  _updateLabel() {
    const margin = this._controller.position.margin;
    if (margin === 0.0) {
      this._label.innerText = "Position Margin";
    } else {
      this._label.innerText = `Position Margin (${1 / margin}x leverage)`;
    }
  }
}

class PositionMarginElement extends NumberInputElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-margin> must be inside a <calculator-controller>");
    }

    this.places = 2;
    this.prefix = "";
    this.suffix = " %";
    this.thousands = false;
    this.value = this._controller.position.margin * 100;

    this._controller.position.addEventListener("change", () => {
      const newValue = this._controller.position.margin * 100;
      if (this.value !== newValue) {
        this.value = newValue;
      }
    });

    this.addEventListener("change", () => {
      this._controller.position.margin = this.value / 100;
    });
  }
}

class PositionDirectionElement extends HTMLElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-direction> must be inside a <calculator-controller>");
    }

    const select = this.querySelector("select");
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error("<position-direction> must contain a <select> element");
    }

    select.value = this._controller.position.direction;

    select.addEventListener("change", () => {
      this._controller.position.direction = select.value;
    });

    this._controller.position.addEventListener("change", () => {
      select.value = this._controller.position.direction;
    });
  }
}

class PositionOpenPriceElement extends NumberInputElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-open-price> must be inside a <calculator-controller>");
    }

    this.places = this._controller.account.places;
    this.prefix = "";
    this.suffix = " " + this._controller.position.quoteCurrency;
    this.thousands = true;
    this.value = this._controller.position.openPrice;

    this._controller.account.addEventListener("change", () => {
      this.places = this._controller.account.places;
    });

    this._controller.position.addEventListener("change", () => {
      const newSuffix = " " + this._controller.position.quoteCurrency;
      if (this.suffix !== newSuffix) {
        this.suffix = newSuffix;
      }

      const newValue = this._controller.position.openPrice;
      if (this.value !== newValue) {
        this.value = newValue;
      }
    });

    this.addEventListener("change", () => {
      this._controller.position.openPrice = this.value;
    });
  }
}

class PositionQuantityToggleElement extends ToggleElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-quantity-toggle> must be inside a <calculator-controller>");
    }

    this.checked = this._controller.position.quantity !== null;

    this.addEventListener("change", () => {
      if (this.checked) {
        this._controller.position.quantity = 0;
      } else {
        this._controller.position.quantity = null;
      }
    });

    this._controller.position.addEventListener("change", () => {
      const hasQuantity = this._controller.position.quantity !== null;
      if (this.checked !== hasQuantity) {
        this.checked = hasQuantity;
      }
    });
  }
}

class PositionQuantityElement extends NumberInputElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-quantity> must be inside a <calculator-controller>");
    }

    this.places = 2;
    this.prefix = "";
    this.thousands = true;
    this.value = this._controller.position.quantity || 0;
    this.disabled = this._controller.position.quantity === null;

    this._controller.account.addEventListener("change", () => {
      this.places = this._controller.account.places;
    });

    this._controller.position.addEventListener("change", () => {
      const newValue = this._controller.position.quantity || 0;
      if (this.value !== newValue) {
        this.value = newValue;
      }

      this.disabled = this._controller.position.quantity === null;
    });

    this.addEventListener("change", () => {
      this._controller.position.quantity = this.value;
    });
  }
}

class AffordablePositionElement extends HTMLElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<affordable-position> must be inside a <calculator-controller>");
    }

    this._button = this.querySelector("button");
    if (!(this._button instanceof HTMLButtonElement)) {
      throw new Error("<affordable-position> must contain a <button> element");
    }

    this._update();

    this._button.addEventListener("click", () => {
      const { affordable } = computePositionSize(
        this._controller.account,
        this._controller.position,
      );

      this._controller.position.quantity = affordable;
    });

    this._controller.position.addEventListener("change", () => {
      this._update();
    });
  }

  _update() {
    this._button.disabled =
      this._controller.position.quantity === null || this._controller.position.openPrice === 0;
  }
}

class OptimalPositionElement extends HTMLElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<optimal-position> must be inside a <calculator-controller>");
    }

    this._button = this.querySelector("button");
    if (!(this._button instanceof HTMLButtonElement)) {
      throw new Error("<optimal-position> must contain a <button> element");
    }

    this._update();

    this._button.addEventListener("click", () => {
      const { affordable } = computeStopLossQuantity(
        this._controller.account,
        this._controller.position,
      );

      this._controller.position.quantity = affordable;
    });

    this._controller.position.addEventListener("change", () => {
      this._update();
    });
  }

  _update() {
    this._button.disabled =
      this._controller.position.quantity === null || this._controller.position.stopLoss === null;
  }
}

class PositionStopLossToggleElement extends ToggleElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-stop-loss-toggle> must be inside a <calculator-controller>");
    }

    this.checked = this._controller.position.stopLoss !== null;

    this.addEventListener("change", () => {
      if (this.checked) {
        this._controller.position.stopLoss = 0;
      } else {
        this._controller.position.stopLoss = null;
      }
    });

    this._controller.position.addEventListener("change", () => {
      const hasStopLoss = this._controller.position.stopLoss !== null;
      if (this.checked !== hasStopLoss) {
        this.checked = hasStopLoss;
      }
    });
  }
}

class PositionStopLossElement extends NumberInputElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-stop-loss> must be inside a <calculator-controller>");
    }

    this.places = this._controller.account.places;
    this.prefix = "";
    this.suffix = " " + this._controller.position.quoteCurrency;
    this.thousands = true;
    this.value = this._controller.position.stopLoss || 0;
    this.disabled = this._controller.position.stopLoss === null;

    this._controller.account.addEventListener("change", () => {
      this.places = this._controller.account.places;
    });

    this._controller.position.addEventListener("change", () => {
      this.suffix = " " + this._controller.position.quoteCurrency;
      this.disabled = this._controller.position.stopLoss === null;

      const newValue = this._controller.position.stopLoss || 0;
      if (this.value !== newValue) {
        this.value = newValue;
      }
    });

    this.addEventListener("change", () => {
      this._controller.position.stopLoss = this.value;
    });
  }
}

class PositionStopLossDistanceElement extends NumberInputElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-stop-loss-distance> must be inside a <calculator-controller>");
    }

    this.places = this._controller.account.places;
    this.prefix = "";
    this.suffix = " " + this._controller.position.quoteCurrency;
    this.thousands = true;
    this.value = getStopLossDistance(this._controller.position);
    this.disabled = this._controller.position.stopLoss === null;

    this._controller.account.addEventListener("change", () => {
      this.places = this._controller.account.places;
    });

    this._controller.position.addEventListener("change", () => {
      this.suffix = " " + this._controller.position.quoteCurrency;
      this.disabled = this._controller.position.stopLoss === null;
      this.value = getStopLossDistance(this._controller.position);
    });

    this.addEventListener("change", () => {
      const distance = this.value;
      const openPrice = this._controller.position.openPrice;
      if (this._controller.position.direction === "long") {
        this._controller.position.stopLoss = openPrice - distance;
      } else {
        this._controller.position.stopLoss = openPrice + distance;
      }
    });
  }
}

class PositionTakeProfitToggleElement extends ToggleElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-take-profit-toggle> must be inside a <calculator-controller>");
    }

    this.checked = this._controller.position.takeProfit !== null;

    this.addEventListener("change", () => {
      if (this.checked) {
        this._controller.position.takeProfit = 0;
      } else {
        this._controller.position.takeProfit = null;
      }
    });

    this._controller.position.addEventListener("change", () => {
      const hasTakeProfit = this._controller.position.takeProfit !== null;
      if (this.checked !== hasTakeProfit) {
        this.checked = hasTakeProfit;
      }
    });
  }
}

class PositionTakeProfitElement extends NumberInputElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-take-profit> must be inside a <calculator-controller>");
    }

    this.places = this._controller.account.places;
    this.prefix = "";
    this.suffix = " " + this._controller.position.quoteCurrency;
    this.thousands = true;
    this.value = this._controller.position.takeProfit || 0;
    this.disabled = this._controller.position.takeProfit === null;

    this._controller.account.addEventListener("change", () => {
      this.places = this._controller.account.places;
    });

    this._controller.position.addEventListener("change", () => {
      this.suffix = " " + this._controller.position.quoteCurrency;
      this.disabled = this._controller.position.takeProfit === null;

      const newValue = this._controller.position.takeProfit || 0;
      if (this.value !== newValue) {
        this.value = newValue;
      }
    });

    this.addEventListener("change", () => {
      this._controller.position.takeProfit = this.value;
    });
  }
}

class PositionTakeProfitDistanceElement extends NumberInputElement {
  constructor() {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-take-profit-distance> must be inside a <calculator-controller>");
    }

    this.places = this._controller.account.places;
    this.prefix = "";
    this.suffix = " " + this._controller.position.quoteCurrency;
    this.thousands = true;
    this.value = getTakeProfitDistance(this._controller.position);
    this.disabled = this._controller.position.takeProfit === null;

    this._controller.account.addEventListener("change", () => {
      this.places = this._controller.account.places;
    });

    this._controller.position.addEventListener("change", () => {
      this.suffix = " " + this._controller.position.quoteCurrency;
      this.disabled = this._controller.position.takeProfit === null;
      this.value = getTakeProfitDistance(this._controller.position);
    });

    this.addEventListener("change", () => {
      const distance = this.value;
      const openPrice = this._controller.position.openPrice;
      if (this._controller.position.direction === "long") {
        this._controller.position.takeProfit = openPrice + distance;
      } else {
        this._controller.position.takeProfit = openPrice - distance;
      }
    });
  }
}

/** @template T */
class ReportRow {
  /**
   * Construct a report row
   *
   * @param {boolean | function(report: T): boolean} filter - Whether to show this row
   * @param {string | function(report: T): string} label - The label for this row
   * @param {string | function(report: T): string} help - The help text for this row
   * @param {number | function(report: T): number} places - The number of decimal places to show
   * @param {string | function(report: T): string} prefix - The prefix to show before the value
   * @param {string | function(report: T): string} suffix - The suffix to show after the value
   * @param {string | function(report: T): string | null} description - The description to show
   * @param {boolean | function(report: T): boolean | null} error - Whether to show this row as an error
   * @param {function(report: T): number} compute - Function to compute the value for this row
   */
  constructor(filter, label, help, places, prefix, suffix, description, error, compute) {
    /** @type {boolean | function(report: T): boolean} */
    this._filter = filter;
    /** @type {string | function(report: T): string | null} */
    this._label = label;
    /** @type {string | function(report: T): string | null} */
    this._help = help;
    /** @type {number | function(report: T): number} */
    this._places = places;
    /** @type {string | function(report: T): string} */
    this._prefix = prefix;
    /** @type {string | function(report: T): string} */
    this._suffix = suffix;
    /** @type {string | function(report: T): string | null} */
    this._description = description;
    /** @type {boolean | function(report: T): boolean | null} */
    this._error = error;
    /** @type {function(report: T): number} */
    this._compute = compute;
  }

  filter(report) {
    if (typeof this._filter === "function") {
      return this._filter(report);
    }

    return this._filter;
  }

  get hasLabel() {
    return this._label !== null && this._label !== undefined && this._label !== "";
  }

  get mutatingLabel() {
    return typeof this._label === "function";
  }

  /**
   * @param {T} report
   * @returns {string}
   */
  label(report) {
    if (typeof this._label === "function") {
      return this._label(report);
    }

    return this._label;
  }

  get hasHelp() {
    return this._help !== null && this._help !== undefined && this._help !== "";
  }

  get mutatingHelp() {
    return typeof this._help === "function";
  }

  /**
   * @param {T} report
   * @returns {string}
   */
  help(report) {
    if (typeof this._help === "function") {
      return this._help(report);
    }

    return this._help;
  }

  /**
   * @param {T} report
   * @returns {number}
   */
  places(report) {
    if (typeof this._places === "function") {
      return this._places(report);
    }

    return this._places;
  }

  /**
   * @param {T} report
   * @returns {string}
   */
  prefix(report) {
    if (typeof this._prefix === "function") {
      return this._prefix(report);
    }

    return this._prefix;
  }

  /**
   * @param {T} report
   * @returns {string}
   */
  suffix(report) {
    if (typeof this._suffix === "function") {
      return this._suffix(report);
    }

    return this._suffix;
  }

  get hasDescription() {
    return (
      this._description !== null && this._description !== undefined && this._description !== ""
    );
  }

  get mutatingDescription() {
    return typeof this._description === "function";
  }

  /**
   * @param {T} report
   * @returns {string}
   */
  description(report) {
    if (typeof this._description === "function") {
      return this._description(report);
    }

    return this._description;
  }

  get hasError() {
    return this._error !== null && this._error !== undefined && this._error !== false;
  }

  get mutatingError() {
    return typeof this._error === "function";
  }

  /**
   * @param {T} report
   * @returns {boolean}
   */
  error(report) {
    if (typeof this._error === "function") {
      return this._error(report);
    }

    return this._error;
  }

  /**
   * @param {T} report
   * @returns {number}
   */
  compute(report) {
    return this._compute(report);
  }

  static builder() {
    /** @template T */
    class ReportRowBuilder {
      constructor() {
        /** @type {boolean | function(report: T): boolean} */
        this._filter = true;
        /** @type {string | function(report: T): string} */
        this._label = null;
        /** @type {string | function(report: T): string} */
        this._help = null;
        /** @type {number | function(report: T): number} */
        this._places = 2;
        /** @type {string | function(report: T): string} */
        this._prefix = null;
        /** @type {string | function(report: T): string} */
        this._suffix = null;
        /** @type {string | function(report: T): string | null} */
        this._description = null;
        /** @type {boolean | function(report: T): boolean} */
        this._error = false;
        /** @type {function(report: T): number} */
        this._compute = () => 0;
      }

      /** @param {boolean | function(report: T): boolean} filter */
      filter(filter) {
        this._filter = filter;
        return this;
      }

      /** @param {string | function(report: T): string} label */
      label(label) {
        this._label = label;
        return this;
      }

      /** @param {string | function(report: T): string} help */
      help(help) {
        this._help = help;
        return this;
      }

      /** @param {number | function(report: T): number} places */
      places(places) {
        this._places = places;
        return this;
      }

      /** @param {string | function(report: T): string} prefix */
      prefix(prefix) {
        this._prefix = prefix;
        return this;
      }

      /** @param {string | function(report: T): string} suffix */
      suffix(suffix) {
        this._suffix = suffix;
        return this;
      }

      /** @param {function(report: T): number} compute */
      compute(compute) {
        this._compute = compute;
        return this;
      }

      /** @param {string | function(report: T): string | null} description */
      description(description) {
        this._description = description;
        return this;
      }

      /** @param {boolean | function(report: T): boolean} error */
      error(error) {
        this._error = error;
        return this;
      }

      build() {
        return new ReportRow(
          this._filter,
          this._label,
          this._help,
          this._places,
          this._currency,
          this._suffix,
          this._description,
          this._error,
          this._compute,
        );
      }
    }

    return new ReportRowBuilder();
  }
}

const HELP_ICON = document.createElement("template");
HELP_ICON.innerHTML = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  class="w-5 h-5"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <circle cx="12" cy="12" r="10" />
  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
  <path d="M12 17h.01" />
</svg>
`;

/**
 * @typedef {Object} ReportRowElements
 * @property {HTMLDivElement} row - The row element
 * @property {HTMLDivElement | null} help - The help element or null if not present
 * @property {HTMLDivElement | null} label - The label element or null if not present
 * @property {HTMLDivElement} value - The value element
 * @property {HTMLDivElement | null} description - The description element or null if not present
 */

/**
 * Build the report rows in the container
 *
 * @param {HTMLElement} container The container element
 * @param {ReportRow[]} reportRows The report rows to build
 * @returns {ReportRowElements} The built row elements
 */
function buildReportRows(container, reportRows) {
  /** @type {ReportRowElements[]} */
  const rows = [];
  for (const row of reportRows) {
    const rowElement = document.createElement("div");
    rowElement.classList.add("grid", "col-span-3", "grid-cols-subgrid", "items-center");

    if (row.hasError && !row.mutatingError) {
      if (row.error()) {
        rowElement.classList.add("text-red-600", "dark:text-red-400");
      }
    }

    /** @type {HTMLDivElement | null} */
    let help = null;
    /** @type {HTMLDivElement | null} */
    let label = null;

    if (row.hasHelp) {
      const helpContainer = document.createElement("div");
      helpContainer.classList.add("relative", "cursor-pointer", "group");

      const icon = HELP_ICON.content.cloneNode(true);

      help = document.createElement("div");
      help.classList.add("tooltip", "right", "hidden", "group-hover:block");
      if (!row.mutatingHelp) {
        help.innerText = row.help();
      }

      helpContainer.append(icon);
      helpContainer.append(help);
      rowElement.append(helpContainer);
    }

    if (row.hasLabel) {
      label = document.createElement("div");
      label.classList.add("font-bold", "text-left", "col-start-2");

      if (!row.mutatingLabel) {
        label.innerText = row.label();
      }

      rowElement.append(label);
    }

    const value = document.createElement("div");
    value.classList.add("text-right", "col-start-3");

    rowElement.append(value);
    container.append(rowElement);

    /** @type {HTMLDivElement | null} */
    let description = null;
    if (row.hasDescription) {
      description = document.createElement("div");
      description.classList.add("col-span-3", "text-sm", "mt-0.5");

      if (!row.mutatingDescription) {
        description.innerText = row.description();
      }

      container.append(description);
    }

    rows.push({
      row: rowElement,
      help,
      label,
      value,
      description,
    });
  }

  return rows;
}

/**
 * Update the report rows with the latest data
 *
 * @param {ReportRowElements[]} rowElements The row elements to update
 * @param {ReportRow[]} reportRows The report rows definitions
 * @param {any} report The report data
 */
function updateReportRows(rowElements, reportRows, report) {
  for (let i = 0; i < reportRows.length; i++) {
    const row = reportRows[i];
    const elements = rowElements[i];

    if (!row.filter(report)) {
      elements.row.style.display = "none";
      continue;
    } else {
      elements.row.style.display = "";
    }

    if (row.mutatingHelp) {
      elements.help.innerText = row.help(report);
    }

    if (row.mutatingLabel) {
      elements.label.innerText = row.label(report);
    }

    if (row.mutatingError) {
      if (row.error(report)) {
        elements.row.classList.add("text-red-600", "dark:text-red-400");
        if (elements.description) {
          elements.description.classList.add("text-red-600", "dark:text-red-400");
        }
      } else {
        elements.row.classList.remove("text-red-600", "dark:text-red-400");
        if (elements.description) {
          elements.description.classList.remove("text-red-600", "dark:text-red-400");
        }
      }
    }

    elements.value.innerText = formatNumber(
      row.compute(report),
      true,
      row.places(report),
      row.prefix(report),
      row.suffix(report),
    );

    if (row.mutatingDescription) {
      elements.description.innerText = row.description(report);
    }
  }
}

class ReportElement extends HTMLElement {
  constructor(reportRows) {
    super();
    /** @type {CalculatorControllerElement | null} */
    this._controller = null;
    /** @type {HTMLElement | null} */
    this._container = null;
    /** @type {ReportRow<any>[]} */
    this._reportRows = reportRows;
    /** @type {ReportRowElements[]} */
    this._rowElements = [];
  }

  /** @type {CalculatorControllerElement} */
  get controller() {
    return this._controller;
  }

  get marginFormat() {
    return formatNumber(this.controller.position.margin * 100, true, 2, null, "%");
  }

  get leverageFormat() {
    if (this.controller.position.margin === 0) {
      return "No leverage";
    }

    return formatNumber(1 / this.controller.position.margin, true, 0, "(", "x leverage)");
  }

  get quantityFormat() {
    return formatNumber(this.controller.position.quantity || 0, true, 2, null, " units");
  }

  get openPriceFormat() {
    return formatNumber(
      this.controller.position.openPrice,
      true,
      this.controller.account.places,
      null,
      " " + this.controller.position.quoteCurrency,
    );
  }

  get positionRiskFormat() {
    return formatNumber(this.controller.account.positionRisk * 100, true, 2, null, "%");
  }

  connectedCallback() {
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<report-element> must be inside a <calculator-controller>");
    }

    this._container = this.querySelector(".grid");
    if (!this._container) {
      throw new Error("<report-element> must contain a .grid element");
    }

    this._rowElements = buildReportRows(this._container, this._reportRows);
    this.onUpdate();

    this._controller.account.addEventListener("change", () => {
      this.onUpdate();
    });

    this._controller.position.addEventListener("change", () => {
      this.onUpdate();
    });
  }

  onUpdate() {
    updateReportRows(this._rowElements, this._reportRows, this);
  }
}

const POSITION_SIZE_ROWS = [
  ReportRow.builder()
    .label("Available Account")
    .help("Amount of account available under margin risk in the account currency.")
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.account.currency)
    .compute((report) => report.sizeReport.available)
    .build(),
  ReportRow.builder()
    .filter(
      (report) =>
        report.controller.position.positionCurrency !== report.controller.account.currency,
    )
    .help("Amount of account available under margin risk in the position currency.")
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.sizeReport.availablePosition)
    .build(),
  ReportRow.builder()
    .filter(
      (report) =>
        report.controller.position.quoteCurrency !== report.controller.position.positionCurrency,
    )
    .help("Amount of account available under margin risk in the quote currency.")
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.quoteCurrency)
    .compute((report) => report.sizeReport.availableQuote)
    .build(),

  ReportRow.builder()
    .label("Available Margin")
    .help((report) => {
      return `Available amount with a ${report.marginFormat} position margin.`;
    })
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.account.currency)
    .compute((report) => report.sizeReport.margin)
    .build(),
  ReportRow.builder()
    .filter(
      (report) =>
        report.controller.position.positionCurrency !== report.controller.account.currency,
    )
    .help((report) => {
      return `Available amount with a ${report.marginFormat} position margin converted to the position currency.`;
    })
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.sizeReport.marginPosition)
    .build(),
  ReportRow.builder()
    .filter(
      (report) =>
        report.controller.position.quoteCurrency !== report.controller.position.positionCurrency,
    )
    .help((report) => {
      return `Available amount with a ${report.marginFormat} position margin converted to the quote currency.`;
    })
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.quoteCurrency)
    .compute((report) => report.sizeReport.marginQuote)
    .build(),
  ReportRow.builder()
    .label("Affordable Position Size")
    .help((report) => {
      return `Position size that can be taken at an open price of ${
        report.openPriceFormat
      } with an available margin of ${formatNumber(
        report.sizeReport.marginQuote,
        true,
        report.controller.account.places,
        report.controller.position.quoteCurrency,
        null,
      )}.`;
    })
    .places(2)
    .suffix(" units")
    .compute((report) => report.sizeReport.affordable)
    .build(),

  ReportRow.builder()
    .filter((report) => report.sizeReport.actual)
    .label("Actual Quantity")
    .help("Quantity entered into the position form.")
    .places(2)
    .suffix(" units")
    .compute((report) => report.controller.position.quantity)
    .build(),
  ReportRow.builder()
    .filter((report) => report.sizeReport.actual)
    .label("Actual Cost")
    .help((report) => {
      return `Actual const of opening a position of ${report.quantityFormat} units at ${report.openPriceFormat}.`;
    })
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.quoteCurrency)
    .compute((report) => report.controller.position.quantity * report.controller.position.openPrice)
    .build(),
  ReportRow.builder()
    .filter((report) => report.sizeReport.actual)
    .label("Required Margin")
    .help((report) => {
      return `Amount required at ${report.marginFormat} position margin (${formatNumber(
        1 / (report.controller.position.margin === 0 ? 1 : report.controller.position.margin),
        false,
        0,
        null,
        null,
      )}x leverage)`;
    })
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.quoteCurrency)
    .compute((report) => report.sizeReport.actual.costQuote)
    .build(),
  ReportRow.builder()
    .filter(
      (report) =>
        report.sizeReport.actual &&
        report.controller.position.quoteCurrency !== report.controller.position.positionCurrency,
    )
    .help(
      (report) =>
        `Amount required at ${report.marginFormat} margin, converted into the position currency.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.sizeReport.actual.costPosition)
    .build(),
  ReportRow.builder()
    .filter(
      (report) =>
        report.sizeReport.actual &&
        report.controller.account.currency !== report.controller.position.positionCurrency,
    )
    .help(
      (report) =>
        `Amount required at ${report.marginFormat} margin, converted into the account currency.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.account.currency)
    .compute((report) => report.sizeReport.actual.cost)
    .build(),
  ReportRow.builder()
    .filter((report) => report.sizeReport.actual)
    .label("Committed Account")
    .help("The percentage of the account that will be committed as margin to open the position.")
    .places(2)
    .suffix(" %")
    .error((report) => report.excessRisk)
    .compute((report) => report.sizeReport.actual.margin * 100.0)
    .description((report) => {
      if (!report.excessRisk) {
        return null;
      }

      const risk = formatNumber(report.controller.account.marginRisk * 100, true, 2, null, "%");

      const excess = formatNumber(
        report.sizeReport.actual.cost - report.sizeReport.available,
        true,
        report.controller.account.places,
        null,
        " " + report.controller.account.currency,
      );

      return `Actual quantity of ${report.quantityFormat} exceeds account margin risk of ${risk} by ${excess}.`;
    })
    .build(),
];

class PositionSizeReportElement extends ReportElement {
  constructor() {
    super([...POSITION_SIZE_ROWS]);
    this._sizeReport = null;
  }

  get sizeReport() {
    return this._sizeReport;
  }

  get excessRisk() {
    return this._sizeReport && this._sizeReport.actual
      ? Math.round(this._sizeReport.actual.margin * 100) > this._controller.account.marginRisk * 100
      : false;
  }

  onUpdate() {
    this._sizeReport = computePositionSize(this._controller.account, this._controller.position);
    super.onUpdate();
  }
}

/** @type {ReportRow<StopLossReportElement>[]} */
const STOP_LOSS_ROWS = [
  ReportRow.builder()
    .label("Available Account")
    .help(
      (report) =>
        `Amount of account available under position risk of ${report.positionRiskFormat}.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.account.currency)
    .compute((report) => report.stopLoss.available)
    .build(),
  ReportRow.builder()
    .filter(
      (report) =>
        report.controller.position.positionCurrency !== report.controller.account.currency,
    )
    .help(
      (report) =>
        `Amount of account available under position risk of ${report.positionRiskFormat} in the position currency.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.stopLoss.availablePosition)
    .build(),
  ReportRow.builder()
    .filter(
      (report) =>
        report.controller.position.quoteCurrency !== report.controller.position.positionCurrency,
    )
    .help(
      (report) =>
        `Amount of account available under position risk of ${report.positionRiskFormat} in the quote currency.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.quoteCurrency)
    .compute((report) => report.stopLoss.availableQuote)
    .build(),
  ReportRow.builder()
    .label("Maximum Stop Loss Price Distance")
    .help(
      (report) =>
        `The maximum stop loss distance for a position of ${report.quantityFormat} at ${report.openPriceFormat} to remain within the position risk of ${report.positionRiskFormat} of the account.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.stopLoss.distance)
    .build(),
  ReportRow.builder()
    .label("Maximum Stop Loss")
    .help(
      (report) =>
        `The maximum stop loss for a position of ${report.quantityFormat} at ${report.openPriceFormat} to remain within the position risk of ${report.positionRiskFormat} of the account.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => {
      const distance = report.stopLoss.distance;
      return report.controller.position.direction === "long"
        ? report.controller.position.openPrice - distance
        : report.controller.position.openPrice + distance;
    })
    .build(),

  ReportRow.builder()
    .filter((report) => report.stopLoss.actual)
    .label("Actual Distance")
    .help("The distance provided in the position form.")
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => (report.stopLoss.actual ? report.stopLoss.actual.distance : 0))
    .build(),
  ReportRow.builder()
    .filter((report) => report.stopLoss.actual)
    .label("Actual Loss")
    .help(
      (report) =>
        `The actual account loss that will be incurred should the position close at the provided stop loss position of ${report.stopLossFormat}.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.account.currency)
    .compute((report) => (report.stopLoss.actual ? report.stopLoss.actual.loss : 0))
    .build(),
  ReportRow.builder()
    .filter((report) => report.stopLoss.actual)
    .label("Actual Risk")
    .help(
      (report) =>
        `Percentage of account at risk for the provided stop loss position of ${report.stopLossFormat}.`,
    )
    .places(2)
    .suffix(" %")
    .error((report) => report.excessRisk)
    .compute((report) => (report.stopLoss.actual ? report.stopLoss.actual.risk * 100.0 : 0))
    .build(),
];

class StopLossReportElement extends ReportElement {
  constructor() {
    super([...STOP_LOSS_ROWS]);
    /** @type {StopLossInfo | null} */
    this._stopLoss = null;
  }

  get stopLoss() {
    return this._stopLoss;
  }

  get excessRisk() {
    if (this._stopLoss.actual === null) {
      return false;
    }

    return (
      Math.round(100 * this._stopLoss.actual.risk) > this.controller.account.positionRisk * 100
    );
  }

  get stopLossFormat() {
    return formatNumber(
      this.controller.position.stopLoss || 0,
      true,
      this.controller.account.places,
      null,
      " " + this.controller.position.quoteCurrency,
    );
  }

  onUpdate() {
    const { account, position } = this.controller;
    const quantity =
      position.quantity !== null
        ? position.quantity
        : computePositionSize(account, position).affordable;
    this._stopLoss = computeStopLoss(account, position, quantity);
    super.onUpdate();
  }
}

const TAKE_PROFIT_ROWS = [
  ReportRow.builder()
    .filter((report) => report.controller.position.takeProfit !== null)
    .label("Take Profit")
    .help("Take profit entered into the position form.")
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.controller.position.takeProfit)
    .build(),

  ReportRow.builder()
    .filter((report) => report.controller.position.takeProfit !== null)
    .label("Take Profit Distance")
    .help("Take profit distance, based on take profit entered into the position form.")
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.takeProfitDistance)
    .build(),

  ReportRow.builder()
    .filter(
      (report) =>
        report.controller.position.takeProfit !== null &&
        report.controller.position.stopLoss !== null,
    )
    .label("Reward to Risk Ratio")
    .help("The ratio of the take profit distance to the stop loss distance.")
    .places(1)
    .suffix(":1")
    .compute((report) => report.stopLossRatio)
    .error((report) => report.stopLossRatio < 2)
    .description((report) => {
      if (report.stopLossRatio < 2) {
        return `A profit/loss ratio of ${formatNumber(
          report.stopLossRatio,
          true,
          1,
          null,
          null,
        )}:1 is below the recommended minimum of 2:1`;
      }

      return null;
    })
    .build(),

  ReportRow.builder()
    .filter((report) => report.controller.position.takeProfit !== null)
    .label("Realised Profit")
    .help(
      (report) =>
        `Total realized profit if closing a position of ${report.quantityFormat} at ${report.takeProfitFormat}.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.realised)
    .build(),

  ReportRow.builder()
    .filter((report) => report.controller.position.takeProfit !== null)
    .label("Realised Profit (Account)")
    .help(
      (report) =>
        `Total realized account profit if closing a position of ${report.quantityFormat} at ${report.takeProfitFormat}.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.account.currency)
    .compute((report) => report.realisedAccount)
    .build(),
];

class TakeProfitReportElement extends ReportElement {
  constructor() {
    super([...TAKE_PROFIT_ROWS]);
  }

  get takeProfitFormat() {
    if (this.controller.position.takeProfit === null) {
      return null;
    }

    return formatNumber(
      this.controller.position.takeProfit,
      true,
      this.controller.account.places,
      null,
      " " + this.controller.position.positionCurrency,
    );
  }

  get takeProfitDistance() {
    const { position } = this.controller;

    if (position.takeProfit === null) {
      return null;
    }

    return position.direction === "long"
      ? position.takeProfit - position.openPrice
      : position.openPrice - position.takeProfit;
  }

  get stopLossRatio() {
    const { position } = this.controller;

    if (position.takeProfit === null || position.stopLoss === null) {
      return 0;
    }

    return (
      this.takeProfitDistance /
      (position.direction === "long"
        ? position.openPrice - position.stopLoss
        : position.stopLoss - position.openPrice)
    );
  }

  get realised() {
    const { position } = this.controller;

    if (position.takeProfit === null) {
      return null;
    }

    return (position.takeProfit - position.openPrice) * (position.quantity || 0);
  }

  get realisedAccount() {
    const { account, position } = this.controller;

    if (position.takeProfit === null) {
      return null;
    }

    return (
      this.realised /
      (getExchangeRate(position.positionCurrency * position.quoteCurrency) *
        (getExchangeRate(account.currency, position.quoteCurrency) || 1))
    );
  }
}

const PLANNED_STOP_LOSS_ROWS = [
  ReportRow.builder()
    .filter((report) => report.stopLossQuantity !== null)
    .label("Available Account")
    .help(
      (report) =>
        `Amount of account available under position risk of ${report.positionRiskFormat}.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.account.currency)
    .compute((report) => report.stopLossQuantity.available)
    .build(),

  ReportRow.builder()
    .filter(
      (report) =>
        report.stopLossQuantity !== null &&
        report.controller.position.positionCurrency !== report.controller.account.currency,
    )
    .help(
      (report) =>
        `Amount of account available under position risk of ${report.positionRiskFormat} in the position currency.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.stopLossQuantity.availablePosition)
    .build(),

  ReportRow.builder()
    .filter(
      (report) =>
        report.stopLossQuantity !== null &&
        report.controller.position.quoteCurrency !== report.controller.position.positionCurrency,
    )
    .help(
      (report) =>
        `Amount of account available under position risk of ${report.positionRiskFormat} in the quote currency.`,
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.quoteCurrency)
    .compute((report) => report.stopLossQuantity.availableQuote)
    .build(),

  ReportRow.builder()
    .filter((report) => report.stopLossQuantity !== null)
    .label("Stop Loss")
    .help("Stop loss entered into the position form.")
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.controller.position.stopLoss || 0)
    .build(),

  ReportRow.builder()
    .filter((report) => report.stopLossQuantity !== null)
    .label("Stop Loss Distance")
    .help("Stop loss distance entered into the position form.")
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.stopLossQuantity.distance || 0)
    .build(),

  ReportRow.builder()
    .filter((report) => report.stopLossQuantity !== null)
    .label("Available Quantity")
    .help(
      (report) =>
        `The position size that can be taken at an open price of ${report.openPriceFormat}, given an account position risk of ${report.positionRiskFormat}.`,
    )
    .places(2)
    .suffix(" units")
    .compute((report) => report.stopLossQuantity.affordable)
    .build(),
];

class PlannedStopLossReportElement extends ReportElement {
  constructor() {
    super([...PLANNED_STOP_LOSS_ROWS]);
    this._stopLossQuantity = null;
  }

  get stopLossQuantity() {
    return this._stopLossQuantity;
  }

  onUpdate() {
    const { account, position } = this.controller;

    if (position.stopLoss === null) {
      this._stopLossQuantity = null;
    } else {
      this._stopLossQuantity = computeStopLossQuantity(account, position);
    }

    super.onUpdate();
  }
}

customElements.define("calculator-controller", CalculatorControllerElement);
customElements.define("account-amount", AccountAmountElement);
customElements.define("account-currency", AccountCurrencyElement);
customElements.define("account-margin-risk", MarginRiskElement);
customElements.define("account-position-risk", PositionRiskElement);
customElements.define("account-places", AccountPlacesElement);
customElements.define("position-currency", PositionCurrencyElement);
customElements.define("position-quote-currency", PositionQuoteCurrencyElement);
customElements.define("position-margin-label", PositionMarginLabelElement);
customElements.define("position-margin", PositionMarginElement);
customElements.define("position-direction", PositionDirectionElement);
customElements.define("position-open-price", PositionOpenPriceElement);
customElements.define("position-quantity-toggle", PositionQuantityToggleElement);
customElements.define("position-quantity", PositionQuantityElement);
customElements.define("affordable-position", AffordablePositionElement);
customElements.define("optimal-position", OptimalPositionElement);
customElements.define("position-stop-loss-toggle", PositionStopLossToggleElement);
customElements.define("position-stop-loss", PositionStopLossElement);
customElements.define("position-stop-loss-distance", PositionStopLossDistanceElement);
customElements.define("position-take-profit-toggle", PositionTakeProfitToggleElement);
customElements.define("position-take-profit", PositionTakeProfitElement);
customElements.define("position-take-profit-distance", PositionTakeProfitDistanceElement);
customElements.define("position-size-report", PositionSizeReportElement);
customElements.define("stop-loss-report", StopLossReportElement);
customElements.define("take-profit-report", TakeProfitReportElement);
customElements.define("planned-stop-loss-report", PlannedStopLossReportElement);
