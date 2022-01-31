import React, { ChangeEvent, FC, KeyboardEvent, useState } from "react";
import cn from "classnames";
import { useRouter } from "next/router";
import Link from "next/link";
import { SearchChildProps } from "./SearchProvider";
import styles from "./SearchDialog.module.scss";
import {
  SearchResult,
  PreparedIndex,
  IndexDocument,
} from "../../lib/search/index";

interface ExtSearchResult extends SearchResult {
  current: boolean;
  index: number;
}

export const SearchDialog: FC<SearchChildProps> = (props) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<ExtSearchResult[]>([]);
  const [highlight, setHighlight] = useState<string>("");
  const [active, setActive] = useState<number>(-1);
  const query = `?highlight=${highlight}`;

  const completeSearch = (term: string) => {
    if (!props.searchData) {
      return;
    }

    const searchData = props.searchData;

    // Sanitise the search input: we only care about letters really.
    let terms = term.toLowerCase().split(/\s+/);

    // If we have no search term, then there are no results
    if (terms.length < 1 || (terms.length === 1 && terms[0].length < 1)) {
      setSearchResults([]);
      setHighlight("");
      return;
    }

    // We highlight the user's input, not the search term
    setHighlight(encodeURIComponent(term));

    // Perform the search, but fill in the missing fields (current and index)
    const results = searchData.search(terms).map(
      (result, index) =>
        ({
          ...result,
          index,
          current: result.document.url === location.pathname,
        } as ExtSearchResult)
    );

    // Find a result that matches the current page (if there is one)
    const current = results.find((result) => result.current);

    // Filter out the remaining search results if we have a match on the current page
    const remaining = current
      ? results.filter((result) => !result.current)
      : results;

    // If there is a match on the current page, add that result first, then the result of the results.
    if (current) {
      current.index = 0;
      remaining.forEach((result, index) => {
        result.index = 1 + index;
      });
      remaining.unshift(current);
    } else {
      remaining.forEach((result, index) => {
        result.index = index;
      });
    }

    setSearchResults(remaining);
    setActive(-1);
  };

  const onSearchTermChanged = (event: ChangeEvent) => {
    const target = event.target as HTMLInputElement;
    setSearchTerm(target.value);
    completeSearch(target.value.trim());
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(Math.min(active + 1, searchResults.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(0, active - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active !== -1) {
        props.setSearchVisible(false);
        router.push(searchResults[active].document.url + query);
      }
    }
  };

  var result = null;
  if (searchTerm.length == 0) {
    result = (
      <div className={cn(styles.row, "center")}>
        <div className={styles.column}>Search for a word prefix.</div>
      </div>
    );
  } else if (searchResults.length == 0) {
    result = (
      <div className={cn(styles.row, "center")} style={{ color: "#c7cf2f" }}>
        Sorry, nothing was found.
      </div>
    );
  } else {
    const SearchLink: FC<{
      post: IndexDocument;
      index: number;
    }> = ({ post, index }) => {
      return (
        <Link href={post.url + query}>
          <a
            className={cn(styles.row, styles.searchResult, {
              [styles.active]: index === active,
            })}
            onClick={() => {
              props.setSearchVisible(false);
            }}
          >
            <div className={styles.column}>
              <div className={styles.postTitle}>{post.title}</div>
              <div className={styles.postExcerpt}>{post.excerpt}</div>
            </div>
          </a>
        </Link>
      );
    };

    const search_links = searchResults.map((result, index) => {
      const link = (
        <SearchLink
          key={index.toString()}
          post={result.document}
          index={result.index}
        />
      );

      if (result.current) {
        return (
          <div
            key={index.toString()}
            className={cn(styles.currentPage, {
              [styles.others]: searchResults.length > 1,
            })}
          >
            {link}
          </div>
        );
      } else {
        return link;
      }
    });

    result = (
      <React.Fragment>
        {search_links}
        <div className={cn(styles.row, styles.center)}>
          <p>
            <b>
              {searchResults.length} post{searchResults.length !== 1 ? "s" : ""}{" "}
              match
            </b>
          </p>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className={styles.row}>
        <div className={styles.column}>Search Blog Posts and Pages</div>
        <div className={cn(styles.column, styles.hints)}>
          <span className={styles.tag}>Tab</span>/
          <span className={styles.tag}>S</span>
          to search,
          <span className={styles.tag}>Esc</span>
          to close
        </div>
      </div>
      <div className={styles.row}>
        <div className={cn(styles.column, styles.wide)}>
          <input
            id="search-input"
            className={styles.searchInput}
            type="search"
            placeholder="Type search term here ..."
            autoComplete="off"
            autoFocus
            spellCheck="false"
            value={searchTerm}
            onChange={onSearchTermChanged}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
      {result}
    </React.Fragment>
  );
};
