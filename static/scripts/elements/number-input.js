import { formatNumber } from "../format.js";

export class NumberInputElement extends HTMLElement {
  _thousands = false;
  _places = 0;
  _prefx = "";
  _suffix = "";
  _value = 0.0;
  _disabled = false;
  _foused = false;

  get thousands() {
    return this._thousands;
  }

  set thousands(value) {
    this._thousands = value;
    if (!this._focused) {
      this._setInputValue();
    }
  }

  get places() {
    return this._places;
  }

  set places(value) {
    this._places = value;
    if (!this._focused) {
      this._setInputValue();
    }
  }

  get prefix() {
    return this._prefix;
  }

  set prefix(value) {
    this._prefix = value;
    if (!this._focused) {
      this._setInputValue();
    }
  }

  get suffix() {
    return this._suffix;
  }

  set suffix(value) {
    this._suffix = value;
    if (!this._focused) {
      this._setInputValue();
    }
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    if (!this._focused) {
      this._setInputValue();
    } else {
      this._input.value = formatNumber(this._value, false, this._places, null, null);
      this._input.select();
    }
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this._disabled = value;
    this._input.disabled = value;
  }

  connectedCallback() {
    this._input = this.querySelector("input");
    if (!this._input) {
      throw new Error("<number-input> must contain an <input> element");
    }

    const thousands = this.getAttribute("thousands");
    if (thousands !== null) {
      this._thousands = thousands === "true";
    }

    const places = this.getAttribute("places");
    if (places !== null) {
      this._places = parseInt(places);
    }

    const prefix = this.getAttribute("prefix");
    if (prefix !== null) {
      this._prefix = prefix;
    }

    const suffix = this.getAttribute("suffix");
    if (suffix !== null) {
      this._suffix = suffix;
    }

    const value = this.getAttribute("value");
    if (value !== null) {
      this.value = parseFloat(value);
    }

    this._input.addEventListener("focus", () => {
      this._focused = true;
      this._input.value = formatNumber(this._value, false, this._places, null, null);
      window.setTimeout(() => {
        this._input.select();
      }, 50);
    });

    this._input.addEventListener("blur", () => {
      this._focused = false;
      this._parseInput();
      this._setInputValue();
    });

    this._input.addEventListener("change", () => {
      this._parseInput();
    });
  }

  _setInputValue() {
    this._input.value = formatNumber(
      this._value,
      this._thousands,
      this._places,
      this._prefix,
      this._suffix
    );
  }

  _parseInput() {
    const parsed = parseFloat(this._input.value.replace(/[^0-9.-]/g, ""));
    if (!isNaN(parsed)) {
      this._value = parsed;
      this.dispatchEvent(new CustomEvent("change", { detail: { value: parsed } }));
    }
  }
}
