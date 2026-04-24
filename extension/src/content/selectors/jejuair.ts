// Jeju Air (jejuair.net) — version 2026-04
import type { FieldSelector } from "./types";
export const VERSION = "2026-04";

export const SELECTORS: Record<string, FieldSelector> = {
  given_name:  { autocomplete: "given-name",  label: "이름",   placeholder: "이름" },
  family_name: { autocomplete: "family-name", label: "성",     placeholder: "성" },
  phone:       { autocomplete: "tel",         label: "휴대폰" },
  birth_year:  { cssSelector: 'select[id*="Year"],select[id*="year"],select[name*="Year"],select[name*="year"]', elementType: "select", label: "년" },
  birth_month: { cssSelector: 'select[id*="Month"],select[id*="month"],select[name*="Month"],select[name*="month"]', elementType: "select", label: "월" },
  birth_day:   { cssSelector: 'select[id*="Day"],select[id*="day"],select[name*="Day"],select[name*="day"]', elementType: "select", label: "일" },
  gender_M:    { cssSelector: 'input[type="radio"][value="M"],input[type="radio"][value="male"]', buttonText: "남성" },
  gender_F:    { cssSelector: 'input[type="radio"][value="F"],input[type="radio"][value="female"]', buttonText: "여성" },
};
