import React, { FC, useState } from "react";

import LineChart, { ChartData } from "./LineChart";

import BrowserIcon from "./BrowserIcon";

import { BrowserData } from "../../lib/analytics";

import styles from "./BrowserChart.module.scss";

const BROWSER_COLORS = [
  "#0584A5",
  "#F6C75E",
  "#6D4E7C",
  "#9CD866",
  "#C9472F",
  "#FFA055",
  "#8DDDD0",
];

export interface BrowserChartData extends ChartData {
  name: string;
  total: number;
}

export const BrowserReport: FC<{
  browserData: BrowserData;
  labelMapper: (day: number) => string;
}> = ({ browserData, labelMapper }) => {
  const [highlight, setHighlight] = useState<string | null>(null);

  const browsers: BrowserChartData[] = Object.keys(browserData)
    .map((browser) => ({
      name: browser.replaceAll("-", " "),
      total: browserData[browser].reduce(
        (total, item) => total + (item.count || 0),
        0
      ),
      color: "",
      points: browserData[browser].map((item) => ({
        label: labelMapper(item.day),
        x: item.day,
        y: item.count,
      })),
    }))
    .sort((a, b) => b.total - a.total)
    .map((obj, index) => {
      obj.color = BROWSER_COLORS[index % BROWSER_COLORS.length];
      return obj;
    });

  const N = 8;
  const topN: {
    names: [string];
    total: number;
    percent: number;
    start: number;
    color: string;
  }[] = [];
  for (let i = 0; i < browsers.length; ++i) {
    if (i < N - 1) {
      topN.push({
        names: [browsers[i].name],
        total: browsers[i].total,
        percent: 0,
        start: 0,
        color: browsers[i].color,
      });
    } else if (i === N - 1) {
      topN.push({
        names: [browsers[i].name],
        total: browsers[i].total,
        percent: 0,
        start: 0,
        color: "#444",
      });
    } else {
      topN[topN.length - 1].names.push(browsers[i].name);
      topN[topN.length - 1].total += browsers[i].total;
    }
  }

  topN.sort((a, b) => (a.total = b.total));
  const topN_total = topN.reduce((total, item) => total + item.total, 0);
  var last_percent = 0;
  topN.forEach((item) => {
    item.start = last_percent;
    item.percent = item.total / topN_total;
    last_percent = item.start + item.percent;
  });

  const getCoordinatesForPercent = (percent: number): [number, number] => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <React.Fragment>
      <div>
        <LineChart
          data={browsers}
          width={400}
          height={200}
          gridX={6}
          gridY={5}
          highlight={
            highlight
              ? browsers.findIndex((b) => b.name === highlight)
              : undefined
          }
          onMouseOver={(_event, data, _point) =>
            setHighlight((data as BrowserChartData).name)
          }
          onMouseOut={() => setHighlight(null)}
        />
      </div>
      <div className={styles.browserInfo}>
        <div>
          <svg viewBox="-1 -1 2 2" style={{ transform: "rotate(-0.25turn)" }}>
            {topN.map((browser, index) => {
              const [sx, sy] = getCoordinatesForPercent(browser.start);
              const [ex, ey] = getCoordinatesForPercent(
                browser.start + browser.percent
              );
              const large_arc = browser.percent > 0.5 ? 1 : 0;
              const path = [
                `M ${sx} ${sy}`,
                `A 1 1 0 ${large_arc} 1 ${ex} ${ey}`,
                `L 0 0`,
              ].join(" ");

              return (
                <path
                  key={index.toString()}
                  fill={browser.color}
                  d={path}
                  fillOpacity={
                    highlight === null ||
                    browser.names.indexOf(highlight) !== -1
                      ? "1.0"
                      : "0.1"
                  }
                />
              );
            })}
          </svg>
        </div>
        <div className={styles.browserPalette}>
          {browsers.map((browser, index) => (
            <div
              className={
                styles.browserButton +
                " " +
                (highlight === null || highlight === browser.name
                  ? ""
                  : styles.inactive)
              }
              key={index.toString()}
              style={{ backgroundColor: browser.color }}
              onMouseOver={() => setHighlight(browser.name)}
              onMouseOut={() => setHighlight(null)}
            >
              <div>
                <BrowserIcon name={browser.name} />
                {browser.name}
              </div>
              <b>{browser.total}</b>
            </div>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
};
