import React, { FC } from "react";
import cn from "classnames";
import styles from "./Toggle.module.scss";

export interface ToggleProps {
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  style?: React.CSSProperties;
}

export const Toggle: FC<ToggleProps> = ({
  value,
  disabled = false,
  onChange,
  style,
}) => {
  return (
    <div
      className={cn(styles.toggle, {
        [styles.toggleActive]: value,
        [styles.toggleDisabled]: disabled,
      })}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!value);
      }}
      style={style}
    >
      <div className={styles.toggleBackground} />
      <div className={styles.toggleInner} />
    </div>
  );
};

export default Toggle;
