import { FC, useState } from "react";
import cn from "classnames";
import Link from "next/link";
import styles from "./Footer.module.scss";
import Dismissable from "./Dismissable";

/**
 * A drop-down (or drop-up) menu in the footer
 *
 * This component encapsulates the drop-down footer menus
 */
const FooterDropdown: FC<{ title: string }> = ({ title, children }) => {
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
          <Link href="/">
            <a>Blake Rain</a>
          </Link>{" "}
          &copy; {date.getFullYear().toString()}
        </section>
        <nav className={styles.navigation}>
          <Link href="/blog">
            <a>Latest Posts</a>
          </Link>
          <Link href="/tags">
            <a>Tags</a>
          </Link>
          <Link href="/disclaimer">
            <a>Disclaimer</a>
          </Link>
          <Link href="/analytics">
            <a>Analytics</a>
          </Link>
          <a href="https://twitter.com/HalfWayMan">Twitter</a>
          <FooterDropdown title="Tools">
            <li>
              <Link href="/tools/position-size">
                <a>Position Size Calculator</a>
              </Link>
            </li>
          </FooterDropdown>
        </nav>
      </div>
    </footer>
  );
};
