import React, { FC } from "react";
import styles from "./Card.module.scss";

export interface CardProps {
  title?: string;
}

export const Card: FC<React.PropsWithChildren<CardProps>> = ({
  title,
  children,
}) => {
  return (
    <div className={styles.card}>
      {title && (
        <div className={styles.cardTitle}>
          <h4>{title}</h4>
        </div>
      )}
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
};

export default Card;
