import { FC } from "react";
import { GitLogEntry } from "../../lib/git";
import { zeroPad } from "../../lib/utils";
import styles from "./RevisionHistory.module.scss";

export interface RevisionHistoryProps {
  history: GitLogEntry[];
}

const renderDate = (input: string): string => {
  const date = new Date(input);
  return `${zeroPad(date.getFullYear(), 4)}-${zeroPad(
    1 + date.getMonth(),
    2
  )}-${zeroPad(date.getDate(), 2)}`;
};

export const RevisionHistory: FC<RevisionHistoryProps> = ({ history }) => {
  return (
    <div className={styles.revisionHistory}>
      <h3>Revisions</h3>
      <ul>
        {history.map((entry, index) => (
          <li key={index.toString()}>
            {renderDate(entry.date)} &mdash;{" "}
            <a
              href={`https://github.com/BlakeRain/blakerain.com/commit/${entry.hash}`}
            >
              {entry.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RevisionHistory;
