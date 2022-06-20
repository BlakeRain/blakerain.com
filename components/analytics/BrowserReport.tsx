import React, { FC, useMemo } from "react";

import { BrowserData } from "../../lib/analytics";
import reportStyles from "./Report.module.scss";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "../../lib/tools/utils";

// const TOP_BROWSERS = 8;
const BROWSER_COLORS = [
  "#0584A5",
  "#F6C75E",
  "#6D4E7C",
  "#9CD866",
  "#C9472F",
  "#FFA055",
  "#8DDDD0",
];

type NamedData = { [name: string]: any };

interface CombinedData extends NamedData {
  label: string;
}

const BrowserTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any;
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as CombinedData;

    return (
      <div className={reportStyles.tooltip}>
        <p className={reportStyles.title}>{data.label}</p>
        <table>
          <tbody>
            {Object.keys(data)
              .filter((name) => name !== "label")
              .filter((name) => data[name] > 0)
              .map((name, index) => (
                <tr key={index.toString()}>
                  <th>{name.replace("-", " ")}</th>
                  <td>{formatNumber(data[name], 0)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  } else {
    return <div className={reportStyles.tooltip}></div>;
  }
};

export const BrowserReport: FC<{
  browserData: BrowserData;
  startOffset: number;
  labelMapper: (day: number) => string;
}> = ({ browserData, startOffset, labelMapper }) => {
  const [browsers, names] = useMemo(() => {
    let combined: CombinedData[] = [];
    let names: string[] = Object.keys(browserData);

    Object.keys(browserData).forEach((name) => {
      let data = browserData[name];

      for (let item of data) {
        let index = item.day - startOffset;
        while (index >= combined.length) {
          combined.push({
            label: labelMapper(startOffset + combined.length),
          });
        }

        combined[index][name] = item.count || 0;
      }
    });

    return [combined, names];
  }, [browserData]);

  return (
    <>
      <LineChart width={1000} height={400} data={browsers}>
        {names.map((name, index) => (
          <Line
            key={index.toString()}
            type="monotone"
            dataKey={name}
            stroke={BROWSER_COLORS[index % BROWSER_COLORS.length]}
            strokeWidth={2}
          />
        ))}
        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip content={<BrowserTooltip />} />
      </LineChart>
    </>
  );
};
