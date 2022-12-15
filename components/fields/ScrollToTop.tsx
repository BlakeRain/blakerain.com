import { FC, useEffect, useRef, useState } from "react";
import cn from "classnames";
import styles from "./ScrollToTop.module.scss";

export const ScrollToTopButton: FC = () => {
  const footerRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const [footerVisible, setFooterVisible] = useState<boolean>(false);

  const onFooterIntersection: IntersectionObserverCallback = (entries) => {
    entries.forEach((entry) => {
      switch (entry.target.tagName) {
        case "NAV":
          setVisible(!entry.isIntersecting);
          break;
        case "FOOTER":
          setFooterVisible(entry.isIntersecting);
          break;
      }
    });
  };

  useEffect(() => {
    const header = document.querySelector("nav:first-of-type");
    const footer = document.querySelector("footer");
    let observer = new IntersectionObserver(onFooterIntersection);

    if (header) {
      observer.observe(header);
    }

    if (footer) {
      observer.observe(footer);
      footerRef.current = footer;
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <button
      className={cn(styles.button, "scroll-button", {
        [styles.visible]: visible,
        [styles.skipFooter]: footerVisible,
      })}
      style={{
        transform:
          visible && footerVisible && footerRef.current
            ? `translateY(-${
                footerRef.current.getBoundingClientRect().height
              }px)`
            : undefined,
      }}
      tabIndex={-1}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      &uarr;<span> Goto Top</span>
    </button>
  );
};
