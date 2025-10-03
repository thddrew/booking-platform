export const isDate = (value: any): value is Date => {
  return value instanceof Date;
};

/**
 * Returns the ISO string of a date if it is a date, otherwise returns the value.
 */
export const getDateString = (value: any) =>
  isDate(value) ? value.toISOString() : value;
