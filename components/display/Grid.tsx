import React, { FC } from "react";
import cn from "classnames";
import styles from "./Grid.module.scss";

export interface GridProps {
  rows?: number | string[];
  columns?: number | string[];
  rowGap?: number;
  columnGap?: number;
  mt?: number;
  mr?: number;
  mb?: number;
  ml?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Grid: FC<React.PropsWithChildren<GridProps>> = ({
  rows,
  columns,
  rowGap,
  columnGap,
  mt,
  mr,
  mb,
  ml,
  style,
  className,
  children,
}) => {
  const computedStyle: React.CSSProperties = { ...style };

  if (typeof rows === "number") {
    computedStyle.gridTemplateRows = `repeat(${rows}, 1fr)`;
  } else if (rows instanceof Array) {
    computedStyle.gridTemplateRows = rows.join(" ");
  }

  if (typeof columns === "number") {
    computedStyle.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  } else if (columns instanceof Array) {
    computedStyle.gridTemplateColumns = columns.join(" ");
  }

  if (typeof rowGap === "number") {
    computedStyle.rowGap = `${rowGap}rem`;
  }

  if (typeof columnGap === "number") {
    computedStyle.columnGap = `${columnGap}rem`;
  }

  if (typeof mt === "number") {
    computedStyle.marginTop = `${mt}rem`;
  }

  if (typeof mr === "number") {
    computedStyle.marginRight = `${mr}rem`;
  }

  if (typeof mb === "number") {
    computedStyle.marginBottom = `${mb}rem`;
  }

  if (typeof ml === "number") {
    computedStyle.marginLeft = `${ml}rem`;
  }

  return (
    <div className={cn(styles.grid, className)} style={computedStyle}>
      {children}
    </div>
  );
};

export default Grid;
