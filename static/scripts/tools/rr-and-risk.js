import { NumberInputElement } from "../elements/number-input.js";
import { formatNumber } from "../format.js";

class State extends EventTarget {
  constructor() {
    super();
    this._ratio = 2.0;
    this._chance = 0.51;
    this._risk = 0.01;
    this._open = 500.0;
    this._jitter = "none";
    this._jitter_frac = 0.0;
    this._jitter_sigma = 0.0;
    this._trials = 20;
  }

  get ratio() {
    return this._ratio;
  }

  set ratio(value) {
    this._ratio = value;
    this.onChange();
  }

  get chance() {
    return this._chance;
  }

  set chance(value) {
    this._chance = value;
    this.onChange();
  }

  get risk() {
    return this._risk;
  }

  set risk(value) {
    this._risk = value;
    this.onChange();
  }

  get open() {
    return this._open;
  }

  set open(value) {
    this._open = value;
    this.onChange();
  }

  get jitter() {
    return this._jitter;
  }

  set jitter(value) {
    this._jitter = value;
    this.onChange();
  }

  get jitterFrac() {
    return this._jitter_frac;
  }

  set jitterFrac(value) {
    this._jitter_frac = value;
    this.onChange();
  }

  get jitterSigma() {
    return this._jitter_sigma;
  }

  set jitterSigma(value) {
    this._jitter_sigma = value;
    this.onChange();
  }

  get trials() {
    return this._trials;
  }

  set trials(value) {
    this._trials = value;
    this.onChange();
  }

  onChange() {
    this.dispatchEvent(new Event("change"));
  }
}

/**
 * @param {State} state
 * @returns {boolean[]}
 */
