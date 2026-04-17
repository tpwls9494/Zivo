import { describe, it, expect, vi, beforeEach } from "vitest";
import { useProfileStore } from "../lib/store";
import * as apiModule from "../lib/api";

beforeEach(() => {
  useProfileStore.setState({
    passport_given_name: "",
    passport_family_name: "",
    birth_date: "",
    gender: "M",
    nationality: "KOR",
    phone: "",
    passport_number: "",
    passport_expiry: "",
    passport_number_masked: null,
    loading: false,
    saving: false,
    error: null,
    saved_at: null,
    exists: false,
    defaults: {
      default_origin: "ICN",
      preferred_cabin: "economy",
      adults: 1,
      baggage_preference: "any",
    },
  });
});

describe("useProfileStore — load", () => {
  it("loads profile from server and updates state", async () => {
    const fakeProfile: apiModule.ProfileResponse = {
      passport_given_name: "SEJIN",
      passport_family_name: "LEE",
      birth_date: "1990-01-01",
      gender: "M",
      nationality: "KOR",
      phone: "010-0000-0000",
      passport_number_masked: "M*****678",
      defaults: {
        default_origin: "ICN",
        preferred_cabin: "economy",
        adults: 1,
        baggage_preference: "any",
      },
    };
    vi.spyOn(apiModule.api, "getProfile").mockResolvedValue(fakeProfile);

    await useProfileStore.getState().load();

    const s = useProfileStore.getState();
    expect(s.passport_given_name).toBe("SEJIN");
    expect(s.exists).toBe(true);
    expect(s.passport_number).toBe(""); // never restored from server
    expect(s.loading).toBe(false);
  });

  it("handles empty profile (exists: false)", async () => {
    const empty: apiModule.EmptyProfileResponse = {
      exists: false,
      defaults: { default_origin: "ICN", preferred_cabin: "economy", adults: 1, baggage_preference: "any" },
    };
    vi.spyOn(apiModule.api, "getProfile").mockResolvedValue(empty);

    await useProfileStore.getState().load();

    expect(useProfileStore.getState().exists).toBe(false);
  });

  it("sets error on API failure", async () => {
    vi.spyOn(apiModule.api, "getProfile").mockRejectedValue(new Error("network error"));

    await useProfileStore.getState().load();

    expect(useProfileStore.getState().error).toBe("network error");
    expect(useProfileStore.getState().loading).toBe(false);
  });
});

describe("useProfileStore — save", () => {
  it("calls upsertProfile and clears passport fields", async () => {
    useProfileStore.setState({
      passport_given_name: "SEJIN",
      passport_family_name: "LEE",
      birth_date: "1990-01-01",
      gender: "M",
      nationality: "KOR",
      phone: "010-1234-5678",
      passport_number: "M12345678",
    });

    const fakeResponse: apiModule.ProfileResponse = {
      passport_given_name: "SEJIN",
      passport_family_name: "LEE",
      birth_date: "1990-01-01",
      gender: "M",
      nationality: "KOR",
      phone: "010-1234-5678",
      passport_number_masked: "M*****678",
      defaults: { default_origin: "ICN", preferred_cabin: "economy", adults: 1, baggage_preference: "any" },
    };
    vi.spyOn(apiModule.api, "upsertProfile").mockResolvedValue(fakeResponse);

    await useProfileStore.getState().save();

    const s = useProfileStore.getState();
    expect(s.passport_number).toBe(""); // cleared after save
    expect(s.exists).toBe(true);
    expect(s.saving).toBe(false);
  });

  it("sets error on save failure", async () => {
    vi.spyOn(apiModule.api, "upsertProfile").mockRejectedValue(new Error("save failed"));

    await useProfileStore.getState().save();

    expect(useProfileStore.getState().error).toBe("save failed");
  });
});
