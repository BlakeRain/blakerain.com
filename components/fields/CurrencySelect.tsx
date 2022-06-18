import React, { FC } from "react";
import { Currency, CURRENCY_SYMBOLS, CURRENCIES } from "../../lib/tools/forex";

export interface CurrencySelectProps {
  value: Currency;
  exclude?: Currency;
  onChange?: (currency: Currency) => void;
  id?: string;
  disabled?: boolean;
}

const CurrencySelect: FC<CurrencySelectProps> = ({
  value,
  exclude,
  onChange,
  id,
  disabled,
}) => {
  const options = CURRENCIES.filter((currency) => currency !== exclude).map(
    (currency, index) => (
      <option key={index} value={currency}>
        {currency} ({CURRENCY_SYMBOLS.get(currency)})
      </option>
    )
  );

  const onSelectChange: React.ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    if (onChange) {
      onChange(event.target.value as Currency);
    }
  };

  return (
    <select id={id} value={value} onChange={onSelectChange} disabled={disabled}>
      {options}
    </select>
  );
};

export default CurrencySelect;
