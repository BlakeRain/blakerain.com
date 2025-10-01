import { CurrencySelectElement } from "../elements/currency-select.js";
import { NumberInputElement } from "../elements/number-input.js";
import { ToggleElement } from "../elements/toggle.js";
import { formatNumber } from "../format.js";

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

function saveExchangeRates() {
  const toSave = { timestamp: Date.now(), rates: EXCHANGE_RATES };
  window.sessionStorage.setItem("exchangeRates", JSON.stringify(toSave));
}

function loadExchangeRates(base) {
  const target = "AUD,CAD,EUR,GBP,JPY,USD";

  if (base in EXCHANGE_RATES) {
    console.log(`Exchange rates for ${base} already loaded`);
    return;
  }

  console.log(`Loading exchange rates for ${base} ...`);
  fetch(`https://api.fxratesapi.com/latest?base=${base}&symbols=${target}`)
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      EXCHANGE_RATES[base] = data.rates;
      saveExchangeRates();
    });
}

function getExchangeRate(base, target) {
  if (base === target) {
    return 1;
  }

  if (base in EXCHANGE_RATES) {
    const rates = EXCHANGE_RATES[base];
    if (target in rates) {
      return rates[target];
    } else {
      throw new Error(`No exchange rate from ${base} to ${target}`);
    }
  } else {
    throw new Error(`No exchange rates for base ${base}`);
  }
}

class Account extends EventTarget {
  constructor() {
    super();
    this._places = 4;
    this._currency = "GBP";
    this._amount = 500;
    this._marginRisk = 0.01;
    this._positionRisk = 0.01;

    loadExchangeRates(this._currency);
  }

  get places() {
    return this._places;
  }

  set places(value) {
    this._places = value;
    this.dispatchEvent(
      new CustomEvent("places.change", {
        detail: { places: this._places },
      })
    );
  }

  get currency() {
    return this._currency;
  }

  set currency(value) {
    this._currency = value;
    loadExchangeRates(this._currency);
    this.dispatchEvent(
      new CustomEvent("currency.change", {
        detail: { currency: this._currency },
      })
    );
  }

  get amount() {
    return this._amount;
  }

  set amount(value) {
    this._amount = value;
    this.dispatchEvent(
      new CustomEvent("amount.change", {
        detail: { amount: this._amount },
      })
    );
  }

  get marginRisk() {
    return this._marginRisk;
  }

  set marginRisk(value) {
    this._marginRisk = value;
    this.dispatchEvent(
      new CustomEvent("marginRisk.change", {
        detail: { marginRisk: this._marginRisk },
      })
    );
  }

  get positionRisk() {
    return this._positionRisk;
  }

  set positionRisk(value) {
    this._positionRisk = value;
    this.dispatchEvent(
      new CustomEvent("positionRisk.change", {
        detail: { positionRisk: this._positionRisk },
      })
    );
  }
}

class Position extends EventTarget {
  constructor() {
    super();
    this._positionCurrency = "GBP";
    this._quoteCurrency = "GBP";
    this._openPrice = 0;
    this._quantity = null;
    this._direction = "long";
    this._margin = 0.05;
    this._takeProfit = null;
    this._stopLoss = null;
  }

  get positionCurrency() {
    return this._positionCurrency;
  }

  set positionCurrency(value) {
    this._positionCurrency = value;
    loadExchangeRates(this._positionCurrency);
    this.dispatchEvent(
      new CustomEvent("positionCurrency.change", {
        detail: { positionCurrency: this._positionCurrency },
      })
    );
  }

  get quoteCurrency() {
    return this._quoteCurrency;
  }

  set quoteCurrency(value) {
    this._quoteCurrency = value;
    this.dispatchEvent(
      new CustomEvent("quoteCurrency.change", {
        detail: { quoteCurrency: this._quoteCurrency },
      })
    );
  }

  get openPrice() {
    return this._openPrice;
  }

  set openPrice(value) {
    this._openPrice = value;
    this.dispatchEvent(
      new CustomEvent("openPrice.change", {
        detail: { openPrice: this._openPrice },
      })
    );
  }

