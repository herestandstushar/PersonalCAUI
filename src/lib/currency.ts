/**
 * Currency formatting utilities.
 */

const CURRENCY_FORMATTERS: Record<string, Intl.NumberFormat> = {};

function getFormatter(currencyCode: string = "USD"): Intl.NumberFormat {
  if (!CURRENCY_FORMATTERS[currencyCode]) {
    try {
      CURRENCY_FORMATTERS[currencyCode] = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    } catch {
      CURRENCY_FORMATTERS[currencyCode] = new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }
  }
  return CURRENCY_FORMATTERS[currencyCode];
}

export function formatCurrency(
  amount: number,
  currencyCode: string = "USD"
): string {
  return getFormatter(currencyCode).format(amount);
}

export function formatCompactCurrency(
  amount: number,
  currencyCode: string = "USD"
): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (absAmount >= 10000000) {
    return `${sign}${formatCurrency(absAmount / 10000000, currencyCode).replace(/\.00$/, "")}Cr`;
  }
  if (absAmount >= 100000) {
    return `${sign}${formatCurrency(absAmount / 100000, currencyCode).replace(/\.00$/, "")}L`;
  }
  if (absAmount >= 1000) {
    return `${sign}${formatCurrency(absAmount / 1000, currencyCode).replace(/\.00$/, "")}K`;
  }
  return `${sign}${formatCurrency(absAmount, currencyCode)}`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}
