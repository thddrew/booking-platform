"use client";

import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useParams } from "next/navigation";
import { CollectionSlug } from "payload";
import { CreateBookingTools } from "./bookings";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useState } from "react";

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
  const [action, setAction] = useState<"create" | "edit" | "delete">("create");

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
                <div>
                  <p>Collection: {args[0]}</p>
                  {args[1] && <p>ID: {args[1]}</p>}
                </div>
                <Select
                  defaultValue="create"
                  onValueChange={(value) =>
                    setAction(value as "create" | "edit" | "delete")
                  }
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create">Create</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {action === "create" && <CreateBookingTools />}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
