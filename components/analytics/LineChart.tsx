import React, { FC, useState } from "react";

const Axis: FC<{ color: string; points: string }> = ({ color, points }) => (
  <polyline fill="none" stroke={color} strokeWidth="0.5" points={points} />
);

const VerticalGrid: FC<{
  color: string;
  padding: number;
  width: number;
  height: number;
  count: number;
}> = ({ color, padding, width, height, count }) => {
  const step = (width - padding * 2) / count;
  const lines = [];
  const attrs = { fill: "none", stroke: color, strokeWidth: 0.5 };

  for (let x = padding + step, index = 0; index < count; ++index, x += step) {
    lines.push(
      <polyline
        key={index.toString()}
        {...attrs}
        points={`${x},${padding} ${x},${height - padding}`}
      />
    );
  }

  return <React.Fragment>{lines}</React.Fragment>;
};

const HorizontalGrid: FC<{
  color: string;
  padding: number;
  width: number;
  height: number;
  count: number;
}> = ({ color, padding, width, height, count }) => {
  const step = height / count;
  const lines = [];
  const attrs = { fill: "none", stroke: color, strokeWidth: "0.5" };

  for (
    let y = height - step + padding, index = 0;
    index < count;
    ++index, y -= step
  ) {
    lines.push(
      <polyline
        key={index.toString()}
        {...attrs}
        points={`${padding},${y} ${width - padding},${y}`}
      />
    );
  }

  return <React.Fragment>{lines}</React.Fragment>;
};

const VerticalLabels: FC<{
  color: string;
  fontSize: number;
  x: number;
  padding: number;
  height: number;
  count: number;
  start: number;
  end: number;
  precision?: number;
}> = ({
  color,
  fontSize,
  x,
  padding,
  height,
  count,
  start,
  end,
  precision,
}) => {
  const step = height / count;
  const distance_step = (end - start) / count;
  const labels = [];
  const attrs = {
    x,
    textAnchor: "end",
    style: {
      fill: color,
      fontSize,
      fontFamily: "Helvetica",
    },
  };

  for (
    let y = height + padding + fontSize / 3, label = start, index = 0;
    index <= count;
    ++index, y -= step, label += distance_step
  ) {
    labels.push(
      <text key={index.toString()} y={y} {...attrs}>
        {label.toFixed(precision)}
      </text>
    );
  }

  return <React.Fragment>{labels}</React.Fragment>;
};

export interface ChartPoint {
  label?: string;
  x: number;
  y?: number;
}

export interface ChartData {
  color: string;
  points: ChartPoint[];
}

function getChartDataBounds(data: ChartData[]): {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
  range_x: number;
  range_y: number;
} {
  var min_x = Number.MAX_VALUE;
  var min_y = Number.MAX_VALUE;
  var max_x = Number.MIN_VALUE;
  var max_y = Number.MIN_VALUE;

  data.forEach((datum) => {
    datum.points.forEach((point) => {
      min_x = Math.min(min_x, point.x);
      max_x = Math.max(max_x, point.x);

      if (typeof point.y === "number") {
        min_y = Math.min(min_y, point.y);
        max_y = Math.max(max_y, point.y);
      } else {
        min_y = Math.min(min_y, 0);
        max_y = Math.max(max_y, 0);
      }
    });
  });

  return {
    min_x,
    min_y,
    max_x,
    max_y,
    range_x: max_x === min_x ? 1 : max_x - min_x,
    range_y: max_y === min_y ? 1 : max_y - min_y,
  };
}

