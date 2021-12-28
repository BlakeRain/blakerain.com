import React, { FC, useMemo } from "react";

export interface PieChartPoint {
  label: string;
  color: string;
  ratio: number;
}

export const PieChart: FC<{
  data: PieChartPoint[];
  highlight?: string;
  onHighlight?: (name: string | null, index: number) => void;
}> = ({ data, highlight, onHighlight }) => {
  const coord = (ratio: number): [number, number] => {
    const t = 2 * Math.PI * ratio;
    return [Math.cos(t), Math.sin(t)];
  };

  const paths = useMemo(() => {
    const paths = [];

    for (
      let last = 0, i = 0;
      i < data.length;
      last = last + data[i].ratio, ++i
    ) {
      const [sx, sy] = coord(last);
      const [ex, ey] = coord(last + data[i].ratio);
      const large = data[i].ratio > 0.5 ? 1 : 0;

      paths.push({
        label: data[i].label,
        color: data[i].color,
        d: `M ${sx} ${sy} A 1 1 0 ${large} 1 ${ex} ${ey} L 0 0`,
      });
    }

    return paths;
  }, [data]);

  return (
    <svg viewBox="-1 -1 2 2" style={{ transform: "rotate(-0.25turn)" }}>
      {paths.map(({ label, color, d }, index) => (
        <path
          key={index.toString()}
          d={d}
          fill={color}
          fillOpacity={
            typeof highlight !== "string" || highlight === label ? "1.0" : "0.1"
          }
          onMouseOver={() => {
            if (onHighlight) {
              onHighlight(label, index);
            }
          }}
          onMouseOut={() => {
            if (onHighlight) {
              onHighlight(null, -1);
            }
          }}
        />
      ))}
    </svg>
  );
};

export default PieChart;
