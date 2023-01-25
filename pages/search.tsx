import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import React, {
  FC,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import Analytics from "../components/Analytics";
import ClientOnly from "../components/display/ClientOnly";
import { Layout } from "../components/Layout";
import Image from "../components/display/Image";
import { DateSpan } from "../components/display/DateSpan";

import { SiteNavigation, loadNavigation } from "../lib/navigation";
import Load from "../lib/search/encoding/load";
import PreparedIndex, { SearchPositions } from "../lib/search/index/prepared";

import styles from "./search.module.scss";
import IndexDoc from "../lib/search/document/document";

interface PageProps {
  navigation: SiteNavigation[];
}

export const getStaticProps: GetStaticProps = async () => {
  // Await the import to avoid including the index building in the main site
  const { generateIndices } = await import("../lib/indices");

  // This will generate the search indices over the contents of the site, storing the index in `/data/search.bin`.
  await generateIndices();

  return {
    props: {
      navigation: await loadNavigation(),
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
  url: string;
  positions: SearchPositions[];
  total: number;
}

function search(index: PreparedIndex, term: string): SearchResult[] {
  const results: SearchResult[] = [];
  for (const [doc_id, positions] of index.search(term)) {
    const doc = index.documents.get(doc_id)!;
    const encoded_positions = encodePositions(positions);
    const url = `${doc.url}?s=${encoded_positions}`;

    results.push({
      doc,
      url,
      positions,
      total: positions.reduce((acc, pos) => acc + pos.positions.length, 0),
    });
  }

  return results.sort((a, b) => b.total - a.total);
}

const SearchResultImage: FC<{ result: SearchResult }> = ({ result }) => {
  return (
    <Link className={styles.resultImage} href={result.url}>
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
          sizes="(max-width: 1200px) 100vw, 33vw"
        />
      )}
    </Link>
  );
};

const SearchResultDetails: FC<{ result: SearchResult }> = ({ result }) => {
  return (
    <div className={styles.resultDetails}>
      <Link href={result.url}>
        <header>{result.doc.title}</header>
        <section>{result.doc.excerpt}</section>
      </Link>
      <div className={styles.resultStats}>
        <span className={styles.matches}>
          Found {result.total.toString()} match
          {result.total === 1 ? "" : "es"}
        </span>
        {result.doc.page || result.doc.published === null ? null : (
          <DateSpan date={result.doc.published} />
        )}
      </div>
    </div>
  );
};

const SearchResult: FC<{
  result: SearchResult;
}> = ({ result }) => {
  return (
    <article className={styles.result}>
      <SearchResultImage result={result} />
      <SearchResultDetails result={result} />
    </article>
  );
};

const SearchResults: FC<{ index: PreparedIndex; term: string }> = ({
  index,
  term,
}) => {
  const results = useMemo(
    () => (term.length > 2 ? search(index, term) : []),
    [term]
  );

  const [total_pages, total_matches] = results.reduce(
    ([p, m], result) => [p + 1, m + result.total],
    [0, 0]
  );

  if (results.length === 0) {
    return <div className={styles.message}>No Results</div>;
  } else {
    return (
      <div className={styles.results}>
        <div className={styles.stats}>
          Found {Intl.NumberFormat().format(total_matches)} match
          {total_matches === 1 ? "" : "es"} over{" "}
          {Intl.NumberFormat().format(total_pages)} page
          {total_pages === 1 ? "" : "s"}
        </div>
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
function encodePositions(positions: SearchPositions[]) {
  throw new Error("Function not implemented.");
}
