//
// lib/analytics.ts
//
// Website analytics API client.
//
// This module contains the functionality that interfaces with the website analytics.
//

function getDaysInMonth(year: number, month: number): number {
  const last = new Date(0);
  last.setFullYear(year, 1 + month, 0);
  last.setHours(0, 0, 0, 0);
  return last.getDate();
}

export function getAnalyticsURL(path: string): string {
  const host = process.env.ANALYTICS_HOSTNAME || "https://pv.blakerain.com";
  return host + "/" + path;
}

const SESSION_TOKEN_NAME = "blakerain:analytics:token";

export function getSessionToken(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem(SESSION_TOKEN_NAME);
  } else {
    return null;
  }
}

export function setSessionToken(token: string) {
  sessionStorage.setItem(SESSION_TOKEN_NAME, token);
}

export const authenticate = async (
  username: string,
  password: string
): Promise<string> => {
  const res = await fetch(getAnalyticsURL("api/auth/signin"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const result = (await res.json()) as { error?: string; token?: string };
  if (result.error) {
    return Promise.reject(result.error);
  }

  if (result.token) {
    return result.token;
  }

  return Promise.reject("Expected to receive authentication token (or error)");
};

export interface WeekView {
  year: number;
  week: number;
  day: number;
  count?: number;
}

const DAYS_REMAP = [6, 0, 1, 2, 3, 4, 5];

export const getWeekViews = async (
  token: string,
  year: number,
  week: number
): Promise<WeekView[]> => {
  const res = await fetch(getAnalyticsURL("api/views/week"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      year: year,
      week: week,
    }),
  });

  var weeks: WeekView[] = await res.json();

  for (let day = 0; day < 7; ++day) {
    var found = false;

    for (let index = 0; index < weeks.length; ++index) {
      if (weeks[index].day === day) {
        found = true;
        break;
      }
    }

    if (!found) {
      weeks.push({ year, week, day });
    }
  }

  // Remap days
  weeks.forEach((week) => {
    week.day = DAYS_REMAP[week.day];
  });

  return weeks.sort((a, b) => a.day - b.day);
};

export interface MonthView {
  year: number;
  month: number;
  day: number;
  count?: number;
}

export const getMonthViews = async (
  token: string,
  year: number,
  month: number
): Promise<MonthView[]> => {
  const res = await fetch(getAnalyticsURL("api/views/month"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      year: year,
      month: 1 + month,
    }),
  });

  const days = getDaysInMonth(year, month);
  var months: MonthView[] = await res.json();

  for (let day = 1; day <= days; ++day) {
    var found = false;

    for (let index = 0; index < months.length; ++index) {
      if (months[index].day === day) {
        found = true;
        break;
      }
    }

    if (!found) {
      months.push({ year, month, day });
    }
  }

  return months.sort((a, b) => a.day - b.day);
};

export interface BrowserDataItem {
  day: number;
  count?: number;
}

export type BrowserData = { [key: string]: BrowserDataItem[] };

export interface BrowsersWeek {
  year: number;
  week: number;
  browsers: BrowserData;
}

export const getBrowsersWeek = async (
  token: string,
  year: number,
  week: number
): Promise<BrowsersWeek> => {
  const res = await fetch(getAnalyticsURL("api/browsers/week"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      year,
      week,
    }),
  });

  var data: BrowsersWeek = {
    year,
    week,
    browsers: {},
  };

  const json: {
    browser: string;
    year: number;
    week: number;
    day: number;
    count: number;
  }[] = await res.json();
  json.forEach((obj) => {
    const day = DAYS_REMAP[obj["day"]];
    const count = obj["count"];
    const browser = obj["browser"];

    if (browser in data.browsers) {
      data.browsers[browser].push({ day, count });
    } else {
      data.browsers[browser] = [{ day, count }];
    }
  });

  for (let day = 0; day < 7; ++day) {
    Object.keys(data.browsers).forEach((browser) => {
      const found = data.browsers[browser].find((item) => item.day === day);
      if (!found) {
        data.browsers[browser].push({ day });
      }
    });
  }

  Object.keys(data.browsers).forEach((browser) => {
    data.browsers[browser].sort((a, b) => a.day - b.day);
  });

  return data;
};

export interface BrowsersMonth {
  year: number;
  month: number;
  browsers: BrowserData;
}

export const getBrowsersMonth = async (
  token: string,
  year: number,
  month: number
): Promise<BrowsersMonth> => {
  const res = await fetch(getAnalyticsURL("api/browsers/month"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, year, month: 1 + month }),
  });

  var data: BrowsersMonth = {
    year,
    month,
    browsers: {},
  };

  const json: {
    browser: string;
    year: number;
    week: number;
    day: number;
    count: number;
  }[] = await res.json();

  json.forEach((obj) => {
    const day = obj["day"];
    const count = obj["count"];
    const browser = obj["browser"];

    if (browser in data.browsers) {
      data.browsers[browser].push({ day, count });
    } else {
      data.browsers[browser] = [{ day, count }];
    }
  });

  const days = getDaysInMonth(year, month);
  for (let day = 1; day <= days; ++day) {
    Object.keys(data.browsers).forEach((browser) => {
      const found = data.browsers[browser].find((item) => item.day === day);
      if (!found) {
        data.browsers[browser].push({ day });
      }
    });
  }

  Object.keys(data.browsers).forEach((browser) => {
    data.browsers[browser].sort((a, b) => a.day - b.day);
  });

  return data;
};