  get quantity() {
    return this._quantity;
  }

  set quantity(value) {
    this._quantity = value;
    this.dispatchEvent(
      new CustomEvent("quantity.change", {
        detail: { quantity: this._quantity },
      })
    );
  }

  get direction() {
    return this._direction;
  }

  set direction(value) {
    this._direction = value;
    this.dispatchEvent(
      new CustomEvent("direction.change", {
        detail: { direction: this._direction },
      })
    );
  }

  get margin() {
    return this._margin;
  }

  set margin(value) {
    this._margin = value;
    this.dispatchEvent(
      new CustomEvent("margin.change", {
        detail: { margin: this._margin },
      })
    );
  }

  get takeProfit() {
    return this._takeProfit;
  }

  set takeProfit(value) {
    this._takeProfit = value;
    this.dispatchEvent(
      new CustomEvent("takeProfit.change", {
        detail: { takeProfit: this._takeProfit },
      })
    );
  }

  get stopLoss() {
    return this._stopLoss;
  }

  set stopLoss(value) {
    this._stopLoss = value;
    this.dispatchEvent(
      new CustomEvent("stopLoss.change", {
        detail: { stopLoss: this._stopLoss },
      })
    );
  }
}

function getStopLossDistance(position) {
  if (position.stopLoss === null) {
    return 0;
  }

  return position.direction === "long"
    ? position.openPrice - position.stopLoss
    : position.stopLoss - position.openPrice;
}

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

function computeActualStopLoss(account, position, pRate, qRate) {
  if (position.stopLoss === null) {
    return null;
  }

  const distance =
    position.direction === "BUY"
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

function computeStopLossQuantity(account, position) {
  const distance =
    position.stopLoss === null
      ? 0
      : position.direction === "BUY"
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
    this.account = new Account();
    this.position = new Position();
  }
}

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

class AccountInfoElement extends HTMLElement {
  connectedCallback() {
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<account-info> must be inside a <calculator-controller>");
    }

    this.querySelector("button").addEventListener("click", () => {
      this.querySelector("pre").innerText = JSON.stringify(
        {
          account: this._controller.account,
          position: this._controller.position,
          size: computePositionSize(this._controller.account, this._controller.position),
          rates: EXCHANGE_RATES,
        },
        undefined,
        2
      );
    });
  }
}

class AccountCurrencyElement extends CurrencySelectElement {
  constructor() {
    super();
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<account-currency> must be inside a <calculator-controller>");
    }

