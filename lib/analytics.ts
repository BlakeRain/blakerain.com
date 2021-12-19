//
// lib/analytics.ts
//
// Website analytics API client.
//
// This module contains the functionality that interfaces with the website analytics.
//

export function getAnalyticsURL(
  path: string,
  parameters?: { [key: string]: string }
): string {
  const host = process.env.ANALYTICS_HOSTNAME || "https://pv.blakerain.com";

  const params = parameters
    ? "?" +
      Object.keys(parameters)
        .map((key) => `${key}=${encodeURIComponent(parameters[key])}`)
        .join("&")
    : "";
  return host + "/" + path + params;
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
  count: number;
}

export const getWeekViews = async (
  token: string,
  year: number,
  week: number
): Promise<WeekView[]> => {
  const res = await fetch(
    getAnalyticsURL("api/views/week", {
      token,
      year: year.toString(),
      week: week.toString(),
    })
  );

  var weeks: WeekView[] = await res.json();
  return weeks.sort((a, b) => a.day - b.day);
};

export interface MonthView {
  year: number;
  month: number;
  day: number;
  count: number;
}

export const getMonthViews = async (
  token: string,
  year: number,
  month: number
): Promise<MonthView[]> => {
  const res = await fetch(
    getAnalyticsURL("api/views/month", {
      token,
      year: year.toString(),
      month: month.toString(),
    })
  );

  var months: MonthView[] = await res.json();
  return months.sort((a, b) => a.day - b.day);
};
