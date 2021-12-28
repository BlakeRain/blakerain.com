import React, { FC, useMemo, useState } from "react";

import LineChart, { ChartData, ChartPoint } from "./LineChart";
import PieChart, { PieChartPoint } from "./PieChart";

import BrowserIcon from "./BrowserIcon";

import { BrowserData } from "../../lib/analytics";

import styles from "./BrowserChart.module.scss";

const TOP_BROWSERS = 8;
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
  const [highlight, setHighlight] = useState<{
    browser: BrowserChartData;
    point?: ChartPoint;
  } | null>(null);

  const [browsers, topN, others] = useMemo(() => {
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

    const topN: PieChartPoint[] = [];
    const others: string[] = [];
    var total = 0;

    for (let i = 0; i < browsers.length; ++i) {
      total += browsers[i].total;
      if (i < TOP_BROWSERS - 1) {
        topN.push({
          label: browsers[i].name,
          color: browsers[i].color,
          ratio: browsers[i].total,
        });
      } else if (i === TOP_BROWSERS - 1) {
        others.push(browsers[i].name);
        topN.push({ label: "Others", color: "#444", ratio: browsers[i].total });
      } else {
        others.push(browsers[i].name);
        topN[topN.length - 1].ratio += browsers[i].total;
      }
    }

    topN.forEach((item) => (item.ratio = item.ratio / total));

    return [browsers, topN, others];
  }, [browserData]);

  const pie_highlight = highlight
    ? others.indexOf(highlight.browser.name) !== -1
      ? "Others"
      : highlight.browser.name
    : undefined;

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
              ? browsers.findIndex((b) => b.name === highlight.browser.name)
              : undefined
          }
          onMouseOver={(_event, data, point) => {
            setHighlight({ browser: data as BrowserChartData, point: point });
          }}
          onMouseOut={() => setHighlight(null)}
        />
      </div>
      <div className={styles.browserInfo}>
        <div>
          <PieChart data={topN} highlight={pie_highlight} />
        </div>
        <div className={styles.browserPalette}>
          {browsers.map((browser, index) => (
            <div
              className={
                styles.browserButton +
                " " +
                (highlight === null || highlight.browser.name === browser.name
                  ? ""
                  : styles.inactive)
              }
              key={index.toString()}
              style={{ backgroundColor: browser.color }}
              onMouseOver={() => setHighlight({ browser })}
              onMouseOut={() => setHighlight(null)}
            >
              <div>
                <BrowserIcon name={browser.name} />
                {browser.name}
              </div>
              <b>
                {highlight &&
                highlight.point &&
                highlight.browser.name === browser.name
                  ? highlight.point.y
                  : browser.total}
              </b>
            </div>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
};
