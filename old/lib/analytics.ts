// Website analytics API client.
//
// This module contains the functionality that interfaces with the website analytics.

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

// The session token where we store the authentication token.
const SESSION_TOKEN_NAME = "blakerain:analytics:token";

// Retrieve the authentication token from the session storage (if we have one).
export function getSessionToken(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem(SESSION_TOKEN_NAME);
  } else {
    return null;
  }
}

// Store the authentication token in the session storage.
export function setSessionToken(token: string) {
  sessionStorage.setItem(SESSION_TOKEN_NAME, token);
}

/// Given a username and password, attempt to authenticate with the API.
///
/// If this succeeds, it will return the authentication token from the promise. This token can then be used as the
/// `Bearer` token in an `Authorization` header for subsequent requests.
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

/// The analytics data for a day of a week
export interface WeekView {
  /// The year.
  year: number;
  /// The ISO week number.
  week: number;
  /// The day of the week.
  day: number;
  /// The number of views on this day.
  count?: number;
  /// The average amount of scroll distance on this day.
  scroll?: number;
  /// The average visit duration on this day.
  duration?: number;
}

// Remapping from day-of-week index in Rust to JavaScript.
const DAYS_REMAP = [6, 0, 1, 2, 3, 4, 5];

/// Get the week view for the given path, year and ISO week number.
///
/// The `path` argument is the path to the URL we want to view. If this path is `site` (does not start with a `/`), then
/// we will see the accumulated data for the entire site.
///
/// This will return an array of `WeekView` for each day in the week. For days on which no data has been recorded, this
/// will fill in empty `WeekView` records. The returned array is sorted by the day-of-week.
export const getWeekViews = async (
  token: string,
  path: string,
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
      path,
      year: year,
      week: week,
    }),
  });

  var weeks: WeekView[] = await res.json();

  // Add in any `WeekView` records that do not exist, to ensure there are no gaps.
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

  // Remap days from Rust to JavaScript.
  weeks.forEach((week) => {
    week.day = DAYS_REMAP[week.day];
  });

  return weeks.sort((a, b) => a.day - b.day);
};

/// The analytics data for a day of a month.
export interface MonthView {
  /// The year.
  year: number;
  /// The month.
  month: number;
  /// The day of the month.
  day: number;
  /// The number of views on this day.
  count?: number;
  /// The average scroll distance on this day.
  scroll?: number;
  /// The average visit duration on this day.
  duration?: number;
}

/// Get the month view for the given path, year and month.
///
/// The `path` argument is the path to the URL we want to view. If this path is `site` (does not start with a `/`),
/// then we will see the accumulated data for the entire site.
///
/// This will return an array of `MonthView` for each day in the month. For days on which no data has been recorded,
/// this will fill in empty `MonthView` records. The returned array is sorted by day.
export const getMonthViews = async (
  token: string,
  path: string,
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
      path,
      year: year,
      month: 1 + month,
    }),
  });

  const days = getDaysInMonth(year, month);
  var months: MonthView[] = await res.json();

  // Fill in any missing days with empty records.
  for (let day = 1; day <= days; ++day) {
    var found = false;

    for (let index = 0; index < months.length; ++index) {
      if (months[index].day === day) {
        found = true;
        break;
      }
    }

    if (!found) {
      months.push({ year, month, day, count: 0, scroll: 0, duration: 0 });
    }
  }

  return months.sort((a, b) => a.day - b.day);
};

/// The total number of views of a specific page.
export interface PageCount {
  page: string;
  count: number;
}

/// Get the total number of views of pages over the given week.
export const getWeekPageCount = async (
  token: string,
  year: number,
  week: number
): Promise<PageCount[]> => {
  const res = await fetch(getAnalyticsURL("api/pages/week"), {
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

  return await res.json();
};

/// Get the total number of views of pages over the given month.
export const getMonthPageCount = async (
  token: string,
  year: number,
  month: number
): Promise<PageCount[]> => {
  const res = await fetch(getAnalyticsURL("api/pages/month"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      year,
      month: month + 1,
    }),
  });

  return await res.json();
};

/// Represents the number of visits by a given browser on a certain day.
export interface BrowserDataItem {
  day: number;
  count?: number;
}

/// A mapping from a browser name to a set of data points for that browser over a number of days (sorted by day).
export type BrowserData = { [key: string]: BrowserDataItem[] };

/// Represents the recorded browser activity over a week.
export interface BrowsersWeek {
  /// The year.
  year: number;
  /// The ISO week.
  week: number;
  /// Mapping from a browser to the data for that browser (sorted by day).
  browsers: BrowserData;
}

/// Get the view counts for various browsers over the given week.
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

/// Represents the recorded browser activity over a month.
export interface BrowsersMonth {
  /// The year.
  year: number;
  /// The month.
  month: number;
  /// Mapping from a browser to the data for that browser (sorted by day).
  browsers: BrowserData;
}

/// Get the view counts for various browsers over the given month.
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
