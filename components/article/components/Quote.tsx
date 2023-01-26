import { PropsWithChildren } from "react";
import styles from "./Quote.module.scss";

export interface QuoteProps {
  url?: string;
  author?: string;
}

const Quote: (props: PropsWithChildren<QuoteProps>) => JSX.Element = ({
  url,
  author,
  children,
}) => {
  return (
    <div className={styles.quote}>
      {children}
      {author && (
        <cite className={styles.quoteAuthor}>
          {url ? (
            <a href={url} target="_blank" rel="noreferrer">
              {author}
            </a>
          ) : (
            author
          )}
        </cite>
      )}
    </div>
  );
};

export default Quote;
