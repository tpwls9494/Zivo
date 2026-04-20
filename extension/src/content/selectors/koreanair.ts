// Korean Air — verified 2026-04
import type { FieldSelector } from "./types";
export type { FieldSelector };
export const VERSION = "2026-04";

export const SELECTORS: Record<string, FieldSelector> = {
  given_name:   { autocomplete: "given-name" },
  family_name:  { autocomplete: "family-name" },
  phone:        { autocomplete: "tel" },
  birth_year:   { cssSelector: 'select[id^="ke-date-select-year"]',  elementType: "select" },
  birth_month:  { cssSelector: 'select[id^="ke-date-select-month"]', elementType: "select" },
  birth_day:    { cssSelector: 'select[id^="ke-date-select-day"]',   elementType: "select" },
  gender_M:     { cssSelector: 'select[id^="sel-gender-"]', elementType: "select", value: "male" },
  gender_F:     { cssSelector: 'select[id^="sel-gender-"]', elementType: "select", value: "female" },
};
