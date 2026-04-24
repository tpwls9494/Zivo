// Asiana Airlines (flyasiana.com) — version 2026-04
import type { FieldSelector } from "./types";
export const VERSION = "2026-04";

export const SELECTORS: Record<string, FieldSelector> = {
  given_name:  { autocomplete: "given-name",  label: "이름",   placeholder: "Given Name" },
  family_name: { autocomplete: "family-name", label: "성",     placeholder: "Family Name" },
  phone:       { autocomplete: "tel",         label: "연락처" },
  birth_year:  { cssSelector: 'select[id*="Year"],select[id*="year"],select[name*="Year"],select[name*="year"]', elementType: "select", label: "년" },
  birth_month: { cssSelector: 'select[id*="Month"],select[id*="month"],select[name*="Month"],select[name*="month"]', elementType: "select", label: "월" },
  birth_day:   { cssSelector: 'select[id*="Day"],select[id*="day"],select[name*="Day"],select[name*="day"]', elementType: "select", label: "일" },
  gender_M:    { cssSelector: 'input[type="radio"][value="M"],input[type="radio"][value="MALE"]' },
  gender_F:    { cssSelector: 'input[type="radio"][value="F"],input[type="radio"][value="FEMALE"]' },
};
