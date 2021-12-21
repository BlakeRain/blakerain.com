import React, { FC, useEffect, useState } from "react";
import { GetStaticProps } from "next";
import Head from "next/head";
import cn from "classnames";
import { format, getISOWeek } from "date-fns";

import { Layout } from "../components/Layout";
import LineChart, {
  ChartPoint,
  ChartData,
} from "../components/analytics/LineChart";
import { getSiteSettings, SiteNavigation } from "../lib/ghost";

import {
  authenticate,
  getSessionToken,
  setSessionToken,
  getWeekViews,
  getMonthViews,
  getBrowsersWeek,
  getBrowsersMonth,
  BrowserData,
} from "../lib/analytics";

import styles from "./analytics.module.scss";

const BROWSER_COLORS = [
  "#0584A5",
  "#F6C75E",
  "#6D4E7C",
  "#9CD866",
  "#C9472F",
  "#FFA055",
  "#8DDDD0",
];

const BrowserIcon: FC<{ name: string }> = ({ name }) => {
  if (name.includes("Chrome")) {
    return (
      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Google Chrome</title>
        <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z" />
      </svg>
    );
  } else if (name.includes("Safari")) {
    return (
      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Safari</title>
        <path d="M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12zm0-.75c6.213 0 11.25-5.037 11.25-11.25S18.213.75 12 .75.75 5.787.75 12 5.787 23.25 12 23.25zM12 2a.25.25 0 0 1 .25.25v1a.25.25 0 1 1-.5 0v-1A.25.25 0 0 1 12 2zm0 18.5a.25.25 0 0 1 .25.25v1a.25.25 0 1 1-.5 0v-1a.25.25 0 0 1 .25-.25zm7.071-15.571a.25.25 0 0 1 0 .353l-.707.708a.25.25 0 0 1-.354-.354l.708-.707a.25.25 0 0 1 .353 0zM5.99 18.01a.25.25 0 0 1 0 .354l-.708.707a.25.25 0 1 1-.353-.353l.707-.708a.25.25 0 0 1 .354 0zM4.929 4.93a.25.25 0 0 1 .353 0l.708.707a.25.25 0 0 1-.354.354l-.707-.708a.25.25 0 0 1 0-.353zM18.01 18.01a.25.25 0 0 1 .354 0l.707.708a.25.25 0 1 1-.353.353l-.708-.707a.25.25 0 0 1 0-.354zM2 12a.25.25 0 0 1 .25-.25h1a.25.25 0 1 1 0 .5h-1A.25.25 0 0 1 2 12zm18.5 0a.25.25 0 0 1 .25-.25h1a.25.25 0 1 1 0 .5h-1a.25.25 0 0 1-.25-.25zm-4.593-9.205a.25.25 0 0 1 .133.328l-.391.92a.25.25 0 1 1-.46-.195l.39-.92a.25.25 0 0 1 .328-.133zM8.68 19.825a.25.25 0 0 1 .132.327l-.39.92a.25.25 0 0 1-.46-.195l.39-.92a.25.25 0 0 1 .328-.133zM21.272 8.253a.25.25 0 0 1-.138.325l-.927.375a.25.25 0 1 1-.188-.464l.927-.374a.25.25 0 0 1 .326.138zm-17.153 6.93a.25.25 0 0 1-.138.326l-.927.374a.25.25 0 1 1-.188-.463l.927-.375a.25.25 0 0 1 .326.138zM8.254 2.728a.25.25 0 0 1 .325.138l.375.927a.25.25 0 0 1-.464.188l-.374-.927a.25.25 0 0 1 .138-.326zm6.93 17.153a.25.25 0 0 1 .326.138l.374.927a.25.25 0 1 1-.463.188l-.375-.927a.25.25 0 0 1 .138-.326zM2.795 8.093a.25.25 0 0 1 .328-.133l.92.391a.25.25 0 0 1-.195.46l-.92-.39a.25.25 0 0 1-.133-.328zm17.03 7.228a.25.25 0 0 1 .327-.132l.92.39a.25.25 0 1 1-.195.46l-.92-.39a.25.25 0 0 1-.133-.328zM12.879 12.879L11.12 11.12l-4.141 5.9 5.899-4.142zm6.192-7.95l-5.834 8.308-8.308 5.834 5.834-8.308 8.308-5.834z" />
      </svg>
    );
  } else if (name.includes("Firefox")) {
    return (
      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Firefox Browser</title>
        <path d="M8.824 7.287c.008 0 .004 0 0 0zm-2.8-1.4c.006 0 .003 0 0 0zm16.754 2.161c-.505-1.215-1.53-2.528-2.333-2.943.654 1.283 1.033 2.57 1.177 3.53l.002.02c-1.314-3.278-3.544-4.6-5.366-7.477-.091-.147-.184-.292-.273-.446a3.545 3.545 0 01-.13-.24 2.118 2.118 0 01-.172-.46.03.03 0 00-.027-.03.038.038 0 00-.021 0l-.006.001a.037.037 0 00-.01.005L15.624 0c-2.585 1.515-3.657 4.168-3.932 5.856a6.197 6.197 0 00-2.305.587.297.297 0 00-.147.37c.057.162.24.24.396.17a5.622 5.622 0 012.008-.523l.067-.005a5.847 5.847 0 011.957.222l.095.03a5.816 5.816 0 01.616.228c.08.036.16.073.238.112l.107.055a5.835 5.835 0 01.368.211 5.953 5.953 0 012.034 2.104c-.62-.437-1.733-.868-2.803-.681 4.183 2.09 3.06 9.292-2.737 9.02a5.164 5.164 0 01-1.513-.292 4.42 4.42 0 01-.538-.232c-1.42-.735-2.593-2.121-2.74-3.806 0 0 .537-2 3.845-2 .357 0 1.38-.998 1.398-1.287-.005-.095-2.029-.9-2.817-1.677-.422-.416-.622-.616-.8-.767a3.47 3.47 0 00-.301-.227 5.388 5.388 0 01-.032-2.842c-1.195.544-2.124 1.403-2.8 2.163h-.006c-.46-.584-.428-2.51-.402-2.913-.006-.025-.343.176-.389.206-.406.29-.787.616-1.136.974-.397.403-.76.839-1.085 1.303a9.816 9.816 0 00-1.562 3.52c-.003.013-.11.487-.19 1.073-.013.09-.026.181-.037.272a7.8 7.8 0 00-.069.667l-.002.034-.023.387-.001.06C.386 18.795 5.593 24 12.016 24c5.752 0 10.527-4.176 11.463-9.661.02-.149.035-.298.052-.448.232-1.994-.025-4.09-.753-5.844z" />
      </svg>
    );
  } else if (name.includes("Edge")) {
    return (
      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Microsoft Edge</title>
        <path d="M21.86 17.86q.14 0 .25.12.1.13.1.25t-.11.33l-.32.46-.43.53-.44.5q-.21.25-.38.42l-.22.23q-.58.53-1.34 1.04-.76.51-1.6.91-.86.4-1.74.64t-1.67.24q-.9 0-1.69-.28-.8-.28-1.48-.78-.68-.5-1.22-1.17-.53-.66-.92-1.44-.38-.77-.58-1.6-.2-.83-.2-1.67 0-1 .32-1.96.33-.97.87-1.8.14.95.55 1.77.41.82 1.02 1.5.6.68 1.38 1.21.78.54 1.64.9.86.36 1.77.56.92.2 1.8.2 1.12 0 2.18-.24 1.06-.23 2.06-.72l.2-.1.2-.05zm-15.5-1.27q0 1.1.27 2.15.27 1.06.78 2.03.51.96 1.24 1.77.74.82 1.66 1.4-1.47-.2-2.8-.74-1.33-.55-2.48-1.37-1.15-.83-2.08-1.9-.92-1.07-1.58-2.33T.36 14.94Q0 13.54 0 12.06q0-.81.32-1.49.31-.68.83-1.23.53-.55 1.2-.96.66-.4 1.35-.66.74-.27 1.5-.39.78-.12 1.55-.12.7 0 1.42.1.72.12 1.4.35.68.23 1.32.57.63.35 1.16.83-.35 0-.7.07-.33.07-.65.23v-.02q-.63.28-1.2.74-.57.46-1.05 1.04-.48.58-.87 1.26-.38.67-.65 1.39-.27.71-.42 1.44-.15.72-.15 1.38zM11.96.06q1.7 0 3.33.39 1.63.38 3.07 1.15 1.43.77 2.62 1.93 1.18 1.16 1.98 2.7.49.94.76 1.96.28 1 .28 2.08 0 .89-.23 1.7-.24.8-.69 1.48-.45.68-1.1 1.22-.64.53-1.45.88-.54.24-1.11.36-.58.13-1.16.13-.42 0-.97-.03-.54-.03-1.1-.12-.55-.1-1.05-.28-.5-.19-.84-.5-.12-.09-.23-.24-.1-.16-.1-.33 0-.15.16-.35.16-.2.35-.5.2-.28.36-.68.16-.4.16-.95 0-1.06-.4-1.96-.4-.91-1.06-1.64-.66-.74-1.52-1.28-.86-.55-1.79-.89-.84-.3-1.72-.44-.87-.14-1.76-.14-1.55 0-3.06.45T.94 7.55q.71-1.74 1.81-3.13 1.1-1.38 2.52-2.35Q6.68 1.1 8.37.58q1.7-.52 3.58-.52Z" />
      </svg>
    );
  } else {
    return null;
  }
};

