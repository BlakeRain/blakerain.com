import React, { FC } from "react";
import cn from "classnames";
import styles from "./FloatingLabel.module.scss";

export interface FloatingLabelProps {
  title: React.ReactNode;
  className?: string;
}

export const FloatingLabel: FC<FloatingLabelProps> = ({
  title,
  className,
  children,
}) => {
  return (
    <div className={cn(styles.floatingLabel, className)}>
      <h4>{title}</h4>
      {children}
    </div>
  );
};

export default FloatingLabel;
