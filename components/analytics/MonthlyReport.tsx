import React, { FC, useEffect, useState } from "react";
import { format } from "date-fns";

import LineChart, { ChartPoint } from "./LineChart";

import { BrowserReport } from "./BrowserReport";

import {
  getMonthViews,
  getBrowsersMonth,
  BrowserData,
} from "../../lib/analytics";

import styles from "./Report.module.scss";

const MonthlyReport: FC<{ token: string }> = ({ token }) => {
  const now = new Date();
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
            width={400}
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

export default MonthlyReport;
