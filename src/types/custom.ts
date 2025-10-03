import { Config } from "@/payload-types";
import { CollectionSlug } from "payload";
import React from "react";

export type UTCDateString = string;

/**
 * Types the `data` prop of a custom field component
 */
export type TypedFieldComponent<
  TComponent extends Record<string, any> & { data?: any },
  TData extends Config["collections"][CollectionSlug],
> = React.ComponentType<TComponent & { data: TData }>;

export type XOR<T, U> =
  | (T & { [K in keyof U]?: never })
  | (U & { [K in keyof T]?: never });
