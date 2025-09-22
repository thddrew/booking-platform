import { usePayloadAPI as usePayloadAPIBase } from "@payloadcms/ui";

/**
 * A wrapper around usePayloadAPI that provides typescript generics
 */
export const usePayloadAPI = <Value>(
  ...args: Parameters<typeof usePayloadAPIBase>
) => {
  const [{ data, ...rest }, ret2] = usePayloadAPIBase(...args);
  return [{ data: data as Value, ...rest }, ret2] as const;
};
