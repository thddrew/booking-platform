import type { CollectionSlug } from "payload";
import type { Config } from "@/payload-types";

type Collection = Config["collections"][CollectionSlug];

export const isCollectionObject = <
	T extends Collection | string | number | undefined | null,
>(
	objectOrID: T,
): objectOrID is T extends Collection ? T : never => {
	return objectOrID && typeof objectOrID === "object";
};
