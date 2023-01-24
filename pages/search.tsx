import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import React, { FC, useContext, useEffect, useReducer, useState } from "react";
import Analytics from "../components/Analytics";
import ClientOnly from "../components/display/ClientOnly";
import { Layout } from "../components/Layout";
import Image from "../components/display/Image";
import { DateSpan } from "../components/display/DateSpan";

import { SiteNavigation, loadNavigation } from "../lib/navigation";
import Load from "../lib/new_search/encoding/load";
import PreparedIndex, {
  SearchPositions,
} from "../lib/new_search/index/prepared";

import styles from "./search.module.scss";
import IndexDoc from "../lib/new_search/document/document";

interface PageProps {
  navigation: SiteNavigation[];
}

export const getStaticProps: GetStaticProps = async () => {
  const { generateIndices } = await import("../lib/indices");

  await generateIndices();
  const navigation = await loadNavigation();

  return {
    props: {
      navigation,
    },
  };
};

// --------------------------------------------------------------------------------------------------------------------

interface SearchState {
  term: string;
}

const DEFAULT_SEARCH_STATE = { term: "" };

type SearchAction = { action: "setTerm"; term: string };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.action) {
    case "setTerm":
      return { ...state, term: action.term };
  }
}

interface SearchStateContextProps {
  state: SearchState;
  dispatch: React.Dispatch<SearchAction>;
}

const SearchStateContext = React.createContext<
  SearchStateContextProps | undefined
>(undefined);

export const SearchStateProvider: FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(searchReducer, DEFAULT_SEARCH_STATE);

  return (
    <SearchStateContext.Provider value={{ state, dispatch }}>
      {children}
    </SearchStateContext.Provider>
  );
};

function useSearchState(): SearchStateContextProps {
  const context = useContext(SearchStateContext);
  if (!context) {
    throw new Error(
      "useSearchState must be used within a <SearchStateProvider>"
    );
  }

  return context;
}

// --------------------------------------------------------------------------------------------------------------------

const SearchIndexContext = React.createContext<PreparedIndex | null>(null);

const SearchIndexProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const [index, setIndex] = useState<PreparedIndex | null>(null);

  useEffect(() => {
    const abort = new AbortController();

    void (async function () {
      try {
        const res = await fetch("/data/search.bin", { signal: abort.signal });
        setIndex(PreparedIndex.load(new Load(await res.arrayBuffer())));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        console.error(err);
      }
    })();

    return () => {
      abort.abort();
    };
  }, []);

  return (
    <SearchIndexContext.Provider value={index}>
      {children}
    </SearchIndexContext.Provider>
  );
};

function useSearchIndex(): PreparedIndex | null {
  return useContext(SearchIndexContext);
}

// --------------------------------------------------------------------------------------------------------------------

const SearchField: FC = () => {
  const { state, dispatch } = useSearchState();

  const onTermChanged: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    dispatch({ action: "setTerm", term: event.target.value });
  };

  return (
    <div className={styles.input}>
      <input
        type="text"
        placeholder="Search website"
        value={state.term}
        onChange={onTermChanged}
      />
    </div>
  );
};

// --------------------------------------------------------------------------------------------------------------------

interface SearchResult {
  doc: IndexDoc;
  positions: SearchPositions[];
  total: number;
}

function search(index: PreparedIndex, term: string): SearchResult[] {
  const results: SearchResult[] = [];
  for (const [doc_id, positions] of index.search(term)) {
    const doc = index.documents.get(doc_id)!;

    results.push({
      doc,
      positions,
      total: positions.reduce((acc, pos) => acc + pos.positions.length, 0),
    });
  }

  return results.sort((a, b) => b.total - a.total);
}

const SearchResult: FC<{
  result: SearchResult;
}> = ({ result }) => {
  const encodedPositions = PreparedIndex.encodePositions(result.positions);
  const url = `${result.doc.url}?s=${encodedPositions}`;

  return (
    <article className={styles.result}>
      <Link className={styles.resultImage} href={url}>
        {result.doc.page || result.doc.cover === null ? (
          <div className={styles.noImage}>
            <span>No Image</span>
          </div>
        ) : (
          <Image
            src={result.doc.cover || ""}
            alt={result.doc.title}
            fill
            priority={true}
          />
        )}
      </Link>
      <div className={styles.resultDetails}>
        <Link href={url}>
          <header>
            {result.doc.title} {encodedPositions.length.toString()}
          </header>
          <section>{result.doc.excerpt}</section>
        </Link>
        <div className={styles.resultStats}>
          {result.doc.page ? null : (
            <DateSpan
              date={result.doc.published || "1970-01-01T00:00:00.000Z"}
            />
          )}
          <span>
            Found {result.total.toString()} match
            {result.total === 1 ? "" : "es"}
          </span>
        </div>
      </div>
    </article>
  );
};

const SearchResults: FC<{ index: PreparedIndex; term: string }> = ({
  index,
  term,
}) => {
  const results = term.length > 2 ? search(index, term) : [];

  if (results.length === 0) {
    return (
      <div className={styles.results}>
        <div className={styles.stats}>No results found</div>
      </div>
    );
  } else {
    return (
      <div className={styles.results}>
        {results.map((result, index) => (
          <SearchResult key={index.toString()} result={result} />
        ))}
      </div>
    );
  }
};

const SearchResultWrapper: FC = () => {
  const index = useSearchIndex();
  const { state } = useSearchState();

  if (index === null) {
    return <div className={styles.message}>Loading Search Index</div>;
  }

  return <SearchResults index={index} term={state.term} />;
};

const Search = () => {
  return (
    <div className={styles.searchBox}>
      <SearchField />
      <ClientOnly>
        <SearchIndexProvider>
          <SearchResultWrapper />
        </SearchIndexProvider>
      </ClientOnly>
    </div>
  );
};

const SearchPage: NextPage<PageProps> = ({ navigation }) => {
  return (
    <Layout navigation={navigation} wrap>
      <Head>
        <title>Search Website</title>
      </Head>
      <h1 style={{ textAlign: "center" }}>Search Website</h1>
      <SearchStateProvider>
        <Search />
      </SearchStateProvider>
      <Analytics />
    </Layout>
  );
};

export default SearchPage;