const LineChart: FC<{
  data: ChartData[];
  width: number;
  height: number;
  gridX?: number;
  gridY?: number;
  highlight?: number;
  precision?: number;
  onMouseOver?: (
    event: React.MouseEvent,
    data: ChartData,
    point: ChartPoint
  ) => void;
  onMouseOut?: (
    event: React.MouseEvent,
    data: ChartData,
    point: ChartPoint
  ) => void;
}> = ({
  data,
  width,
  height,
  gridX,
  gridY,
  highlight: highlightIn,
  precision,
  onMouseOver,
  onMouseOut,
}) => {
  const { min_x, min_y, max_y, range_x, range_y } = getChartDataBounds(data);
  const font_size = width / 50;
  const y_axis_spacing = 1 + max_y.toFixed(precision).length;
  const padding = (font_size + y_axis_spacing) * 3;
  const inner_width = width - 2 * padding;
  const inner_height = height - 2 * padding;
  const [highlightOurs, setHighlight] = useState<number | null>(null);
  const highlight =
    typeof highlightOurs === "number"
      ? highlightOurs
      : typeof highlightIn === "number"
      ? highlightIn
      : null;

  const normalize_x = (x: number): number => {
    return (x - min_x) / range_x;
  };

  const normalize_y = (y?: number): number => {
    if (typeof y === "number") {
      return (y - min_y) / range_y;
    } else {
      return 0;
    }
  };

  const generate_points = (data: ChartData) =>
    data.points
      .map(
        (point) =>
          `${normalize_x(point.x) * inner_width + padding},${
            inner_height - normalize_y(point.y) * inner_height + padding
          }`
      )
      .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`}>
      <Axis
        color="#ccc"
        points={`${padding},${height - padding} ${width - padding},${
          height - padding
        }`}
      />
      <Axis
        color="#ccc"
        points={`${padding},${padding} ${padding},${height - padding}`}
      />

      {data.length > 0 &&
        data[0].points.map((point, index) => (
          <text
            key={index.toString()}
            x={normalize_x(point.x) * inner_width + padding}
            y={height - padding + font_size * 2}
            textAnchor="middle"
            style={{
              fill: "#808080",
              fontSize: font_size,
              fontFamily: "Helvetica",
            }}
          >
            {point.label}
          </text>
        ))}

      {gridY && (
        <VerticalLabels
          color="#808080"
          fontSize={font_size}
          x={padding - font_size}
          height={inner_height}
          padding={padding}
          count={gridY}
          start={min_y}
          end={max_y}
          precision={precision}
        />
      )}

      {gridX && (
        <VerticalGrid
          color="#888"
          padding={padding}
          width={width}
          height={height}
          count={gridX}
        />
      )}

      {gridY && (
        <HorizontalGrid
          color="#888"
          padding={padding}
          width={width}
          height={inner_height}
          count={gridY}
        />
      )}

      {data.map((datum, index) => (
        <polyline
          key={index.toString()}
          fill="none"
          stroke={
            index === highlight
              ? datum.color
              : typeof highlight === "number"
              ? "#404040"
              : datum.color
          }
          strokeWidth={1}
          strokeOpacity={highlight === null || highlight === index ? 1 : 0.2}
          points={generate_points(datum)}
        />
      ))}

      {data.map((datum, datum_index) => (
        <React.Fragment key={datum_index.toString()}>
          {datum.points.map((point, index) => (
            <circle
              key={index.toString()}
              cx={normalize_x(point.x) * inner_width + padding}
              cy={inner_height - normalize_y(point.y) * inner_height + padding}
              r={1.5}
              strokeWidth={0.5}
              stroke={
                typeof point.y === "number" || highlight === datum_index
                  ? "#f0f0f0"
                  : "#303030"
              }
              fill={
                typeof point.y === "number" || highlight === datum_index
                  ? datum.color
                  : "#404040"
              }
              fillOpacity={
                highlight === null || highlight === datum_index ? 1 : 0.2
              }
              strokeOpacity={
                highlight === null || highlight === datum_index ? 1 : 0.2
              }
              style={{ cursor: "pointer" }}
              onMouseOver={(event) => {
                setHighlight(datum_index);
                if (onMouseOver) {
                  onMouseOver(event, datum, point);
                }
              }}
              onMouseOut={(event) => {
                setHighlight(null);
                if (onMouseOut) {
                  onMouseOut(event, datum, point);
                }
              }}
            />
          ))}
        </React.Fragment>
      ))}
    </svg>
  );
};

export default LineChart;
