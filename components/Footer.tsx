import { FC, useState } from "react";
import cn from "classnames";
import Link from "next/link";
import styles from "./Footer.module.scss";
import Dismissable from "./Dismissable";

export const Footer: FC = () => {
  const date = new Date();
  const [showTools, setShowTools] = useState(false);

  const onToolsClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    event.preventDefault();
    setShowTools(!showTools);
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <section className={styles.copyright}>
          <Link href="/">
            <a>Blake Rain</a>
          </Link>{" "}
          &copy; {date.getFullYear().toString()}
        </section>
        <section className={styles.navigation}>
          <nav>
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
            <Dismissable
              onDismiss={() => setShowTools(false)}
              className={cn(styles.popup, { [styles.popupOpen]: showTools })}
            >
              <div className={cn(styles.popupMenu)}>
                <ul>
                  <li>
                    <Link href="/tools/position-size">
                      <a>Position Size Calculator</a>
                    </Link>
                  </li>
                </ul>
              </div>
              <a href="#" onClick={onToolsClick}>
                Tools
              </a>
            </Dismissable>
          </nav>
        </section>
      </div>
    </footer>
  );
};
