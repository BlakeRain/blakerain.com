import React, { FC, useEffect, useState } from "react";

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

function getISOWeek(date: Date): number {
  var d = new Date(date);
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var diff = d.getTime() - yearStart.getTime();
  return Math.ceil((diff / 86400000 + 1) / 7);
}

const WeeklyReport: FC<{ token: string }> = ({ token }) => {
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(getISOWeek(now));
  const [views, setViews] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [scroll, setScroll] = useState<number>(0);
  const [data, setData] = useState<ChartPoint[] | null>(null);
  const [browsers, setBrowsers] = useState<BrowserData | null>(null);
  const [highlight, setHighlight] = useState<ChartPoint | null>(null);

  useEffect(() => {
    getWeekViews(token, year, week).then((result) => {
      let total_views = 0;
      let counted_views = 0;
      let total_scroll = 0;
      let total_duration = 0;

      result.forEach((item) => {
        if (
          typeof item.scroll === "number" &&
          typeof item.duration === "number"
        ) {
          total_scroll += item.scroll;
          total_duration += item.duration;
          counted_views += item.count || 0;
        }

        total_views += item.count || 0;
      });

      setData(
        result.map((item) => ({
          label: WEEK_LABELS[item.day],
          x: item.day,
          y: item.count,
        }))
      );

      setViews(total_views);
      setScroll(total_scroll / counted_views);
      setDuration(total_duration / counted_views);
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
          <>
            <span>
              <b>Total:</b> {views}
            </span>
            <span>
              <b>Avg. Scroll:</b> {scroll.toFixed(2)}%
            </span>
            <span>
              <b>Avg. Duration:</b> {duration.toFixed(2)} seconds
            </span>
          </>
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
