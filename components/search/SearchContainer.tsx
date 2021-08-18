import { FC, MouseEvent, useRef } from "react";
import cn from "classnames";
import { SearchChildProps } from "./SearchProvider";
import { SearchDialog } from "./SearchDialog";
import styles from "./SearchContainer.module.scss";

export const SearchContainer: FC<SearchChildProps> = (props) => {
  const containerRef = useRef(null);

  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === containerRef.current) {
      props.setSearchVisible(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(styles.searchContainer, { [styles.hidden]: !props.searchVisible })}
      onClick={handleBackdropClick}>
      {props.searchVisible ? (
        <div className={styles.searchBox}>
          {props.searchData ? (
            <SearchDialog {...props} />
          ) : (
            <div className={cn(styles.row, "center")}>
              <div className={styles.column}>
                <h1>Search is unavailable</h1>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
