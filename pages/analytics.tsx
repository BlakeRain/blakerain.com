import React, { FC, useState } from "react";
import { GetStaticProps } from "next";
import Head from "next/head";
import cn from "classnames";

import { Layout } from "../components/Layout";
import { getSiteSettings, SiteNavigation } from "../lib/ghost";

import { getSessionToken, setSessionToken } from "../lib/analytics";

import styles from "../components/analytics/Report.module.scss";
import WeeklyReport from "../components/analytics/WeeklyReport";
import MonthlyReport from "../components/analytics/MonthlyReport";
import SignIn from "../components/analytics/SignIn";

const Report: FC<{ token: string }> = ({ token }) => {
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
        <WeeklyReport token={token} />
      ) : (
        <MonthlyReport token={token} />
      )}
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const settings = await getSiteSettings();

  return {
    props: {
      navigation: settings.navigation,
    },
  };
};

const Analytics: FC<{ navigation: SiteNavigation[] }> = ({ navigation }) => {
  const [token, setToken] = useState<string | null>(getSessionToken());

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <Layout navigation={navigation}>
      <Head>
        <title>Site Analytics</title>
      </Head>
      {token ? (
        <Report token={token}>Okay</Report>
      ) : (
        <SignIn
          setToken={(token) => {
            setToken(token);
            setSessionToken(token);
          }}
        />
      )}
    </Layout>
  );
};

export default Analytics;
