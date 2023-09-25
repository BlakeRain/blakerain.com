export function formatNumber(value, thousands, places, prefix, suffix) {
  const aval = Math.abs(value);
  const neg = value < 0;

  const formatter = new Intl.NumberFormat(undefined, {
    style: "decimal",
    useGrouping: thousands ? "always" : false,
    minimumFractionDigits: places,
  });

  const res =
    (neg ? "-" : "") + (prefix || "") + formatter.format(aval) + (suffix || "");

  return res;
}
