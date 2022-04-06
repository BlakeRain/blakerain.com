import React, { FC, useRef, useState } from "react";
import cn from "classnames";
import { formatNumber } from "../lib/tools/utils";
import styles from "./NumberInput.module.scss";

export interface NumberInputProps {
  value: number;

  places?: number;
  prefix?: string;
  suffix?: string;

  onChange?: (value: number) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
}

const NumberInput: FC<NumberInputProps> = ({
  value,
  places = 2,
  prefix,
  suffix,
  onChange,
  className,
  id,
  disabled,
}) => {
  const [focused, setFocused] = useState(false);
  const [editValue, setEditValue] = useState(value.toFixed(places));
  const inputEl = useRef<HTMLInputElement>(null);

  var elementValue = editValue;
  if (!focused) {
    elementValue = formatNumber(value, places, prefix, suffix);
    const valString = value.toFixed(places);
    if (editValue != valString) {
      setEditValue(valString);
    }
  }

  const onFocus = () => {
    window.setTimeout(() => {
      if (inputEl.current) {
        inputEl.current.select();
      }
    }, 150);

    setFocused(true);
  };

  const onBlur = () => {
    setFocused(false);

    try {
      var valueNum = parseFloat(editValue);
      if (onChange) {
        onChange(valueNum);
      }
    } catch (exc) {
      console.error(exc);
      setEditValue(value.toFixed(places));
    }
  };

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setEditValue(event.target.value);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") {
      try {
        var valueNum = parseFloat(editValue);
        if (onChange) {
          onChange(valueNum);

          if (inputEl.current) {
            inputEl.current.select();
          }
        }
      } catch {}
    }
  };

  return (
    <input
      ref={inputEl}
      type="text"
      inputMode="decimal"
      className={cn(styles.numberInput, className)}
      id={id}
      disabled={disabled}
      value={elementValue}
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={onInputChange}
      onKeyDown={onKeyDown}
    />
  );
};

export default NumberInput;
