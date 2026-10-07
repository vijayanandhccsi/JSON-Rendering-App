import { Monitor, Smartphone, Tablet } from "lucide-react";

export const DEVICES = [
  { id: "mobile", label: "Mobile", width: 390, Glyph: Smartphone },
  { id: "tablet", label: "Tablet", width: 768, Glyph: Tablet },
  { id: "desktop", label: "Desktop", width: 1280, Glyph: Monitor },
] as const;

export type DeviceId = (typeof DEVICES)[number]["id"];

export function isDeviceId(value: string): value is DeviceId {
  return DEVICES.some((device) => device.id === value);
}
