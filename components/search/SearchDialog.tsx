import React, { ChangeEvent, FC, KeyboardEvent, useState } from "react";
import cn from "classnames";
import { useRouter } from "next/router";
import Link from "next/link";
import { SearchChildProps } from "./SearchProvider";
import styles from "./SearchDialog.module.scss";
import { SearchOccurrence, SearchPost } from "./SearchData";

interface SearchResult {
  relevance: number;
  current: boolean;
  post: SearchPost;
  index: number;
}

export const SearchDialog: FC<SearchChildProps> = (props) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [highlight, setHighlight] = useState<string>("");
  const [active, setActive] = useState<number>(-1);
  const query = `?highlight=${highlight}`;

  const completeSearch = (term: string) => {
    if (!props.searchData) {
      return;
    }

    const searchData = props.searchData;

    // Sanitise the search input: we only care about letters really.
    let term_words = term
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/);

    // If we have no search term, then there are no results
    if (term_words.length < 1 || (term_words.length === 1 && term_words[0].length < 1)) {
      setSearchResults([]);
      setHighlight("");
      return;
    }

    // We highlight the user's input, not the search term
    setHighlight(encodeURIComponent(term));

    // For each of the search terms, perform a search, recording the occurrences in our list
    var occurrences: SearchOccurrence[] = [];
    term_words.forEach((word) => {
      searchData.trie.findString(word).forEach((occurrence) => occurrences.push(occurrence));
    });

    // Gather up all the results (as posts), counting their relevance
    let post_results: { [key: string]: SearchResult } = {};
    occurrences.forEach((occ) => {
      if (occ.post in post_results) {
        post_results[occ.post].relevance += occ.count;
      } else {
        const post = searchData.posts[occ.post];
        post_results[occ.post] = {
          current: post.url === router.pathname,
          relevance: occ.count,
          post: post,
          index: 0,
        };
      }
    });

    // Sort the search results by their relevance (number of occurrences)
    const sorted = Object.keys(post_results)
      .map((key) => post_results[key])
      .sort((a, b) => b.relevance - a.relevance);

    // Filter out the match for the current page, if any
    const current = sorted.find((result) => result.current);
    const remaining = current ? sorted.filter((result) => !result.current) : sorted;

    // Assign the index to all the results
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

    // Store the results and reset the current selection
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
        router.push(searchResults[active].post.url + query);
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
    const SearchLink: FC<{ post: SearchPost; relevance: number; index: number }> = ({
      post,
      relevance,
      index,
    }) => {
      return (
        <Link href={post.url + query}>
          <a
            className={cn(styles.row, styles.searchResult, {
              [styles.active]: index === active,
            })}
            onClick={() => {
              props.setSearchVisible(false);
            }}>
            <div className={styles.column}>{post.title}</div>
            <div className={cn(styles.column, styles.relevance)}>
              {relevance.toString()} match{relevance !== 1 ? "es" : ""}
            </div>
          </a>
        </Link>
      );
    };

    const search_links = searchResults.map((result, index) => {
      const link = (
        <SearchLink
          key={index.toString()}
          post={result.post}
          relevance={result.relevance}
          index={result.index}
        />
      );

      if (result.current) {
        return (
          <div
            key={index.toString()}
            className={cn(styles.currentPage, { [styles.others]: searchResults.length > 1 })}>
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
              {searchResults.length} post{searchResults.length !== 1 ? "s" : ""} match
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
          <span className={styles.tag}>Tab</span>/<span className={styles.tag}>S</span>
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
