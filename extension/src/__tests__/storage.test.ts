import { describe, it, expect } from "vitest";
import {
  loadDefaults,
  saveDefaults,
  getOrCreateDeviceId,
  loadProfileCache,
  saveProfileCache,
} from "../lib/storage";

describe("storage — defaults", () => {
  it("returns null when empty", async () => {
    expect(await loadDefaults()).toBeNull();
  });

  it("saves and loads defaults", async () => {
    await saveDefaults({ origin: "ICN", destination: "KIX" });
    const d = await loadDefaults();
    expect(d?.origin).toBe("ICN");
    expect(d?.destination).toBe("KIX");
  });

  it("merges patch into existing defaults", async () => {
    await saveDefaults({ origin: "ICN" });
    await saveDefaults({ destination: "NRT" });
    const d = await loadDefaults();
    expect(d?.origin).toBe("ICN");
    expect(d?.destination).toBe("NRT");
  });
});

describe("storage — deviceId", () => {
  it("creates deviceId on first call", async () => {
    const id = await getOrCreateDeviceId();
    expect(id).toBeTruthy();
  });

  it("returns same deviceId on repeated calls", async () => {
    const id1 = await getOrCreateDeviceId();
    const id2 = await getOrCreateDeviceId();
    expect(id1).toBe(id2);
  });
});

describe("storage — profileCache", () => {
  it("returns null when empty", async () => {
    expect(await loadProfileCache()).toBeNull();
  });

  it("saves and loads profile cache", async () => {
    await saveProfileCache({ passport_given_name: "SEJIN", phone: "010-0000-0000" });
    const c = await loadProfileCache();
    expect(c?.passport_given_name).toBe("SEJIN");
    expect(c?.phone).toBe("010-0000-0000");
  });

  it("strips passport_number from cache (security rule)", async () => {
    // @ts-expect-error intentionally passing passport_number
    await saveProfileCache({ passport_given_name: "TEST", passport_number: "M12345678" });
    const c = await loadProfileCache();
    expect(c?.passport_given_name).toBe("TEST");
    expect((c as Record<string, unknown>)?.passport_number).toBeUndefined();
  });

  it("strips passport_expiry from cache (security rule)", async () => {
    // @ts-expect-error intentionally passing passport_expiry
    await saveProfileCache({ passport_given_name: "TEST", passport_expiry: "2030-01-01" });
    const c = await loadProfileCache();
    expect((c as Record<string, unknown>)?.passport_expiry).toBeUndefined();
  });

  it("merges patch into existing cache", async () => {
    await saveProfileCache({ passport_given_name: "SEJIN" });
    await saveProfileCache({ phone: "010-1234-5678" });
    const c = await loadProfileCache();
    expect(c?.passport_given_name).toBe("SEJIN");
    expect(c?.phone).toBe("010-1234-5678");
  });
});
