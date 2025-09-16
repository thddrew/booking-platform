export const convertStringToArray = <T>(
  str: string,
  map?: (item: string) => T
) => {
  return str
    ? str
        .split(",")
        .map((item) => item.trim())
        .map(map ?? ((item) => item as T))
    : undefined;
};
