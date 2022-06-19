import React, { FC, useEffect, useRef } from "react";

/**
 * Provides a dismissable wrapper around an element
 *
 * When a mouse click event is received outside of this component, the `onDismiss` property is called.
 */
export const Dismissable: FC<{
  onDismiss: (event: MouseEvent) => void;
  className?: string;
}> = ({ onDismiss, className, children }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Make sure that the click was not on or in our container before we call the `onDismiss` function.
      if (
        event.target &&
        container.current &&
        !container.current.contains(event.target as Node)
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
    <div ref={container} className={className}>
      {children}
    </div>
  );
};

export default Dismissable;
