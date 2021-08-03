import React from "react";

const monthName = (month) => {
  switch (month) {
    case 0:
      return "January";
    case 1:
      return "February";
    case 2:
      return "March";
    case 3:
      return "April";
    case 4:
      return "May";
    case 5:
      return "June";
    case 6:
      return "July";
    case 7:
      return "August";
    case 8:
      return "September";
    case 9:
      return "October";
    case 10:
      return "November";
    case 11:
      return "December";
    default:
      return "???";
  }
};

const DateSpan = ({ date }) => (
  <span>
    {date.getDate().toString()} {monthName(date.getMonth()).substr(0, 3)}{" "}
    {date.getFullYear().toString()}
  </span>
);

export default DateSpan;
