import React, { FC, useEffect, useState } from "react";
import styles from "./Report.module.scss";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrowserData, PageCount } from "../../lib/analytics";
import { BrowserReport } from "./BrowserReport";
import { formatNumber } from "../../lib/utils";

const PIE_COLORS = [
  "#003f5c",
  "#2f4b7c",
  "#665191",
  "#a05195",
  "#d45087",
  "#f95d6a",
  "#ff7c43",
  "#ffa600",
];

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
  paths: string[];
  paramInfo: ParamInfo;
  getData: (
    path: string,
    year: number,
    param: number
  ) => Promise<{
    data: ReportView[];
    browsers: BrowserData;
    pages: PageCount[];
  }>;
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
                  ? formatNumber(view.scroll / view.views, 0, undefined, "%")
                  : "-"}
              </td>
            </tr>
            <tr>
              <th>Avg. Duration</th>
              <td>
                {view.views > 0
                  ? formatNumber(
                      view.duration / view.views,
                      0,
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

const ReportPageTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any;
}) => {
  if (active && payload && payload.length > 0) {
    const page = payload[0].payload as PageCount;

    return (
      <div className={styles.tooltip}>
        <p className={styles.title}>{page.page}</p>
        <table>
          <tbody>
            <tr>
              <th>View Count</th>
              <td>{formatNumber(page.count, 0)}</td>
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

export const Report: FC<ReportProps> = ({ paths, paramInfo, getData }) => {
  const now = new Date();
  const [path, setPath] = useState("site");
  const [year, setYear] = useState(now.getFullYear());
  const [param, setParam] = useState(paramInfo.fromDate(now));
  const [views, setViews] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scroll, setScroll] = useState(0);
  const [data, setData] = useState<ReportView[]>([]);
  const [browsers, setBrowsers] = useState<BrowserData>({});
  const [pages, setPages] = useState<PageCount[]>([]);

  useEffect(() => {
    getData(path, year, param).then(({ data, browsers, pages }) => {
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

      pages.sort((a, b) => b.count - a.count);
      setPages(pages);

      if (counted_views > 0) {
        setScroll(total_scroll / counted_views);
        setDuration(total_duration / counted_views);
      } else {
        setScroll(0);
        setDuration(0);
      }
    });
  }, [getData, path, year, param]);

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

  const handlePathChange: React.ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    setPath(event.target.value);
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
        <div>
          <select value={path} onChange={handlePathChange}>
            {paths.map((path, index) => (
              <option key={index.toString()} value={path}>
                {path}
              </option>
            ))}
          </select>
        </div>
      </div>
      {data.length > 0 && (
        <div className={styles.reportControls}>
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
        </div>
      )}
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
        <div className={styles.reportChartsRow}>
          <PieChart width={500} height={400}>
            <Pie data={pages} dataKey="count" fill="#0074d9">
              {pages.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<ReportPageTooltip />} />
          </PieChart>
          <table>
            <thead>
              <tr>
                <th>Page</th>
                <th style={{ textAlign: "right" }}>Views</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page, index) => (
                <tr key={index.toString()}>
                  <td>{page.page}</td>
                  <td style={{ textAlign: "right" }}>
                    {formatNumber(page.count, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
