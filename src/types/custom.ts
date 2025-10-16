import type { CollectionSlug } from "payload";
import type React from "react";
import type { Config } from "@/payload-types";

export type UTCDateString = string;

/**
 * Types the `data` prop of a custom field component
 */
export type TypedFieldComponent<
  TComponent extends Record<string, any> & { data?: any },
  TData extends Config["collections"][CollectionSlug],
> = React.ComponentType<TComponent & { data: TData }>;

/**
 * XOR (exclusive or) type utility.
 *
 * This type ensures that either type T or type U is used, but not both at the same time.
 * It is useful for props or objects where you want to enforce that only one of two possible sets of properties is present.
 *
 * For example:
 *   type A = { foo: string };
 *   type B = { bar: number };
 *   type OnlyAOrB = XOR<A, B>;
 *
 *   // Valid: { foo: "hello" }
 *   // Valid: { bar: 42 }
 *   // Invalid: { foo: "hello", bar: 42 }
 */
export type XOR<T, U> =
  | (T & { [K in keyof U]?: never })
  | (U & { [K in keyof T]?: never });
