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
