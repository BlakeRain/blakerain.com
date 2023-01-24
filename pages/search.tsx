import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Analytics from "../components/Analytics";
import ClientOnly from "../components/display/ClientOnly";
import { Layout } from "../components/Layout";

import { SiteNavigation, loadNavigation } from "../lib/navigation";
import Load from "../lib/new_search/encoding/load";
import PreparedIndex, {
  SearchPositions,
} from "../lib/new_search/index/prepared";

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

const Search = () => {
  const [term, setTerm] = useState("");
  const [index, setIndex] = useState<PreparedIndex | null>(null);
  const [results, setResults] = useState<Map<number, SearchPositions[]>>(
    new Map()
  );

  useEffect(() => {
    const abort = new AbortController();
    void (async function () {
      try {
        const res = await fetch("/data/search.bin", {
          signal: abort.signal,
        });

        const index = PreparedIndex.load(new Load(await res.arrayBuffer()));
        setIndex(index);
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

  const onTermChanged: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setTerm(event.target.value);
    if (index && event.target.value.length >= 2) {
      setResults(index.search(event.target.value));
    } else {
      setResults(new Map());
    }
  };

  return (
    <>
      <input type="text" value={term} onChange={onTermChanged} />
      {results.size === 0 && <div>No results</div>}
      {index !== null
        ? [...results]
            .sort((a, b) => b[1].length - a[1].length)
            .map(([document_id, positions], recordIndex) => {
              const doc = index.documents.get(document_id)!;
              const enc = PreparedIndex.encodePositions(positions);

              return (
                <div key={recordIndex.toString()}>
                  <Link href={doc.url + "?s=" + enc}>{doc.title}</Link> (
                  {positions.length.toString()} results)
                </div>
              );
            })
        : null}
    </>
  );
};

const SearchPage: NextPage<PageProps> = ({ navigation }) => {
  return (
    <Layout navigation={navigation} wrap>
      <Head>
        <title>Search</title>
      </Head>
      <h1>Search</h1>
      <ClientOnly>
        <Search />
      </ClientOnly>
      <Analytics />
    </Layout>
  );
};

export default SearchPage;
