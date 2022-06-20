import React, { FC, useEffect, useState } from "react";
import { BrowserReport } from "./BrowserReport";

import {
  getWeekViews,
  getBrowsersWeek,
  BrowserData,
  WeekView,
} from "../../lib/analytics";

import styles from "./Report.module.scss";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber, getISOWeek, zeroPad } from "../../lib/tools/utils";

const WEEK_LABELS: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface WeekViewAndDay extends WeekView {
  dayName: string;
}

const WeekViewTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any;
}) => {
  if (active && payload && payload.length > 0) {
    const view = payload[0].payload as WeekViewAndDay;

    return (
      <div className={styles.tooltip}>
        <p className={styles.title}>
          {view.year} W{zeroPad(view.week, 2)} {view.dayName}
        </p>
        <table>
          <tbody>
            <tr>
              <th>View Count</th>
              <td>{formatNumber(view.count || 0, 0)}</td>
            </tr>
            <tr>
              <th>Avg. Scroll</th>
              <td>
                {typeof view.scroll === "number" &&
                typeof view.count === "number" &&
                view.count > 0
                  ? formatNumber(view.scroll / view.count, 2, undefined, "%")
                  : "-"}
              </td>
            </tr>
            <tr>
              <th>Avg. Duration</th>
              <td>
                {typeof view.duration === "number" &&
                typeof view.count === "number" &&
                view.count > 0
                  ? formatNumber(
                      view.duration / view.count,
                      2,
                      undefined,
                      " secs"
                    )
                  : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  } else {
    return (
      <div className={styles.tooltip}>
        <i>No Content</i>
      </div>
    );
  }
};

const WeeklyReport: FC<{ token: string }> = ({ token }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(getISOWeek(now));
  const [views, setViews] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [scroll, setScroll] = useState<number>(0);
  const [data, setData] = useState<WeekView[] | null>(null);
  const [browsers, setBrowsers] = useState<BrowserData | null>(null);

  useEffect(() => {
    getWeekViews(token, year, week).then((result) => {
      let total_views = 0;
      let counted_views = 0;
      let total_scroll = 0;
      let total_duration = 0;

      result.forEach((item) => {
        if (
          typeof item.scroll === "number" &&
          typeof item.duration === "number" &&
          item.scroll > 0 &&
          item.duration > 0
        ) {
          total_scroll += item.scroll;
          total_duration += item.duration;
          counted_views += item.count || 0;
        }

        total_views += item.count || 0;
      });

      setData(
        result.map((item) => ({ ...item, dayName: WEEK_LABELS[item.day] }))
      );
      setViews(total_views);

      if (counted_views > 0) {
        setScroll(total_scroll / counted_views);
        setDuration(total_duration / counted_views);
      } else {
        setScroll(0);
        setDuration(0);
      }
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
            {scroll > 0 && (
              <span>
                <b>Avg. Scroll:</b> {scroll.toFixed(2)}%
              </span>
            )}
            {duration > 0 && (
              <span>
                <b>Avg. Duration:</b> {duration.toFixed(2)} seconds
              </span>
            )}
          </>
        )}
      </div>
      <div className={styles.reportCharts}>
        {data && (
          <LineChart width={1000} height={400} data={data}>
            <Line
              type="monotone"
              dataKey="count"
              stroke="#0074d9"
              strokeWidth={2}
            />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="dayName" />
            <YAxis />
            <Tooltip content={<WeekViewTooltip />} />
          </LineChart>
        )}
        {browsers && (
          <BrowserReport
            startOffset={0}
            browserData={browsers}
            labelMapper={(day) => WEEK_LABELS[day]}
          />
        )}
      </div>
    </div>
  );
};

export default WeeklyReport;
