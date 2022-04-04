import React, { FC, useEffect, useRef } from "react";

export const Dismissable: FC<{
  onDismiss: () => void;
}> = ({ onDismiss, children }) => {
  const outerDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        event.target &&
        outerDiv.current &&
        !outerDiv.current.contains(event.target as Node)
      ) {
        onDismiss();
      }
    };

    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [onDismiss]);

  return <div ref={outerDiv}>{children}</div>;
};

export default Dismissable;
