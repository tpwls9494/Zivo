"use client";

import { useEffect } from "react";
import { getOrCreateDeviceId } from "@/lib/deviceId";

export default function DeviceIdInit() {
  useEffect(() => {
    getOrCreateDeviceId();
  }, []);
  return null;
}
