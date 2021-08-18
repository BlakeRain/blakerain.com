import { FC } from "react";
import { AuthorDictionary, ListPost, SimpleAuthor } from "../lib/ghost";
import { DateSpan } from "./DateSpan";
import styles from "./PostDetails.module.scss";

const AuthorImages: FC<{ authors: SimpleAuthor[] }> = ({ authors }) => {
  return (
    <div>
      {authors.map((author) =>
        author.profileImage ? (
          <img key={author.id} className={styles.authorImage} src={author.profileImage} />
        ) : null
      )}
    </div>
  );
};

export const PostDetails: FC<{ authors: AuthorDictionary; post: ListPost }> = ({
  authors,
  post,
  children,
}) => {
  const post_authors = post.authors.map((author_id) => authors[author_id]);

  return (
    <div className={styles.postDetails}>
      <AuthorImages authors={post_authors} />
      <div className={styles.postDetailsInner}>
        <ul>
          {post_authors.map((author) => (
            <li key={author.id}>{author.name}</li>
          ))}
        </ul>
        <div className={styles.dateAndTime}>
          <DateSpan date={post.publishedAt || "1970-01-01T00:00:00.000Z"} />
          <span className={styles.readingTime}>{post.readingTime} min read</span>
        </div>
        {children}
      </div>
    </div>
  );
};
