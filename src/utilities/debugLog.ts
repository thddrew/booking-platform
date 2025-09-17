export const debugLog = (...args: any[]) => {
  if (process.env.PAYLOAD_DEBUG === "true") {
    console.log(...args);
  }
};
