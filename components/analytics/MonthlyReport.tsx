import React, { FC } from "react";
import { getMonthViews, getBrowsersMonth } from "../../lib/analytics";
import { Report } from "./Report";

const MonthlyReport: FC<{ token: string }> = ({ token }) => {
  return (
    <Report
      paramInfo={{
        min: 0,
        max: 52,
        startOffset: 1,
        labelMapper: (day) => day.toString(),
        fromDate: (date) => date.getMonth(),
        format: (year, month) =>
          `${(1 + month).toString().padStart(2, "0")}/${year
            .toString()
            .padStart(4, "0")}`,
        formatDay: (year, month, day) =>
          `${day.toString().padStart(2, "0")}/${(1 + month)
            .toString()
            .padStart(2, "0")}/${year.toString().padStart(4, "0")}`,
      }}
      getData={async (year, month) => {
        const data = (await getMonthViews(token, year, month)).map((item) => ({
          category: item.day.toString(),
          views: item.count || 0,
          scroll: item.scroll || 0,
          duration: item.duration || 0,
        }));
        const browsers = (await getBrowsersMonth(token, year, month)).browsers;
        return { data, browsers };
      }}
    />
  );
};

export default MonthlyReport;
