import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import type { Where } from "payload";
import { stringify } from "qs-esm";

/**
 * We separate the API by its parts to make cache-busting easier
 *
 * eg. /api/events/123?where[id][equals]=123 becomes
 * ["api", "events", "123", "where[id][equals]=123"]
 *
 * Then if we want to clear the cache for a specific event, we can clear the cache for the "api", "events", "123"
 */
export const constructQueryKeys = (api: string, query?: Where) => {
  const splitApi = api.split(/\/|\?/);

  return [...splitApi, query];
};

/**
 * Wraps the Payload REST API with RQ for caching
 */
export const usePayloadFetch = <Value>({
  api,
  query,
  options,
}: {
  api: string;
  query?: Where;
  // TODO: add depth, limit, select, pagination api
  options?: Omit<UseQueryOptions<Value>, "queryKey" | "queryFn">;
}) =>
  useQuery<Value>({
    queryKey: constructQueryKeys(api, query),
    queryFn: async () => {
      const data = await fetch(
        `${api}?${stringify({ where: query }, { addQueryPrefix: true })}`,
        {
          credentials: "include",
        }
      );
      return data.json();
    },
    ...options,
  });
