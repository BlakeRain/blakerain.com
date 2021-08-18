import { parseISO, format } from "date-fns";
import { FC } from "react";

export const DateSpan: FC<{ date: string }> = ({ date }) => {
  return <span>{format(parseISO(date), "d LLL yyyy")}</span>;
};
