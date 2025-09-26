import React from "react";

export type UTCDateString = string;

/**
 * Types the `data` prop of a custom field component
 */
export type TypedFieldComponent<
  TComponent extends Record<string, any> & { data?: any },
  TData,
> = React.ComponentType<TComponent & { data: TData }>;
