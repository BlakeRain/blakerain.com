import React, { FC } from "react";

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

  for (let x = padding + step, index = 0; index < count; ++index, x += step) {
    lines.push(
      <polyline
        key={index.toString()}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
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

  for (
    let y = height - step + padding, index = 0;
    index < count;
    ++index, y -= step
  ) {
    lines.push(
      <polyline
        key={index.toString()}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
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
}> = ({ color, fontSize, x, padding, height, count, end, precision }) => {
  const step = height / count;
  const labels = [];

  for (
    let y = height + padding + fontSize / 3, index = 0;
    index <= count;
    ++index, y -= step
  ) {
    labels.push(
      <text
        key={index.toString()}
        x={x}
        y={y}
        textAnchor="end"
        style={{
          fill: color,
          fontSize,
          fontFamily: "Helvetica",
        }}
      >
        {(end * (index / count)).toFixed(precision)}
      </text>
    );
  }

  return <React.Fragment>{labels}</React.Fragment>;
};

export interface ChartData {
  label?: string;
  x: number;
  y?: number;
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

  data.forEach((datum, index) => {
    min_x = Math.min(min_x, datum.x);
    max_x = Math.max(max_x, datum.x);

    if (typeof datum.y === "number") {
      min_y = Math.min(min_y, datum.y);
      max_y = Math.max(max_y, datum.y);
    } else {
      min_y = Math.min(min_y, 0);
      max_y = Math.max(max_y, 0);
    }
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
  precision?: number;
  onMouseOver?: (event: React.MouseEvent, data: ChartData) => void;
  onMouseOut?: (event: React.MouseEvent, data: ChartData) => void;
}> = ({
  data,
  width,
  height,
  gridX,
  gridY,
  precision,
  onMouseOver,
  onMouseOut,
}) => {
  const { min_x, min_y, max_x, max_y, range_x, range_y } =
    getChartDataBounds(data);
  const font_size = width / 50;
  const y_axis_spacing = 1 + max_y.toFixed(precision).length;
  const padding = (font_size + y_axis_spacing) * 3;
  const inner_width = width - 2 * padding;
  const inner_height = height - 2 * padding;

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

  const points = data
    .map(
      (datum) =>
        `${normalize_x(datum.x) * inner_width + padding},${
          inner_height - normalize_y(datum.y) * inner_height + padding
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

      {data.map((element, index) => (
        <text
          key={index.toString()}
          x={normalize_x(element.x) * inner_width + padding}
          y={height - padding + font_size * 2}
          textAnchor="middle"
          style={{
            fill: "#808080",
            fontSize: font_size,
            fontFamily: "Helvetica",
          }}
        >
          {element.label}
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

      <polyline fill="none" stroke="#0074d9" strokeWidth={1} points={points} />

      {data.map((datum, index) => (
        <React.Fragment key={index.toString()}>
          <circle
            cx={normalize_x(datum.x) * inner_width + padding}
            cy={inner_height - normalize_y(datum.y) * inner_height + padding}
            r={1.5}
            strokeWidth={0.5}
            stroke={typeof datum.y === "number" ? "#f0f0f0" : "#303030"}
            fill={typeof datum.y === "number" ? "#0074d9" : "#404040"}
            style={{ cursor: "pointer" }}
            onMouseOver={(event) => {
              if (onMouseOver) {
                onMouseOver(event, datum);
              }
            }}
            onMouseOut={(event) => {
              if (onMouseOut) {
                onMouseOut(event, datum);
              }
            }}
          />
        </React.Fragment>
      ))}
    </svg>
  );
};

export default LineChart;