function generateRolls(trials, chance) {
  if (trials < 1) {
    return [];
  } else if (trials === 1) {
    return [true];
  }

  const indices = Array.from({ length: trials }, (_, i) => i);
  for (let i = trials - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const target = Math.round(chance * trials);
  const trues = new Set(indices.slice(0, target));

  const arr = new Array(trials).fill(false);
  for (let index of indices.slice(0, target)) {
    arr[index] = true;
  }

  return arr;
}

function randUniform(a, b) {
  return a + Math.random() * (b - a);
}

function randNormal() {
  const u1 = 1 - Math.random();
  const u2 = 1 - Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const MIN_REWARD = 0;
const MAX_REWARD = Infinity;

/**
 * @param {State} state
 * @param {number} risk
 * @returns {number}
 */
function computeReturn(state, risk, win) {
  if (!win) {
    return -risk;
  }

  let effectiveReward = state.ratio;
  if (state.jitter === "uniform" && state.jitterFrac > 0) {
    const low = state.ratio * (1 - state.jitterFrac);
    const high = state.ratio * (1 + state.jitterFrac);
    effectiveReward = randUniform(low, high);
  } else if (state.jitter === "gaussian" && state.jitterSigma > 0) {
    effectiveReward = state.ratio + randNormal() * state.jitterSigma;
  }

  effectiveReward = Math.min(MAX_REWARD, Math.max(MIN_REWARD, effectiveReward));
  return risk * effectiveReward;
}

/**
 * @param {number} risk
 * @param {State} state
 * @returns {number}
 */
function computeEffectiveReward(risk, state) {
  let effectiveReward = state.ratio;
  if (state.jitter === "uniform" && state.jitterFrac > 0) {
    const low = state.ratio * (1 - state.jitterFrac);
    const high = state.ratio * (1 + state.jitterFrac);
    effectiveReward = randUniform(low, high);
  } else if (state.jitter === "gaussian" && state.jitterSigma > 0) {
    effectiveReward = state.ratio + randNormal() * state.jitterSigma;
  }

  effectiveReward = Math.min(MAX_REWARD, Math.max(MIN_REWARD, effectiveReward));
  return risk * effectiveReward;
}

/**
 * Computed trade simulation results.
 * @typedef {Object} TradeResult
 * @property {number} open
 * @property {number} risk
 * @property {number} ret
 * @property {number} close
 */

/**
 * @param {State} state
 * @return {TradeResult[]}
 */
function computeReturnTable(state) {
  const rolls = generateRolls(state.trials, state.chance);

  const results = [];
  let account = state.open;
  for (let roll of rolls) {
    const risk = account * state.risk;
    const ret = roll ? computeEffectiveReward(risk, state) : -risk;

    results.push({
      open: account,
      risk,
      ret,
      close: account + ret
    });

    account += ret;
    if (account <= 0) {
      break;
    }
  }

  return results;
}

class RiskRewardControllerElement extends HTMLElement {
  constructor() {
    super();
    /** @type {State} */
    this.state = new State();
    this.results = computeReturnTable(this.state);

    this.state.addEventListener("change", () => {
      this.results = computeReturnTable(this.state);
      this.dispatchEvent(new Event("change"));
    });
  }

  rerun() {
    this.results = computeReturnTable(this.state);
    this.dispatchEvent(new Event("change"));
  }
}

/**
  * Find the nearest parent element that is a controller.
  *
  * @param {HTMLElement} element The starting element
  * @returns {RiskRewardControllerElement | null} The nearest parent controller element
  */
function findControllerParent(element) {
  let parent = element.parentElement;
  while (parent) {
    if (parent instanceof RiskRewardControllerElement) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

class RiskRewardInputElement extends NumberInputElement {
  /**
   * @param {string} prefix The prefix to use for the field
   * @param {string} suffix The suffix to use for the field
   * @param {number} places The number of decimal places to use
   */
  constructor(prefix, suffix, places) {
    super();
    /** @type {RiskRewardControllerElement | null} */
    this._controller = null;
    this._prefix = prefix;
    this._suffix = suffix;
    this._places = places;
  }

  get controller() {
    return this._controller;
  }

  // abstract getValue();
  // abstract setValue(value);

  connectedCallback() {
    super.connectedCallback();
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<risk-reward-*> element must be a child of <risk-reward-controller>");
    }

    this.places = this._places;
    this.prefix = this._prefix;
    this.suffix = this._suffix;
    this.thousands = true;
    this.value = this.getValue();

    this._controller.state.addEventListener("change", () => {
      const newValue = this.getValue();
      if (this.value !== newValue) {
        this.value = newValue;
      }
    });

    this.addEventListener("change", () => {
      this.setValue(this.value);
    });
  }
}

class RiskRewardRatioElement extends RiskRewardInputElement {
  constructor() {
    super("", "%", 0);
  }

  getValue() {
    return 100.0 * this.controller.state.ratio;
  }

  setValue(value) {
    this.controller.state.ratio = value / 100.0;
  }
}

class RiskRewardChanceElement extends RiskRewardInputElement {
  constructor() {
    super("", "%", 0);
  }

  getValue() {
    return 100.0 * this.controller.state.chance;
  }

  setValue(value) {
    this.controller.state.chance = value / 100.0;
  }
}

class RiskRewardRiskElement extends RiskRewardInputElement {
  constructor() {
    super("", "%", 0);
  }

  getValue() {
    return 100.0 * this.controller.state.risk;
  }

  setValue(value) {
    this.controller.state.risk = value / 100.0;
  }
}

class RiskRewardOpenElement extends RiskRewardInputElement {
  constructor() {
    super("", "", 2);
  }

  getValue() {
    return this.controller.state.open;
  }

  setValue(value) {
    this.controller.state.open = value;
  }
}

class RiskRewardJitterElement extends HTMLElement {
  constructor() {
    super();
    /** @type {RiskRewardControllerElement | null} */
    this._controller = null;
    /** @type {HTMLSelectElement | null} */
    this._select = null;
  }

  connectedCallback() {
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<risk-reward-jitter> must be a child of <risk-reward-controller>");
    }

    this._select = this.querySelector("select");
    if (!(this._select instanceof HTMLSelectElement)) {
      throw new Error("<risk-reward-jitter> must contain a <select> element");
    }

    this._select.value = this._controller.state._jitter;
    this._select.addEventListener("change", (event) => {
    this._controller.state._jitter = event.target.value;
    });
  }
}

class RiskRewardJitterFracElement extends RiskRewardInputElement {
  constructor() {
    super("±", "%", 2);
  }

  getValue() {
    return this.controller.state.jitterFrac * 100.0;
  }

  setValue(value) {
    this.controller.state.jitterFrac = value / 100.0;
  }
}

class RiskRewardJitterSigmaElement extends RiskRewardInputElement {
  constructor() {
    super("σ", "", 1);
  }

  getValue() {
    return this.controller.state.jitterSigma;
  }

  setValue(value) {
    this.controller.state.jitterSigma = value;
  }
}

class RiskRewardTrialsElement extends RiskRewardInputElement {
  constructor() {
    super("", "", 0);
  }

  getValue() {
    return Math.trunc(this.controller.state.trials);
  }

  setValue(value) {
    this.controller.state.trials = Math.trunc(value);
  }
}

class RiskRewardRerunElement extends HTMLElement {
  constructor() {
    super();
    /** @type {RiskRewardControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<risk-reward-rerun> must be a child of <risk-reward-controller>");
    }

    const button = this.querySelector("button");
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("<risk-reward-rerun> must contain a <button>");
    }

    button.addEventListener("click", () => this._controller?.rerun());
  }
}

class RiskRewardResultsElement extends HTMLElement {
  constructor() {
    super();
    /** @type {RiskRewardControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<risk-reward-results> must be a child of <risk-reward-controller>");
    }

    this.render();

    this._controller.addEventListener("change", () => this.render());
  }

  render() {
    const results = this._controller.results;

    const newChildren = [];
    for (let i = 0; i < results.length; ++i) {
      const result = results[i];

      const trial = document.createElement("div");
      trial.innerText = (1 + i).toString();
      newChildren.push(trial);

      const open = document.createElement("div");
      open.innerText = formatNumber(result.open, true, 2);
      newChildren.push(open);

      const risk = document.createElement("div");
      risk.innerText = formatNumber(result.risk, true, 2);
      newChildren.push(risk);

      const ret = document.createElement("div");
      ret.innerText = formatNumber(result.ret, true, 2);
      ret.classList.toggle("text-red-500", result.ret < 0);
      newChildren.push(ret);

      const close = document.createElement("div");
      close.innerText = formatNumber(result.close, true, 2);
      newChildren.push(close);
    }

    this.replaceChildren(...newChildren);
  }
}

class RiskRewardResultsSummaryElement extends HTMLElement {
  constructor() {
    super();
    /** @type {RiskRewardControllerElement | null} */
    this._controller = null;
  }

  connectedCallback() {
    this._controller = findControllerParent(this);
    if (!this._controller) {
      throw new Error("<risk-reward-results> must be a child of <risk-reward-controller>");
    }

    this.render();

    this._controller.addEventListener("change", () => this.render());
  }

  render() {
    const { state, results } = this._controller;

    const open = state.open;
    const close = results.length > 0 ? results[results.length - 1].close : open;

    let totalLoss = 0;
    let totalProfit = 0;
    let wins = 0;
    let losses = 0;

    for (let result of results) {
      if (result.ret < 0) {
        totalLoss += Math.abs(result.ret);
        losses++;
      } else if (result.ret >= 0) {
        totalProfit += result.ret;
        wins++;
      }
    }

    this.children[1].innerText = formatNumber(open, true, 2);

    this.children[3].innerText = formatNumber(close, true, 2);
    this.children[3].classList.toggle("text-red-500", close < open);
    this.children[3].classList.toggle("text-green-500", close > open);

    this.children[5].innerText = formatNumber(close - open, true, 2);
    this.children[5].classList.toggle("text-red-500", close < open);
    this.children[5].classList.toggle("text-green-500", close > open);

    this.children[7].innerText = formatNumber(totalProfit, true, 2);

    this.children[9].innerText = formatNumber(-totalLoss, true, 2);
    this.children[9].classList.toggle("text-red-500", totalLoss > 0);

    this.children[11].innerText = formatNumber(wins, true, 0);
    this.children[13].innerText = formatNumber(losses, true, 0);
    this.children[15].innerText = formatNumber(100.0 * wins / (wins + losses), true, 2, "", "%");
  }
}

customElements.define("risk-reward-controller", RiskRewardControllerElement);
customElements.define("risk-reward-ratio", RiskRewardRatioElement);
customElements.define("risk-reward-chance", RiskRewardChanceElement);
customElements.define("risk-reward-risk", RiskRewardRiskElement);
customElements.define("risk-reward-open", RiskRewardOpenElement);
customElements.define("risk-reward-jitter", RiskRewardJitterElement);
customElements.define("risk-reward-jitter-frac", RiskRewardJitterFracElement);
customElements.define("risk-reward-jitter-sigma", RiskRewardJitterSigmaElement);
customElements.define("risk-reward-trials", RiskRewardTrialsElement);
customElements.define("risk-reward-rerun", RiskRewardRerunElement);
customElements.define("risk-reward-results", RiskRewardResultsElement);
customElements.define("risk-reward-results-summary", RiskRewardResultsSummaryElement);
