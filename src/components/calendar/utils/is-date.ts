export const isDate = (value: any): value is Date => {
  return value instanceof Date;
};

export const getDateString = (value: any) =>
  isDate(value) ? value.toISOString() : value;
