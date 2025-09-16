export const convertCentsToDollars = (
  value?: number | null,
  defaultValue = 0
) => {
  if (typeof value === "number") {
    // Convert cents to dollars, handling floating point precision
    return parseFloat((value / 100).toFixed(2));
  }

  return defaultValue;
};
