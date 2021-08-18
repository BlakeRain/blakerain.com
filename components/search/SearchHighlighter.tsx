import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { FC, useEffect, useRef, useState } from "react";
import Mark from "mark.js";
import styles from "./SearchHighlighter.module.scss";

export const getHighlightTerm = (search: ParsedUrlQuery): string | null => {
  if ("highlight" in search) {
    const term = search["highlight"];
    if (typeof term === "string" && term.length > 0) {
      return term;
    }
  }

  return null;
};

const SearchHighlightControls: FC<{
  current: number;
  marks: HTMLElement[];
  setCurrent: (index: number) => void;
  onClear: () => void;
}> = ({ current, marks, setCurrent, onClear }) => {
  const jumpTo = (index: number) => {
    index = index % marks.length;
    if (index < marks.length) {
      if (current !== -1) {
        marks[current].className = "";
      }

      setCurrent(index);
      marks[index].className = "current";
      marks[index].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const onNextClick = () => {
    jumpTo(current + 1);
  };

  const onPrevClick = () => {
    if (current === 0) {
      jumpTo(marks.length - 1);
    } else {
      jumpTo(current - 1);
    }
  };

  const onClearClick = () => {
    onClear();
  };

  if (marks.length === 0) {
    return null;
  }

  return (
    <div className={styles.controls}>
      <button type="button" className={styles.button} onClick={onNextClick}>
        &daddr; Next
      </button>
      <button type="button" className={styles.button} onClick={onPrevClick}>
        &uaddr; Previous
      </button>
      <button type="button" className={styles.button} onClick={onClearClick}>
        Clear
      </button>
      <span className={styles.label}>
        {current === -1 ? "0" : (current + 1).toString()} / {marks.length.toString()} result
        {marks.length === 1 ? "" : "s"}
      </span>
    </div>
  );
};

export const SearchHighlighter: FC<{ term: string | null }> = ({ term, children }) => {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const mark = useRef<Mark>();
  const [marks, setMarks] = useState<HTMLElement[]>([]);
  const [current, setCurrent] = useState<number>(-1);

  const getMarkInstance = () => {
    if (mark.current) {
      return mark.current;
    } else {
      if (contentRef.current) {
        return (mark.current = new Mark(contentRef.current));
      } else {
        throw new Error("Cannot find content div reference");
      }
    }
  };

  const onClearHighlight = () => {
    setMarks([]);
    setCurrent(-1);

    if (mark.current) {
      mark.current.unmark();
    }
  };

  useEffect(() => {
    if (term) {
      const instance = getMarkInstance();

      instance.unmark();
      instance.mark(term, {
        separateWordSearch: true,
        done: (total: number) => {
          const new_marks: HTMLElement[] = Array.prototype.slice.call(
            contentRef.current?.querySelectorAll("mark") || []
          );

          setMarks(new_marks);
          if (new_marks.length > 0) {
            setCurrent(0);
            new_marks[0].className = "current";
            new_marks[0].scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          } else {
            setCurrent(-1);
          }
        },
      });
    }
  }, [term, router.pathname]);

  return (
    <div ref={contentRef} className={marks.length > 0 ? "has-highlight-marks" : ""}>
      {children}
      <SearchHighlightControls
        current={current}
        setCurrent={setCurrent}
        marks={marks}
        onClear={onClearHighlight}
      />
    </div>
  );
};
