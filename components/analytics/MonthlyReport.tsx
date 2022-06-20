import React, { FC, useEffect, useState } from "react";
import { BrowserReport } from "./BrowserReport";

import {
  getMonthViews,
  getBrowsersMonth,
  BrowserData,
  MonthView,
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
import { formatNumber, zeroPad } from "../../lib/tools/utils";

const MonthViewTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any;
}) => {
  if (active && payload && payload.length > 0) {
    const view = payload[0].payload as MonthView;

    return (
      <div className={styles.tooltip}>
        <p className={styles.title}>
          {view.year}-{zeroPad(view.month, 2)}-{zeroPad(view.day, 2)}
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

const MonthlyReport: FC<{ token: string }> = ({ token }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [views, setViews] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [scroll, setScroll] = useState<number>(0);
  const [data, setData] = useState<MonthView[] | null>(null);
  const [browsers, setBrowsers] = useState<BrowserData | null>(null);

  useEffect(() => {
    getMonthViews(token, year, month).then((result) => {
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

      setData(result);
      setViews(total_views);

      if (counted_views > 0) {
        setScroll(total_scroll / counted_views);
        setDuration(total_duration / counted_views);
      } else {
        setScroll(0);
        setDuration(0);
      }
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
          <b>Date:</b> {(1 + month).toString().padStart(2, "0")}/
          {year.toString().padStart(4, "0")}
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
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip content={<MonthViewTooltip />} />
          </LineChart>
        )}
        {browsers && (
          <BrowserReport
            startOffset={1}
            browserData={browsers}
            labelMapper={(day) => day.toString()}
          />
        )}
      </div>
    </div>
  );
};

export default MonthlyReport;
