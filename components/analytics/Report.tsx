import React, { FC, useEffect, useState } from "react";
import styles from "./Report.module.scss";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrowserData } from "../../lib/analytics";
import { BrowserReport } from "./BrowserReport";
import { formatNumber } from "../../lib/utils";

export interface ReportView {
  category: string;
  views: number;
  scroll: number;
  duration: number;
}

export interface ParamInfo {
  min: number;
  max: number;
  startOffset: number;
  labelMapper: (day: number) => string;
  fromDate: (date: Date) => number;
  format: (year: number, param: number) => string;
  formatDay: (year: number, param: number, category: string) => string;
}

export interface ReportProps {
  paramInfo: ParamInfo;
  getData: (
    year: number,
    param: number
  ) => Promise<{ data: ReportView[]; browsers: BrowserData }>;
}

const ReportTooltip = ({
  year,
  param,
  active,
  payload,
  paramInfo,
}: {
  year: number;
  param: number;
  active?: boolean;
  payload?: any;
  paramInfo: ParamInfo;
}) => {
  if (active && payload && payload.length > 0) {
    const view = payload[0].payload as ReportView;

    return (
      <div className={styles.tooltip}>
        <p className={styles.title}>
          {paramInfo.formatDay(year, param, view.category)}
        </p>
        <table>
          <tbody>
            <tr>
              <th>View Count</th>
              <td>{formatNumber(view.views, 0)}</td>
            </tr>
            <tr>
              <th>Avg. Scroll</th>
              <td>
                {view.views > 0
                  ? formatNumber(view.scroll / view.views, 2, undefined, "%")
                  : "-"}
              </td>
            </tr>
            <tr>
              <th>Avg. Duration</th>
              <td>
                {view.views > 0
                  ? formatNumber(
                      view.duration / view.views,
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
        <div className={styles.notice}>No Data</div>
      </div>
    );
  }
};

export const Report: FC<ReportProps> = ({ paramInfo, getData }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [param, setParam] = useState(paramInfo.fromDate(now));
  const [views, setViews] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scroll, setScroll] = useState(0);
  const [data, setData] = useState<ReportView[]>([]);
  const [browsers, setBrowsers] = useState<BrowserData>({});

  useEffect(() => {
    getData(year, param).then(({ data, browsers }) => {
      let total_views = 0;
      let counted_views = 0;
      let total_scroll = 0;
      let total_duration = 0;

      data.forEach((item) => {
        if (item.scroll > 0 && item.duration > 0) {
          total_scroll += item.scroll;
          total_duration += item.duration;
          counted_views += item.views;
        }

        total_views += item.views;
      });

      setBrowsers(browsers);
      setData(data);
      setViews(total_views);

      if (counted_views > 0) {
        setScroll(total_scroll / counted_views);
        setDuration(total_duration / counted_views);
      } else {
        setScroll(0);
        setDuration(0);
      }
    });
  }, [getData, year, param]);

  const handlePrevClick = () => {
    if (param === paramInfo.min) {
      setYear(year - 1);
      setParam(paramInfo.max);
    } else {
      setParam(param - 1);
    }
  };

  const handleNextClick = () => {
    if (param === paramInfo.max) {
      setYear(year + 1);
      setParam(paramInfo.min);
    } else {
      setParam(param + 1);
    }
  };

  return (
    <div className={styles.reportContents}>
      <div className={styles.reportControls}>
        <span>
          <b>Date:</b> {paramInfo.format(year, param)}
        </span>
        <div className="buttonGroup">
          <button type="button" onClick={handlePrevClick}>
            &larr;
          </button>
          <button type="button" onClick={handleNextClick}>
            &rarr;
          </button>
        </div>
        {data.length > 0 && (
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
        {data.length > 0 && (
          <LineChart width={1000} height={400} data={data}>
            <Line
              type="monotone"
              dataKey="views"
              stroke="#0074d9"
              strokeWidth={2}
            />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip
              content={
                <ReportTooltip
                  year={year}
                  param={param}
                  paramInfo={paramInfo}
                />
              }
            />
          </LineChart>
        )}
        {browsers && (
          <BrowserReport
            year={year}
            param={param}
            formatDay={paramInfo.formatDay}
            startOffset={paramInfo.startOffset}
            browserData={browsers}
            labelMapper={paramInfo.labelMapper}
          />
        )}
      </div>
    </div>
  );
};
