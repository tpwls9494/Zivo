// Jin Air — version 2026-04 (TODO: DOM 직접 확인 필요)
import type { FieldSelector } from "./types";
export const VERSION = "2026-04";

export const SELECTORS: Record<string, FieldSelector> = {
  given_name:   { autocomplete: "given-name",  label: "이름" },
  family_name:  { autocomplete: "family-name", label: "성" },
  phone:        { autocomplete: "tel" },
  birth_year:   { elementType: "select", label: "년" },
  birth_month:  { elementType: "select", label: "월" },
  birth_day:    { elementType: "select", label: "일" },
  gender_M:     { buttonText: "남", elementType: "button" },
  gender_F:     { buttonText: "여", elementType: "button" },
};