interface BrowserChartData extends ChartData {
  name: string;
  total: number;
}

const BrowserReport: FC<{
  browserData: BrowserData;
  labelMapper: (day: number) => string;
}> = ({ browserData, labelMapper }) => {
  const [highlight, setHighlight] = useState<string | null>(null);

  const browsers: BrowserChartData[] = Object.keys(browserData)
    .map((browser) => ({
      name: browser.replaceAll("-", " "),
      total: browserData[browser].reduce(
        (total, item) => total + (item.count || 0),
        0
      ),
      color: "",
      points: browserData[browser].map((item) => ({
        label: labelMapper(item.day),
        x: item.day,
        y: item.count,
      })),
    }))
    .sort((a, b) => b.total - a.total)
    .map((obj, index) => {
      obj.color = BROWSER_COLORS[index % BROWSER_COLORS.length];
      return obj;
    });

  return (
    <React.Fragment>
      <div>
        <LineChart
          data={browsers}
          width={300}
          height={200}
          gridX={6}
          gridY={5}
          highlight={
            highlight
              ? browsers.findIndex((b) => b.name === highlight)
              : undefined
          }
          onMouseOver={(_event, data, _point) =>
            setHighlight((data as BrowserChartData).name)
          }
          onMouseOut={() => setHighlight(null)}
        />
      </div>
      <div className={styles.browserPalette}>
        {browsers.map((browser, index) => (
          <div
            className={
              highlight === null || highlight === browser.name
                ? ""
                : styles.inactive
            }
            key={index.toString()}
            style={{ backgroundColor: browser.color }}
            onMouseOver={() => setHighlight(browser.name)}
            onMouseOut={() => setHighlight(null)}
          >
            <div>
              <BrowserIcon name={browser.name} />
              {browser.name}
            </div>
            <b>{browser.total}</b>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
};

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
  const [data, setData] = useState<ChartPoint[] | null>(null);
  const [browsers, setBrowsers] = useState<BrowserData | null>(null);
  const [highlight, setHighlight] = useState<ChartPoint | null>(null);

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

    getBrowsersWeek(token, year, week).then((result) => {
      setBrowsers(result.browsers);
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
        {data && (
          <span>
            <b>Total:</b>{" "}
            {data
              .reduce((total, datum) => total + (datum.y || 0), 0)
              .toString()}
          </span>
        )}
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
            data={[{ color: "#0074d9", points: data }]}
            width={300}
            height={200}
            gridX={6}
            gridY={5}
            onMouseOver={(_event, _data, point) => setHighlight(point)}
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

      {browsers && (
        <BrowserReport
          browserData={browsers}
          labelMapper={(day) => WEEK_LABELS[day]}
        />
      )}
    </div>
  );
};

const MonthlyReport: FC<{ token: string }> = ({ token }) => {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [data, setData] = useState<ChartPoint[] | null>(null);
  const [browsers, setBrowsers] = useState<BrowserData | null>(null);
  const [highlight, setHighlight] = useState<ChartPoint | null>(null);

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

    getBrowsersMonth(token, year, month).then((result) => {
      setBrowsers(result.browsers);
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
        {data && (
          <span>
            <b>Total:</b>{" "}
            {data
              .reduce((total, datum) => total + (datum.y || 0), 0)
              .toString()}
          </span>
        )}
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
            data={[{ color: "#0074d9", points: data }]}
            width={300}
            height={200}
            gridY={5}
            gridX={15}
            onMouseOver={(_event, _data, point) => setHighlight(point)}
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

      {browsers && (
        <BrowserReport
          browserData={browsers}
          labelMapper={(day) => day.toString()}
        />
      )}
    </div>
  );
};

const Report: FC<{ token: string }> = ({ token }) => {
  const now = new Date();
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
