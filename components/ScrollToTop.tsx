import { FC, useEffect, useState } from "react";
import cn from "classnames";
import styles from "./ScrollToTop.module.scss";

export const ScrollToTopButton: FC = () => {
  const [visible, setVisible] = useState<boolean>(false);

  const onDocumentScroll = () => {
    if (window.pageYOffset > 300) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("scroll", onDocumentScroll);

    return () => {
      document.removeEventListener("scroll", onDocumentScroll);
    };
  }, []);

  return visible ? (
    <button
      className={cn(styles.button, "scroll-button")}
      tabIndex={-1}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}>
      &uarr; Goto Top
    </button>
  ) : null;
};
