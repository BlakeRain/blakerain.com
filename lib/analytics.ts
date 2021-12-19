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
  const host =
    process.env.ANALYTICS_HOSTNAME || "https://analytics.blakerain.com/";

  while (path.startsWith("/")) {
    path = path.substr(1);
  }

  const params = parameters
    ? "?" +
      Object.keys(parameters)
        .map((key) => `${key}=${encodeURIComponent(parameters[key])}`)
        .join("&")
    : "";
  return host + path + params;
}

export const authenticate = async (
  username: string,
  password: string
): Promise<string> => {
  const res = await fetch(getAnalyticsURL("auth/signin"), {
    method: "POST",
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
  key: string,
  year: number,
  week: number
): Promise<WeekView[]> => {
  const res = await fetch(
    getAnalyticsURL("views/week", {
      key,
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
  key: string,
  year: number,
  month: number
): Promise<MonthView[]> => {
  const res = await fetch(
    getAnalyticsURL("views/month", {
      key,
      year: year.toString(),
      month: month.toString(),
    })
  );

  var months: MonthView[] = await res.json();
  return months.sort((a, b) => a.day - b.day);
};
