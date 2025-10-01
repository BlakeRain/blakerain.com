export const CURRENCIES = ["GBP", "USD", "EUR", "AUD", "CAD", "JPY"];

export class CurrencySelectElement extends HTMLElement {
  _select = null;
  _value = "GBP";

  get value() {
    return this._value;
  }

  set value(val) {
    if (CURRENCIES.includes(val)) {
      this._value = val;
      if (this._select) {
        this._select.value = val;
      }
    } else {
      throw new Error(`Invalid currency: ${val}`);
    }
  }

  connectedCallback() {
    this._select = this.querySelector("select");
    if (!(this._select instanceof HTMLSelectElement)) {
      throw new Error("<currency-select> must contain a <select> element");
    }

    const value = this.getAttribute("value");
    if (value !== null && CURRENCIES.includes(value)) {
      this._value = value;
    }

    CURRENCIES.forEach((currency) => {
      const option = document.createElement("option");
      option.value = currency;
      option.textContent = currency;
      this._select.append(option);
    });

    this._select.value = this._value;
    this._select.addEventListener("change", (event) => {
      this._value = event.target.value;
      this.dispatchEvent(new Event("change"));
    });
  }
}
