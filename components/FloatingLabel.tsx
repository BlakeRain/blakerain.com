import React, { FC } from "react";
import styles from "./FloatingLabel.module.scss";

export interface FloatingLabelProps {
  title: React.ReactNode;
}

export const FloatingLabel: FC<FloatingLabelProps> = ({ title, children }) => {
  return (
    <div className={styles.floatingLabel}>
      <h4>{title}</h4>
      {children}
    </div>
  );
};

export default FloatingLabel;
