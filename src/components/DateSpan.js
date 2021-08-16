import React from "react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const monthName = (month) => {
  return month >= 0 && month < 12 ? MONTH_NAMES[month] : "???";
};

const DateSpan = ({ date }) => (
  <span>
    {date.getDate().toString()} {monthName(date.getMonth()).substr(0, 3)}{" "}
    {date.getFullYear().toString()}
  </span>
);

export default DateSpan;
