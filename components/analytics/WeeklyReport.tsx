import React, { FC } from "react";
import { getWeekViews, getBrowsersWeek } from "../../lib/analytics";
import { getISOWeek } from "../../lib/utils";
import { Report } from "./Report";

const WEEK_LABELS: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const WeeklyReport: FC<{ paths: string[]; token: string }> = ({
  paths,
  token,
}) => {
  return (
    <Report
      paths={paths}
      paramInfo={{
        min: 1,
        max: 52,
        startOffset: 0,
        labelMapper: (day) => WEEK_LABELS[day],
        fromDate: getISOWeek,
        format: (year, week) => `${year.toString()} W${week.toString()}`,
        formatDay: (year, week, category) =>
          `${year.toString()} W${week.toString()} ${category}`,
      }}
      getData={async (path, year, week) => {
        const data = (await getWeekViews(token, path, year, week)).map(
          (item) => ({
            category: WEEK_LABELS[item.day],
            views: item.count || 0,
            scroll: item.scroll || 0,
            duration: item.duration || 0,
          })
        );
        const browsers = (await getBrowsersWeek(token, year, week)).browsers;
        return { data, browsers };
      }}
    />
  );
};

export default WeeklyReport;
