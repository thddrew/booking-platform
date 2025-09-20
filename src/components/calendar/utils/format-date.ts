const formatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
  timeStyle: "short",
});

const compactFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "short",
  timeStyle: "short",
});

export const formatDate = (date: Date) => {
  return formatter.format(date);
};

export const formatDateRange = (start: Date, end: Date) => {
  return formatter.formatRange(start, end);
};

export const formatCompactDate = (date: Date) => {
  return compactFormatter.format(date);
};

export const formatCompactDateRange = (start: Date, end: Date) => {
  return formatter.formatRange(start, end);
};
