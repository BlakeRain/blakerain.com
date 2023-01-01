/// Pad a number with zeros to a specific length.
export function zeroPad(n: number, count: number = 2): string {
  const s = n.toString();
  if (s.length < count) {
    return new Array(count - s.length).fill("0") + s;
  } else {
    return s;
  }
}

/// Format a number
///
/// This function will format the given number to a certain number of decimal places. It will also comma-separate any
/// lengthy numbers. Numbers may also have prefixes and suffixes added to them.
export function formatNumber(
  value: number,
  places: number,
  prefix?: string,
  suffix?: string
): string {
  const aval = Math.abs(value);
  const neg = value < 0;
  var parts = aval.toFixed(places).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-" : "") + (prefix || "") + parts.join(".") + (suffix || "");
}

/// Get the ISO week for the given `Date`.
export function getISOWeek(date: Date): number {
  var d = new Date(date);
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var diff = d.getTime() - yearStart.getTime();
  return Math.ceil((diff / 86400000 + 1) / 7);
}
