import { FC } from "react";

const MONTH_NAMES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export const DateSpan: FC<{ date: string }> = ({ date }) => {
  const date_obj = new Date(date);

  return (
    <span>
      {date_obj.getDate()} {MONTH_NAMES[date_obj.getMonth()]}{" "}
      {date_obj.getFullYear()}
    </span>
  );
};
