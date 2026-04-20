// Korean Air — version 2026-04 (TODO: DOM 직접 확인 필요)
import type { FieldSelector } from "./types";
export type { FieldSelector };
export const VERSION = "2026-04";

export const SELECTORS: Record<string, FieldSelector> = {
  given_name:   { name: "firstName",  autocomplete: "given-name",  label: "이름" },
  family_name:  { name: "lastName",   autocomplete: "family-name", label: "성" },
  phone:        { name: "phone",      autocomplete: "tel" },
  birth_year:   { elementType: "select", name: "birthYear",  label: "년" },
  birth_month:  { elementType: "select", name: "birthMonth", label: "월" },
  birth_day:    { elementType: "select", name: "birthDay",   label: "일" },
  gender_M:     { id: "genderMale",   elementType: "button" },
  gender_F:     { id: "genderFemale", elementType: "button" },
};