    this._controller.account.addEventListener("currency.change", (event) => {
      if (this.value !== event.detail.currency) {
        this.value = event.detail.currency;
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

    this._controller.account.addEventListener("places.change", (event) => {
      if (this.places !== event.detail.places) {
        this.places = event.detail.places;
      }
    });

    this._controller.account.addEventListener("currency.change", (event) => {
      const newSuffix = " " + event.detail.currency;
      if (this.suffix !== newSuffix) {
        this.suffix = newSuffix;
      }
    });

    this._controller.account.addEventListener("amount.change", (event) => {
      if (this.value !== event.detail.amount) {
        this.value = event.detail.amount;
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

    this._controller.account.addEventListener("marginRisk.change", (event) => {
      const newValue = event.detail.marginRisk * 100;
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

    this._controller.account.addEventListener("positionRisk.change", (event) => {
      const newValue = event.detail.positionRisk * 100;
      if (this.value !== newValue) {
        this.value = newValue;
      }
    });
  }
}

class AccountPlacesElement extends NumberInputElement {
  constructor() {
    super();
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

    this._controller.account.addEventListener("places.change", (event) => {
      if (this.value !== event.detail.places) {
        this.value = event.detail.places;
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
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-currency> must be inside a <calculator-controller>");
    }

    this._controller.position.addEventListener("positionCurrency.change", (event) => {
      if (this.value !== event.detail.positionCurrency) {
        this.value = event.detail.positionCurrency;
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
    this._controller = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-quote-currency> must be inside a <calculator-controller>");
    }

    this._controller.position.addEventListener("quoteCurrency.change", (event) => {
      if (this.value !== event.detail.quoteCurrency) {
        this.value = event.detail.quoteCurrency;
      }
    });

    this.value = this._controller.position.quoteCurrency;
    this.addEventListener("change", () => {
      this._controller.position.quoteCurrency = this.value;
    });
  }
}

class PositionMarginLabelElement extends HTMLElement {
  connectedCallback() {
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<position-margin-label> must be inside a <calculator-controller>");
    }

    this._label = this.querySelector("label");
    if (!this._label) {
      throw new Error("<position-margin-label> must contain a <label> element");
    }

    this._controller.position.addEventListener("margin.change", () => {
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

    this._controller.position.addEventListener("margin.change", (event) => {
      const newValue = event.detail.margin * 100;
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

    this._controller.position.addEventListener("direction.change", (event) => {
      select.value = event.detail.direction;
    });
  }
}

class PositionOpenPriceElement extends NumberInputElement {
  constructor() {
    super();
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

    this._controller.account.addEventListener("places.change", (event) => {
      if (this.places !== event.detail.places) {
        this.places = event.detail.places;
      }
    });

    this._controller.position.addEventListener("quoteCurrency.change", (event) => {
      const newSuffix = " " + event.detail.quoteCurrency;
      if (this.suffix !== newSuffix) {
        this.suffix = newSuffix;
      }
    });

    this._controller.position.addEventListener("openPrice.change", (event) => {
      if (this.value !== event.detail.openPrice) {
        this.value = event.detail.openPrice;
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

    this._controller.position.addEventListener("quantity.change", (event) => {
      const hasQuantity = event.detail.quantity !== null;
      if (this.checked !== hasQuantity) {
        this.checked = hasQuantity;
      }
    });
  }
}

class PositionQuantityElement extends NumberInputElement {
  constructor() {
    super();
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

    this._controller.account.addEventListener("places.change", (event) => {
      if (this.places !== event.detail.places) {
        this.places = event.detail.places;
      }
    });

    this._controller.position.addEventListener("quantity.change", (event) => {
      const newValue = event.detail.quantity || 0;
      if (this.value !== newValue) {
        this.value = newValue;
      }

      this.disabled = event.detail.quantity === null;
    });

    this.addEventListener("change", () => {
      this._controller.position.quantity = this.value;
    });
  }
}

class AffordablePositionElement extends HTMLElement {
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
        this._controller.position
      );

      this._controller.position.quantity = affordable;
    });

    this._controller.position.addEventListener("quantity.change", () => {
      this._update();
    });

    this._controller.position.addEventListener("openPrice.change", () => {
      this._update();
    });
  }

  _update() {
    this._button.disabled =
      this._controller.position.quantity === null || this._controller.position.openPrice === 0;
  }
}

class PositionStopLossToggleElement extends ToggleElement {
  constructor() {
    super();
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

    this._controller.position.addEventListener("stopLoss.change", (event) => {
      const hasStopLoss = event.detail.stopLoss !== null;
      if (this.checked !== hasStopLoss) {
        this.checked = hasStopLoss;
      }
    });
  }
}

class PositionStopLossElement extends NumberInputElement {
  constructor() {
    super();
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

    this._controller.account.addEventListener("places.change", (event) => {
      if (this.places !== event.detail.places) {
        this.places = event.detail.places;
      }
    });

    this._controller.position.addEventListener("quoteCurrency.change", (event) => {
      const newSuffix = " " + event.detail.quoteCurrency;
      if (this.suffix !== newSuffix) {
        this.suffix = newSuffix;
      }
    });

    this._controller.position.addEventListener("stopLoss.change", (event) => {
      const newValue = event.detail.stopLoss || 0;
      if (this.value !== newValue) {
        this.value = newValue;
      }
      this.disabled = event.detail.stopLoss === null;
    });

    this.addEventListener("change", () => {
      this._controller.position.stopLoss = this.value;
    });
  }
}

class PositionStopLossDistanceElement extends NumberInputElement {
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

    this._controller.account.addEventListener("places.change", (event) => {
      if (this.places !== event.detail.places) {
        this.places = event.detail.places;
      }
    });

    this._controller.position.addEventListener("quoteCurrency.change", (event) => {
      const newSuffix = " " + event.detail.quoteCurrency;
      if (this.suffix !== newSuffix) {
        this.suffix = newSuffix;
      }
    });

    this._controller.position.addEventListener("stopLoss.change", (event) => {
      this.value = getStopLossDistance(this._controller.position);
      this.disabled = event.detail.stopLoss === null;
    });

    this._controller.position.addEventListener("openPrice.change", () => {
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

class ReportRow {
  constructor(filter, label, places, prefix, suffix, compute) {
    this._filter = filter;
    this._label = label;
    this._places = places;
    this._prefix = prefix;
    this._suffix = suffix;
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

  label(report) {
    if (typeof this._label === "function") {
      return this._label(report);
    }

    return this._label;
  }

  places(report) {
    if (typeof this._places === "function") {
      return this._places(report);
    }

    return this._places;
  }

  prefix(report) {
    if (typeof this._prefix === "function") {
      return this._prefix(report);
    }

    return this._prefix;
  }

  suffix(report) {
    if (typeof this._suffix === "function") {
      return this._suffix(report);
    }

    return this._suffix;
  }

  compute(report) {
    return this._compute(report);
  }

  static builder() {
    class ReportRowBuilder {
      constructor() {
        this._filter = () => true;
        this._label = null;
        this._places = 2;
        this._prefix = null;
        this._suffix = null;
        this._compute = () => 0;
      }

      filter(filter) {
        this._filter = filter;
        return this;
      }

      label(label) {
        this._label = label;
        return this;
      }

      places(places) {
        this._places = places;
        return this;
      }

      prefix(prefix) {
        this._prefix = prefix;
        return this;
      }

      suffix(suffix) {
        this._suffix = suffix;
        return this;
      }

      compute(compute) {
        this._compute = compute;
        return this;
      }

      build() {
        return new ReportRow(
          this._filter,
          this._label,
          this._places,
          this._currency,
          this._suffix,
          this._compute
        );
      }
    }

    return new ReportRowBuilder();
  }
}

function buildReportRows(container, reportRows) {
  const rows = [];
  for (const row of reportRows) {
    const rowElement = document.createElement("div");
    rowElement.classList.add("grid", "col-span-2", "grid-cols-subgrid");

    if (row.hasLabel) {
      const label = document.createElement("div");
      label.classList.add("font-bold", "text-left");

      if (!row.mutatingLabel) {
        label.innerText = row.label();
      }

      rowElement.append(label);
    }

    const value = document.createElement("div");
    value.classList.add("text-right");
    if (!row.hasLabel) {
      value.classList.add("col-start-2");
    }

    rowElement.append(value);
    container.append(rowElement);
    rows.push(rowElement);
  }

  return rows;
}

function updateReportRows(rowElements, reportRows, report) {
  for (let i = 0; i < reportRows.length; i++) {
    const row = reportRows[i];
    const rowElement = rowElements[i];

    if (!row.filter(report)) {
      rowElement.style.display = "none";
      continue;
    } else {
      rowElement.style.display = "";
    }

    if (row.mutatingLabel) {
      const labelElement = rowElement.querySelector("div:first-child");
      labelElement.innerText = row.label(report);
    }

    const valueElement = rowElement.querySelector("div:last-child");
    valueElement.innerText = formatNumber(
      row.compute(report),
      true,
      row.places(report),
      row.prefix(report),
      row.suffix(report)
    );
  }
}

class ReportElement extends HTMLElement {
  constructor(reportRows) {
    super();
    this._controller = null;
    this._reportRows = reportRows;
  }

  get controller() {
    return this._controller;
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

    this._controller.account.addEventListener("amount.change", () => {
      this.onUpdate();
    });

    this._controller.account.addEventListener("currency.change", () => {
      this.onUpdate();
    });

    this._controller.account.addEventListener("marginRisk.change", () => {
      this.onUpdate();
    });

    this._controller.account.addEventListener("positionRisk.change", () => {
      this.onUpdate();
    });

    this._controller.position.addEventListener("positionCurrency.change", () => {
      this.onUpdate();
    });

    this._controller.position.addEventListener("quoteCurrency.change", () => {
      this.onUpdate();
    });

    this._controller.position.addEventListener("openPrice.change", () => {
      this.onUpdate();
    });

    this._controller.position.addEventListener("quantity.change", () => {
      this.onUpdate();
    });

    this._controller.position.addEventListener("margin.change", () => {
      this.onUpdate();
    });

    this._controller.position.addEventListener("direction.change", () => {
      this.onUpdate();
    });

    this._controller.position.addEventListener("stopLoss.change", () => {
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
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.account.currency)
    .compute((report) => report.sizeReport.available)
    .build(),
  ReportRow.builder()
    .filter(
      (report) => report.controller.position.positionCurrency !== report.controller.account.currency
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.sizeReport.availablePosition)
    .build(),
  ReportRow.builder()
    .filter(
      (report) =>
        report.controller.position.quoteCurrency !== report.controller.position.positionCurrency
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.quoteCurrency)
    .compute((report) => report.sizeReport.availableQuote)
    .build(),

  ReportRow.builder()
    .label("Available Margin")
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.account.currency)
    .compute((report) => report.sizeReport.margin)
    .build(),
  ReportRow.builder()
    .filter(
      (report) => report.controller.position.positionCurrency !== report.controller.account.currency
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.sizeReport.marginPosition)
    .build(),
  ReportRow.builder()
    .filter(
      (report) =>
        report.controller.position.quoteCurrency !== report.controller.position.positionCurrency
    )
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.quoteCurrency)
    .compute((report) => report.sizeReport.marginQuote)
    .build(),
  ReportRow.builder()
    .label("Affordable Position Size")
    .places(2)
    .suffix(" units")
    .compute((report) => report.sizeReport.affordable)
    .build(),


  ReportRow.builder()
    .filter(report => report.sizeReport.actual)
    .label("Actual Quantity")
    .places(2)
    .suffix(" units")
    .compute((report) => report.controller.position.quantity)
    .build(),
  ReportRow.builder()
    .filter(report => report.sizeReport.actual)
    .label("Actual Cost")
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.quoteCurrency)
    .compute((report) => report.controller.position.quantity * report.controller.position.openPrice)
    .build(),
  ReportRow.builder()
    .filter(report => report.sizeReport.actual)
    .label("Required Margin")
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.quoteCurrency)
    .compute((report) => report.sizeReport.actual.costQuote)
    .build(),
  ReportRow.builder()
    .filter(report => report.sizeReport.actual && (report.controller.position.quoteCurrency !== report.controller.position.positionCurrency))
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.position.positionCurrency)
    .compute((report) => report.sizeReport.actual.costPosition)
    .build(),
  ReportRow.builder()
    .filter(report => report.sizeReport.actual && (report.controller.account.currency !== report.controller.position.positionCurrency))
    .places((report) => report.controller.account.places)
    .suffix((report) => " " + report.controller.account.currency)
    .compute((report) => report.sizeReport.actual.cost)
    .build(),
  ReportRow.builder()
    .filter(report => report.sizeReport.actual)
    .label("Committed Account")
    .places(2)
    .suffix(" %")
    .compute((report) => report.sizeReport.actual.margin * 100.0)
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

  onUpdate() {
    this._sizeReport = computePositionSize(this._controller.account, this._controller.position);
    super.onUpdate();
  }
}

customElements.define("calculator-controller", CalculatorControllerElement);
customElements.define("account-amount", AccountAmountElement);
customElements.define("account-currency", AccountCurrencyElement);
customElements.define("account-info", AccountInfoElement);
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
customElements.define("position-stop-loss-toggle", PositionStopLossToggleElement);
customElements.define("position-stop-loss", PositionStopLossElement);
customElements.define("position-stop-loss-distance", PositionStopLossDistanceElement);
customElements.define("position-size-report", PositionSizeReportElement);
