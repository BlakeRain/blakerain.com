import { FC, useEffect, useRef, useState } from "react";
import cn from "classnames";
import styles from "./ScrollToTop.module.scss";

export const ScrollToTopButton: FC = () => {
  const footerRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const [footerVisible, setFooterVisible] = useState<boolean>(false);

  const onDocumentScroll = () => {
    if (window.pageYOffset > 300) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  };

  const onFooterIntersection: IntersectionObserverCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setFooterVisible(true);
      } else {
        setFooterVisible(false);
      }
    });
  };

  useEffect(() => {
    document.addEventListener("scroll", onDocumentScroll);

    const footer = document.querySelector("footer");
    let observer: IntersectionObserver | null = null;

    if (footer) {
      observer = new IntersectionObserver(onFooterIntersection);
      observer.observe(footer);
      footerRef.current = footer;
    }

    return () => {
      document.removeEventListener("scroll", onDocumentScroll);
      if (observer) {
        observer.disconnect();
      }
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
      &uarr; Goto Top
    </button>
  );
};
