import React, { FC, useEffect, useRef } from "react";

export const Dismissable: FC<{
  onDismiss: (event: MouseEvent) => void;
  className?: string;
}> = ({ onDismiss, className, children }) => {
  const outerDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        event.target &&
        outerDiv.current &&
        !outerDiv.current.contains(event.target as Node)
      ) {
        onDismiss(event);
      }
    };

    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [onDismiss]);

  return (
    <div ref={outerDiv} className={className}>
      {children}
    </div>
  );
};

export default Dismissable;
