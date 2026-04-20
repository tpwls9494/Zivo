// ANA — version 2026-04 (TODO: DOM 직접 확인 필요)
import type { FieldSelector } from "./types";
export const VERSION = "2026-04";

export const SELECTORS: Record<string, FieldSelector> = {
  given_name:   { autocomplete: "given-name",  label: "Given Name" },
  family_name:  { autocomplete: "family-name", label: "Family Name" },
  phone:        { autocomplete: "tel" },
  birth_year:   { elementType: "select", label: "Year" },
  birth_month:  { elementType: "select", label: "Month" },
  birth_day:    { elementType: "select", label: "Day" },
  gender_M:     { buttonText: "Male",   elementType: "button" },
  gender_F:     { buttonText: "Female", elementType: "button" },
};
