"use client";

import type React from "react";

import { useEffect, useState } from "react";
import type { CalendarEvent } from "@/components/calendar/schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface EventDialogProps {
  event?: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  defaultDate?: Date;
  defaultHour?: number;
}

export function EventDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  defaultDate,
  defaultHour = 9,
}: EventDialogProps) {
  const [formData, setFormData] = useState(() => {
    if (event) {
      return {
        title: event.title,
        description: event.description || "",
        start: event.start.toISOString().slice(0, 16),
        end: event.end.toISOString().slice(0, 16),
        allDay: event.allDay || false,
        color: event.color || "#0891b2",
      };
    }

    const start = defaultDate ? new Date(defaultDate) : new Date();
    start.setHours(defaultHour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(defaultHour + 1, 0, 0, 0);

    return {
      title: "",
      description: "",
      start: start.toISOString().slice(0, 16),
      end: end.toISOString().slice(0, 16),
      allDay: false,
      color: "#0891b2",
    };
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || "",
        start: event.start.toISOString().slice(0, 16),
        end: event.end.toISOString().slice(0, 16),
        allDay: event.allDay || false,
        color: event.color || "#0891b2",
      });
    } else if (defaultDate) {
      const start = new Date(defaultDate);
      start.setHours(defaultHour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(defaultHour + 1, 0, 0, 0);

      setFormData({
        title: "",
        description: "",
        start: start.toISOString().slice(0, 16),
        end: end.toISOString().slice(0, 16),
        allDay: false,
        color: "#0891b2",
      });
    }
  }, [event, defaultDate, defaultHour]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) return;

    const eventData: CalendarEvent = {
      id: event?.id || crypto.randomUUID(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      start: new Date(formData.start),
      end: new Date(formData.end),
      allDay: formData.allDay,
      color: formData.color,
    };

    onSave(eventData);
    onClose();
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Event title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Event description (optional)"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allDay"
              checked={formData.allDay}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, allDay: checked }))
              }
            />
            <Label htmlFor="allDay">All day event</Label>
          </div>

          {!formData.allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={formData.start}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, start: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">End</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={formData.end}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, end: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, color: e.target.value }))
              }
              className="w-full h-10"
            />
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {event && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit">{event ? "Update" : "Create"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
