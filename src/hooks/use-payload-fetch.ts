import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import type { Where } from "payload";
import { stringify } from "qs-esm";

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
    queryKey: [api, query],
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
