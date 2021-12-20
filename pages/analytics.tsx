import React, { FC, useEffect, useState } from "react";
import { GetStaticProps } from "next";
import Head from "next/head";
import cn from "classnames";
import { format, getISOWeek } from "date-fns";

import { Layout } from "../components/Layout";
import LineChart, { ChartData } from "../components/analytics/LineChart";
import { getSiteSettings, SiteNavigation } from "../lib/ghost";

import {
  authenticate,
  getSessionToken,
  setSessionToken,
  getWeekViews,
  getMonthViews,
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

const now = new Date();
const WEEK_LABELS: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const WeeklyReport: FC<{ token: string }> = ({ token }) => {
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(getISOWeek(now));
  const [data, setData] = useState<ChartData[] | null>(null);
  const [highlight, setHighlight] = useState<ChartData | null>(null);

  useEffect(() => {
    getWeekViews(token, year, week).then((result) => {
      setData(
        result.map((item) => ({
          label: WEEK_LABELS[item.day],
          x: item.day,
          y: item.count,
        }))
      );
    });
  }, [year, week]);

  const handlePrevClick = () => {
    if (week === 1) {
      setYear(year - 1);
      setWeek(52);
    } else {
      setWeek(week - 1);
    }
  };

  const handleNextClick = () => {
    if (week === 52) {
      setYear(year + 1);
      setWeek(1);
    } else {
      setWeek(week + 1);
    }
  };

  return (
    <div className={styles.reportContents}>
      <div className={styles.reportControls}>
        <span>
          <b>Date:</b> {year.toString()} W{week.toString()}
        </span>
        <button type="button" onClick={handlePrevClick}>
          &larr;
        </button>
        <button type="button" onClick={handleNextClick}>
          &rarr;
        </button>
        {highlight ? (
          <span>
            <b>{WEEK_LABELS[highlight.x]}:</b>{" "}
            {highlight.y ? highlight.y.toString() : "no"} visitors
          </span>
        ) : null}
      </div>
      {data ? (
        <div>
          <LineChart
            data={data}
            width={300}
            height={200}
            gridX={6}
            gridY={5}
            onMouseOver={(_, data) => setHighlight(data)}
            onMouseOut={() => setHighlight(null)}
          />
        </div>
      ) : (
        <svg viewBox="0 0 300 200">
          <rect
            x={0}
            y={0}
            width="100%"
            height="100%"
            stroke="none"
            fill="#303030"
          />
        </svg>
      )}
    </div>
  );
};

const MonthlyReport: FC<{ token: string }> = ({ token }) => {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [data, setData] = useState<ChartData[] | null>(null);
  const [highlight, setHighlight] = useState<ChartData | null>(null);

  useEffect(() => {
    getMonthViews(token, year, month).then((result) => {
      setData(
        result.map((item) => ({
          label: item.day.toString(),
          x: item.day,
          y: item.count,
        }))
      );
    });
  }, [year, month]);

  const handlePrevClick = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextClick = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className={styles.reportContents}>
      <div className={styles.reportControls}>
        <span>
          <b>Date:</b> {format(new Date(year, month), "MM/yyyy")}
        </span>
        <button type="button" onClick={handlePrevClick}>
          &larr;
        </button>
        <button type="button" onClick={handleNextClick}>
          &rarr;
        </button>
        {highlight ? (
          <span>
            <b>{format(new Date(year, month, highlight.x), "dd/MM/yyyy")}:</b>{" "}
            {highlight.y ? highlight.y.toString() : "no"} visitors
          </span>
        ) : null}
      </div>
      {data ? (
        <div>
          <LineChart
            data={data}
            width={300}
            height={200}
            gridY={5}
            gridX={15}
            onMouseOver={(_, data) => setHighlight(data)}
            onMouseOut={() => setHighlight(null)}
          />
        </div>
      ) : (
        <svg viewBox="0 0 300 200">
          <rect
            x={0}
            y={0}
            width="100%"
            height="100%"
            stroke="none"
            fill="#303030"
          />
        </svg>
      )}
    </div>
  );
};

const Report: FC<{ token: string }> = ({ token }) => {
  const now = new Date();
  const [mode, setMode] = useState<"month" | "week">("week");

  // const onPrevDateClick: React.MouseEventHandler<HTMLButtonElement> = (
  //   event
  // ) => {
  //   switch (mode) {
  //     case "week":
  //       if (week === 1) {
  //         setYear(year - 1);
  //         setWeek(52);
  //       } else {
  //         setWeek(week - 1);
  //       }
  //       break;
  //     case "month":
  //       if (month == 0) {
  //         setYear(year - 1);
  //         setMonth(11);
  //       } else {
  //         setMonth(month - 1);
  //       }
  //       break;
  //   }
  // };
  //
  // const onNextDateClick: React.MouseEventHandler<HTMLButtonElement> = (
  //   event
  // ) => {
  //   switch (mode) {
  //     case "week":
  //       if (week === 52) {
  //         setYear(year + 1);
  //         setWeek(1);
  //       } else {
  //         setWeek(1 + week);
  //       }
  //       break;
  //     case "month":
  //       if (month == 11) {
  //         setYear(year + 1);
  //         setMonth(0);
  //       } else {
  //         setMonth(1 + month);
  //       }
  //       break;
  //   }

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
        {/* <div className={styles.right}>
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
        </div> */}
      </div>
      {mode === "week" ? (
        <WeeklyReport token={token} />
      ) : (
        <MonthlyReport token={token} />
      )}
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
