import React, { FC, useState } from "react";
import cn from "classnames";
import styles from "./Tooltip.module.scss";
import QuestionCircle from "./icons/QuestionCircle";

export interface TooltipProps {
  position?: "top" | "left" | "bottom" | "right";
}

export const Tooltip: FC<TooltipProps> = ({ position = "top", children }) => {
  const [open, setOpen] = useState(false);

  const onMouseOver: React.MouseEventHandler<HTMLDivElement> = () => {
    setOpen(true);
  };

  const onMouseOut: React.MouseEventHandler<HTMLDivElement> = () => {
    setOpen(false);
  };

  return (
    <div
      className={styles.tooltip}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    >
      <QuestionCircle />
      {open && (
        <div
          className={cn(styles.tooltipBody, styles[`tooltipBody_${position}`])}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
