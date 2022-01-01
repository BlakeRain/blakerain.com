import { FC } from "react";
import Link from "next/link";
import styles from "./Footer.module.scss";

export const Footer: FC = () => {
  const date = new Date();

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
            <a href="https://ghost.org/">Ghost CMS</a>
          </nav>
          <div className={styles.badges}>
            <a
              href="https://status.blakerain.com/"
              title="Status page"
              referrerPolicy="origin"
              rel="noopener"
            >
              <img
                src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FBlakeRain%2Fupptime.blakerain.com%2Fmaster%2Fapi%2Fblakerain-com%2Fuptime.json"
                alt="Website uptime metric"
              />
            </a>
            <a
              href="https://status.blakerain.com/"
              title="Status page"
              referrerPolicy="origin"
              rel="noopener"
            >
              <img
                src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FBlakeRain%2Fupptime.blakerain.com%2Fmaster%2Fapi%2Fblakerain-com%2Fresponse-time-day.json"
                alt="Website response time metric"
              />
            </a>
          </div>
        </section>
      </div>
    </footer>
  );
};
