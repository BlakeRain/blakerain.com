import React, { FC, useState } from "react";
import { GetStaticProps } from "next";
import Head from "next/head";
import { NextSeo } from "next-seo";
import cn from "classnames";

import ClientOnly from "../components/display/ClientOnly";
import { Layout } from "../components/Layout";
import { loadNavigation, SiteNavigation } from "../lib/navigation";
import { getSessionToken, setSessionToken } from "../lib/analytics";

import styles from "../components/analytics/Report.module.scss";
import WeeklyReport from "../components/analytics/WeeklyReport";
import MonthlyReport from "../components/analytics/MonthlyReport";
import SignIn from "../components/analytics/SignIn";
import { loadPageSlugs, loadPostSlugs } from "../lib/content";

const Report: FC<{ paths: string[]; token: string }> = ({ paths, token }) => {
  const [mode, setMode] = useState<"month" | "week">("month");

  return (
    <div className={styles.reportContainer}>
      <div className={styles.reportToolbar}>
        <div className={styles.left}>
          <button
            type="button"
            className={cn(styles.reportTabButton, {
              [styles.activeTabButton]: mode === "month",
            })}
            onClick={() => setMode("month")}
          >
            Month
          </button>
          <button
            type="button"
            className={cn(styles.reportTabButton, {
              [styles.activeTabButton]: mode === "week",
            })}
            onClick={() => setMode("week")}
          >
            Week
          </button>
        </div>
      </div>
      {mode === "week" ? (
        <WeeklyReport paths={paths} token={token} />
      ) : (
        <MonthlyReport paths={paths} token={token} />
      )}
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const navigation = await loadNavigation();
  const page_slugs = await loadPageSlugs();
  const post_slugs = await loadPostSlugs();

  const paths = ["site", "/", "/blog", "/tags"];

  for (let slug of page_slugs) {
    paths.push(`/${slug}`);
  }

  for (let slug of post_slugs) {
    paths.push(`/blog/${slug}`);
  }

  return {
    props: {
      paths,
      navigation,
    },
  };
};

const Analytics: FC<{ navigation: SiteNavigation[]; paths: string[] }> = ({
  navigation,
  paths,
}) => {
  const [token, setToken] = useState<string | null>(getSessionToken());

  return (
    <Layout navigation={navigation} wrap>
      <Head>
        <title>Site Analytics</title>
      </Head>
      <NextSeo noindex nofollow />
      <ClientOnly>
        {token ? (
          <Report paths={paths} token={token}>
            Okay
          </Report>
        ) : (
          <SignIn
            setToken={(token) => {
              setToken(token);
              setSessionToken(token);
            }}
          />
        )}
      </ClientOnly>
    </Layout>
  );
};

export default Analytics;
