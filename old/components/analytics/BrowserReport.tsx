import React, { FC, useMemo } from "react";
import cn from "classnames";
import { BrowserData } from "../../lib/analytics";
import reportStyles from "./Report.module.scss";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "../../lib/utils";

const OTHER_COLORS = ["#6588b7", "#88a2bc", "#f0dbb0", "#efb680", "#d99477"];

const BROWSER_COLORS: { [key: string]: string } = {
  Safari: "#4594b5",
  Chrome: "#FFA055",
  Firefox: "#C9472F",
};

function browserColor(name: string, index: number): string {
  const color = BROWSER_COLORS[name];
  if (color) {
    return color;
  }

  return OTHER_COLORS[index % OTHER_COLORS.length];
}

type NamedData = { [name: string]: any };

interface CombinedData extends NamedData {
  label: string;
}

const BrowserTooltip = ({
  year,
  param,
  names,
  formatDay,
  active,
  payload,
}: {
  year: number;
  param: number;
  names: string[];
  formatDay: (year: number, param: number, category: string) => string;
  active?: boolean;
  payload?: any;
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as CombinedData;
    const total = names.reduce((total, name) => total + data[name], 0);

    const rows: any[] = [];
    names.forEach((name, index) => {
      if (data[name] > 0) {
        rows.unshift(
          <tr key={index.toString()}>
            <th
              style={{
                color: "#000000",
                backgroundColor: browserColor(name, index),
              }}
            >
              {name.replace("-", " ")}
            </th>
            <td>{formatNumber(data[name], 0)}</td>
            <td>
              {formatNumber((100 * data[name]) / total, 0, undefined, "%")}
            </td>
          </tr>
        );
      }
    });

    return (
      <div className={cn(reportStyles.tooltip, reportStyles.large)}>
        <p className={reportStyles.title}>
          {formatDay(year, param, data.label)} - {formatNumber(total, 0)} views
        </p>
        <table>
          <tbody>{rows}</tbody>
        </table>
        {names.length === 0 && (
          <div className={reportStyles.notice}>No Data</div>
        )}
      </div>
    );
  } else {
    return <div className={reportStyles.tooltip}></div>;
  }
};

export const BrowserReport: FC<{
  year: number;
  param: number;
  formatDay: (year: number, param: number, category: string) => string;
  browserData: BrowserData;
  startOffset: number;
  labelMapper: (day: number) => string;
}> = ({ year, param, formatDay, browserData, startOffset, labelMapper }) => {
  const [browsers, names] = useMemo(() => {
    let combined: CombinedData[] = [];
    let names: string[] = Object.keys(browserData);
    let totals: { [key: string]: number } = {};

    Object.keys(browserData).forEach((name) => {
      let data = browserData[name];
      let total = 0;

      for (let item of data) {
        let index = item.day - startOffset;
        while (index >= combined.length) {
          combined.push({
            label: labelMapper(startOffset + combined.length),
          });
        }

        combined[index][name] = item.count || 0;
        total += item.count || 0;
      }

      totals[name] = total;
    });

    names.sort((a, b) => totals[a] - totals[b]);

    return [combined, names];
  }, [browserData, labelMapper, startOffset]);

  return (
    <>
      <AreaChart width={1000} height={400} data={browsers}>
        {names.map((name, index) => (
          <Area
            key={index.toString()}
            type="monotone"
            dataKey={name}
            stackId="1"
            stroke={browserColor(name, index)}
            fill={browserColor(name, index)}
            strokeWidth={2}
          />
        ))}
        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip
          content={
            <BrowserTooltip
              year={year}
              param={param}
              names={names}
              formatDay={formatDay}
            />
          }
        />
      </AreaChart>
    </>
  );
};
