import React, { FC } from "react";
import cn from "classnames";
import styles from "./FloatingLabel.module.scss";

export interface FloatingLabelProps {
  title: React.ReactNode;
  className?: string;
  row?: boolean;
}

export const FloatingLabel: FC<React.PropsWithChildren<FloatingLabelProps>> = ({
  title,
  className,
  row = false,
  children,
}) => {
  return (
    <div
      className={cn(
        styles.floatingLabel,
        { [styles.floatingLabelRow]: row },
        className
      )}
    >
      <h4>{title}</h4>
      <div className={styles.floatingLabelBody}>{children}</div>
    </div>
  );
};

export default FloatingLabel;
