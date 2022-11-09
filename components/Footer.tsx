import React, { FC, useState } from "react";
import cn from "classnames";
import Link from "next/link";
import styles from "./Footer.module.scss";
import Dismissable from "./Dismissable";

/**
 * A drop-down (or drop-up) menu in the footer
 *
 * This component encapsulates the drop-down footer menus
 */
const FooterDropdown: FC<React.PropsWithChildren<{ title: string }>> = ({
  title,
  children,
}) => {
  const [visible, setVisible] = useState(false);

  const onLinkClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    event.preventDefault();
    setVisible(!visible);
  };

  return (
    <Dismissable
      onDismiss={() => setVisible(false)}
      className={cn(styles.popup, visible && styles.popupOpen)}
    >
      <div className={cn(styles.popupMenu)}>
        <ul>{children}</ul>
      </div>
      <a href="#" onClick={onLinkClick}>
        {title}
      </a>
    </Dismissable>
  );
};

/**
 * Provides the footer for the website.
 *
 * The site footer includes a copyright notice and a set of links. Some of those links may be drop-down menus that
 * provide additional links.
 */
export const Footer: FC = () => {
  const date = new Date();

  return (
    <footer className={cn(styles.footer, styles.outer)}>
      <div className={cn(styles.footerInner, styles.inner)}>
        <section className={styles.copyright}>
          <Link href="/">Blake Rain</Link> &copy;{" "}
          {date.getFullYear().toString()}
        </section>
        <nav className={styles.navigation}>
          <Link href="/blog">Latest Posts</Link>
          <Link href="/tags">Tags</Link>
          <Link href="/disclaimer">Disclaimer</Link>
          <a href="https://twitter.com/HalfWayMan">Twitter</a>
          <FooterDropdown title="Tools">
            <li>
              <Link href="/analytics">Analytics Dashboard</Link>
              <Link href="/tools/position-size">Position Size Calculator</Link>
            </li>
          </FooterDropdown>
        </nav>
      </div>
    </footer>
  );
};
