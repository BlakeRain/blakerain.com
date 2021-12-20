import React, { FC, useState } from "react";
import { GetStaticProps } from "next";
import Head from "next/head";
import cn from "classnames";
import { getISOWeek } from "date-fns";

import { Layout } from "../components/Layout";
import { getSiteSettings, SiteNavigation } from "../lib/ghost";

import {
  authenticate,
  getSessionToken,
  setSessionToken,
} from "../lib/analytics";

import styles from "./analytics.module.scss";

const SignIn: FC<{ setToken: (token: string) => void }> = ({ setToken }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = username.length > 1 && password.length > 1;

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setError(null);
    setProcessing(true);
    authenticate(username, password)
      .then((token) => setToken(token))
      .catch((err) => {
        console.log("Sign in API error", err, typeof err);
        setProcessing(false);
        setError(err);
      });
  };

  const handleUsernameChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setPassword(event.target.value);
  };

  return (
    <div className={styles.signInFormContainer}>
      <form
        className={styles.signInForm}
        noValidate
        autoComplete="off"
        onSubmit={handleFormSubmit}
      >
        <div className={styles.field}>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            disabled={processing}
            value={username}
            onChange={handleUsernameChange}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            disabled={processing}
            value={password}
            onChange={handlePasswordChange}
          />
        </div>
        <div className={styles.error}>{error || " "}</div>
        <button type="submit" disabled={!canSubmit || processing}>
          Sign In
        </button>
      </form>
    </div>
  );
};

const WeeklyReport: FC<{ token: string }> = ({ token }) => {
  return <b>Weekly report: {token}</b>;
};

const MontlyReport: FC<{ token: string }> = ({ token }) => {
  return <b>Monthly report: {token}</b>;
};

const Report: FC<{ token: string }> = ({ token }) => {
  const now = new Date();
  const [mode, setMode] = useState<"month" | "week">("week");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [week, setWeek] = useState(getISOWeek(now));

  const onPrevDateClick: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    switch (mode) {
      case "week":
        if (week === 1) {
          setYear(year - 1);
          setWeek(52);
        } else {
          setWeek(week - 1);
        }
        break;
      case "month":
        if (month == 0) {
          setYear(year - 1);
          setMonth(11);
        } else {
          setMonth(month - 1);
        }
        break;
    }
  };

  const onNextDateClick: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    switch (mode) {
      case "week":
        if (week === 52) {
          setYear(year + 1);
          setWeek(1);
        } else {
          setWeek(1 + week);
        }
        break;
      case "month":
        if (month == 11) {
          setYear(year + 1);
          setMonth(0);
        } else {
          setMonth(1 + month);
        }
        break;
    }
  };

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
        <div className={styles.right}>
          <div className={styles.reportDate}>
            {year.toString()}/
            {mode === "week"
              ? "W" + week.toString()
              : (month < 9 ? "0" : "") + (1 + month).toString()}
          </div>
          <button
            type="button"
            className={styles.reportNavButton}
            title={"Previous " + mode}
            onClick={onPrevDateClick}
          >
            &larr;
          </button>
          <button
            type="button"
            className={styles.reportNavButton}
            title={"Next " + mode}
            onClick={onNextDateClick}
          >
            &rarr;
          </button>
        </div>
      </div>
      <div className={styles.reportContents}></div>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
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
