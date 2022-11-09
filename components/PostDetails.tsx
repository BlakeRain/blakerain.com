import React, { FC } from "react";
import { DocInfo } from "../lib/content";
import { DateSpan } from "./display/DateSpan";

import styles from "./PostDetails.module.scss";

export const PostDetails: FC<
  React.PropsWithChildren<{ doc: DocInfo & { readingTime?: number } }>
> = ({ doc, children }) => {
  return (
    <div className={styles.postDetails}>
      <div>
        <img
          className={styles.authorImage}
          src="/media/profile.png"
          alt="Blake Rain profile picture"
        />
      </div>
      <div className={styles.postDetailsInner}>
        <ul>
          <li>Blake Rain</li>
        </ul>
        <div className={styles.dateAndTime}>
          <DateSpan date={doc.published || "1970-01-01T00:00:00.000Z"} />
          {typeof doc.readingTime === "number" && (
            <span className={styles.readingTime}>
              {doc.readingTime} min read
            </span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};
