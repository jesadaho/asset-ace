import mongoose from "mongoose";
import { Property } from "@/lib/db/models/property";

export const RENT_NOTIFY_LOG_MAX = 10;

export type RentNotifyLogEntry = {
  /** ISO timestamp */
  at: string;
  kind: "rent_overdue";
  status: "success" | "error";
  channel?: "group" | "owner";
  /** YYYY-MM-DD rent period due that triggered the reminder */
  dueDate?: string;
  httpStatus?: number;
  message?: string;
};

export function buildRentNotifyLogEntry(
  partial: Omit<RentNotifyLogEntry, "at" | "kind"> & {
    kind?: RentNotifyLogEntry["kind"];
    at?: string;
  }
): RentNotifyLogEntry {
  const message = partial.message?.trim();
  return {
    at: partial.at ?? new Date().toISOString(),
    kind: partial.kind ?? "rent_overdue",
    status: partial.status,
    ...(partial.channel ? { channel: partial.channel } : {}),
    ...(partial.dueDate ? { dueDate: partial.dueDate } : {}),
    ...(partial.httpStatus != null ? { httpStatus: partial.httpStatus } : {}),
    ...(message ? { message: message.slice(0, 500) } : {}),
  };
}

export async function appendRentNotifyLog(
  propertyId: mongoose.Types.ObjectId,
  entry: RentNotifyLogEntry
): Promise<void> {
  await Property.updateOne(
    { _id: propertyId },
    {
      $push: {
        rentNotifyLogs: {
          $each: [entry],
          $slice: -RENT_NOTIFY_LOG_MAX,
        },
      },
    }
  );
}

/** Newest first for API/UI. */
export function sortRentNotifyLogsNewestFirst(
  logs: RentNotifyLogEntry[] | undefined | null
): RentNotifyLogEntry[] {
  if (!logs?.length) return [];
  return [...logs].sort((a, b) => b.at.localeCompare(a.at));
}
