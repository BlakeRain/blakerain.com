import React, { FC, useRef, useState } from "react";
import cn from "classnames";
import styles from "./DropdownButton.module.scss";
import Caret from "./icons/Caret";
import Dismissable from "./Dismissable";

export interface DropdownButtonProps {
  title: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

export const DropdownButton: FC<DropdownButtonProps> = ({
  title,
  onClick,
  disabled,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const onToggleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    setOpen(!open);
  };

  const onDismiss = (event?: MouseEvent) => {
    // console.log(
    //   event.target,
    //   toggleRef.current && toggleRef.current.contains(event.target as Node)
    // );
    //
    if (
      event &&
      toggleRef.current &&
      toggleRef.current.contains(event.target as Node)
    ) {
      // This is a dismiss click on the actual toggle button, so we don't need to dismiss
      return;
    }

    setOpen(false);
  };

  return (
    <div className={styles.container}>
      <button type="button" onClick={onClick} disabled={disabled}>
        {title}
      </button>
      <button
        ref={toggleRef}
        type="button"
        onClick={onToggleClick}
        disabled={disabled}
      >
        <Caret direction="down" filled />
      </button>
      {open && (
        <Dismissable onDismiss={onDismiss}>
          <div className={styles.dropdown} onClick={() => onDismiss()}>
            {children}
          </div>
        </Dismissable>
      )}
    </div>
  );
};

export default DropdownButton;
