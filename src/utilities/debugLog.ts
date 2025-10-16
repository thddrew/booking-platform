export const debugLog = (...args: unknown[]) => {
  if (process.env.PAYLOAD_DEBUG === "true") {
    console.log(...args);
  }
};
