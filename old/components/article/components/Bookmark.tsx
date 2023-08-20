import React from "react";
import styles from "./Bookmark.module.scss";

export interface BookmarkProps {
  url: string;
  title: string;
  author: string;
  description: string;
  icon?: string;
  publisher?: string;
  thumbnail?: string;
}

const Bookmark: (props: BookmarkProps) => JSX.Element = ({
  url,
  title,
  author,
  description,
  icon,
  publisher,
  thumbnail,
}) => {
  return (
    <figure className={styles.bookmark}>
      <a className={styles.bookmarkContainer} href={url}>
        <div className={styles.bookmarkContent}>
          <div className={styles.bookmarkTitle}>{title}</div>
          {description && (
            <div className={styles.bookmarkDescription}>{description}</div>
          )}
          <div className={styles.bookmarkMetadata}>
            {icon && (
              <img
                className={styles.bookmarkIcon}
                alt={publisher || undefined}
                src={icon}
              />
            )}
            {publisher && (
              <span className={styles.bookmarkPublisher}>{publisher}</span>
            )}
            {author && <span className={styles.bookmarkAuthor}>{author}</span>}
          </div>
        </div>
        {thumbnail && (
          <div className={styles.bookmarkThumbnail}>
            <img src={thumbnail} alt={title} loading="lazy" decoding="async" />
          </div>
        )}
      </a>
    </figure>
  );
};

export default Bookmark;
