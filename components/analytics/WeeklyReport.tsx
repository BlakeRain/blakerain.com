import React, { FC, useEffect, useState } from "react";
import { getISOWeek } from "date-fns";

import LineChart, { ChartPoint } from "./LineChart";

import { BrowserReport } from "./BrowserReport";

import {
  getWeekViews,
  getBrowsersWeek,
  BrowserData,
} from "../../lib/analytics";

import styles from "./Report.module.scss";

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
        <div className="buttonGroup">
          <button type="button" onClick={handlePrevClick}>
            &larr;
          </button>
          <button type="button" onClick={handleNextClick}>
            &rarr;
          </button>
        </div>
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
            width={400}
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

export default WeeklyReport;
