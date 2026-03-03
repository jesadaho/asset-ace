import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** LINE User ID (UID) is internal and cannot be used for friend search / ti/p links. Format: U + long hex. */
export function isLineUid(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const s = value.trim();
  return s.length >= 33 && /^U[0-9a-f]+$/i.test(s);
}
