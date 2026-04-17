import { create } from "zustand";
import { loadDefaults as loadFromStorage, saveDefaults } from "./storage";

type SearchFields = "origin" | "destination" | "depart" | "ret";

interface SearchState {
  origin: string;
  destination: string;
  depart: string;
  ret: string;
  setField: (field: SearchFields, value: string) => void;
  loadDefaults: () => Promise<void>;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  origin: "ICN",
  destination: "",
  depart: "",
  ret: "",
  setField: (field, value) => {
    set({ [field]: value } as Pick<SearchState, SearchFields>);
    void saveDefaults({
      origin: get().origin,
      destination: get().destination,
    });
  },
  loadDefaults: async () => {
    const saved = await loadFromStorage();
    if (saved) set(saved);
  },
}));
