const TOGGLE_TEMPLATE_SOURCE = `
  <div class="flex flex-row items-center gap-2">
    <div class="toggle">
      <div class="toggle-background"></div>
      <div class="toggle-inner"></div>
    </div>
    <div class="toggle-label"></div>
  </div>
`;

const TOGGLE_TEMPLATE = document.createElement("template");
TOGGLE_TEMPLATE.innerHTML = TOGGLE_TEMPLATE_SOURCE;

export class ToggleElement extends HTMLElement {
  _checked = false;
  _disabled = false;
  _label = "";
  _toggleElement = null;
  _labelElement = null;

  get checked() {
    return this._checked;
  }

  set checked(value) {
    this._checked = value;
    this._update();
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this._disabled = value;
    this._update();
  }

  get label() {
    return this._label;
  }

  set label(value) {
    this._label = value;
    this._update();
  }

  connectedCallback() {
    this.appendChild(TOGGLE_TEMPLATE.content.cloneNode(true));

    const checked = this.getAttribute("checked");
    if (checked !== null && checked !== "false") {
      this._checked = true;
    }

    const disabled = this.getAttribute("disabled");
    if (disabled !== null && disabled !== "false") {
      this._disabled = true;
    }

    const label = this.getAttribute("label");
    if (label) {
      this._label = label;
    }

    this._toggleElement = this.querySelector(".toggle");
    if (!this._toggleElement) {
      throw new Error("<toggle-element> is missing .toggle element");
    }

    this._toggleElement.addEventListener("click", () => {
      if (!this._disabled) {
        this.checked = !this._checked;
        this.dispatchEvent(new Event("change"));
      }
    });

    this._labelElement = this.querySelector(".toggle-label");
    if (!this._labelElement) {
      throw new Error("<toggle-element> is missing label element");
    }

    this._update();
  }

  _update() {
    this._toggleElement.classList.toggle("active", this._checked);
    this._toggleElement.classList.toggle("inactive", !this._checked);
    this._toggleElement.classList.toggle("disabled", this._disabled);
    this._labelElement.textContent = this._label;
  }
}
