export const debugLog = (...args: any[]) => {
  if (process.env.DEBUG === "true") {
    console.log(...args);
  }
};
