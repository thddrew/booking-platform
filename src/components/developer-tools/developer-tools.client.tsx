"use client";

import { Wrench } from "lucide-react";
import { useParams } from "next/navigation";
import type { CollectionSlug } from "payload";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { CreateBookingTools, EditBookingTools } from "./bookings";

/**
 * Gets the collection name from the path
 * eg. /admin/collections/bookings/create -> bookings
 */
const getCollectionName = (segments: string[]) => {
  if (!segments) return null;
  const [prefix, collection, collectionIdOrAction] = segments;

  // For now, we only support tools in 'collections'
  if (prefix !== "collections") return null;

  type CollectionId =
    | null
    | (string & { readonly __collectionId: unique symbol });

  return [
    collection as CollectionSlug,
    collectionIdOrAction as CollectionId,
  ] as const;
};

export function DeveloperToolsClient() {
  const params = useParams<{ segments: string[] }>();
  const args = getCollectionName(params.segments);
  const [action, setAction] = useState<
    "create" | "edit" | "delete" | undefined
  >(undefined);

  useEffect(() => {
    args?.[1] ? setAction("edit") : setAction("create");
  }, [args]);

  return (
    <div className="twp fixed bottom-4 right-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            title="Developer Tools"
          >
            <Wrench />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="top"
          className="w-80 twp"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Developer Tools</h4>
              <p className="text-sm text-muted-foreground">
                Testing utilities for development
              </p>
            </div>
            <Separator />
            {args && (
              <div className="flex justify-between">
                <div className="text-sm">
                  <p>Collection: {args[0]}</p>
                  {args[1] && <small title={args[1]}>ID: {args[1]}</small>}
                </div>
                <Select
                  value={action}
                  onValueChange={(value) =>
                    setAction(value as "create" | "edit" | "delete")
                  }
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {action === "create" && <CreateBookingTools />}
            {action === "edit" && <EditBookingTools bookingId={args?.[1]} />}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
