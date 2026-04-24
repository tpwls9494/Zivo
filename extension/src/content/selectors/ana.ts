// ANA All Nippon Airways (ana.co.jp) — version 2026-04
import type { FieldSelector } from "./types";
export const VERSION = "2026-04";

export const SELECTORS: Record<string, FieldSelector> = {
  given_name:  { autocomplete: "given-name",  name: "firstName",  placeholder: "First name" },
  family_name: { autocomplete: "family-name", name: "lastName",   placeholder: "Last name" },
  phone:       { autocomplete: "tel",         name: "phoneNumber" },
  birth_year:  { cssSelector: 'select[id*="birthYear"],select[name*="birthYear"],select[id*="BirthYear"]', elementType: "select", label: "Year" },
  birth_month: { cssSelector: 'select[id*="birthMonth"],select[name*="birthMonth"],select[id*="BirthMonth"]', elementType: "select", label: "Month" },
  birth_day:   { cssSelector: 'select[id*="birthDay"],select[name*="birthDay"],select[id*="BirthDay"]', elementType: "select", label: "Day" },
  gender_M:    { cssSelector: 'input[type="radio"][value="M"],input[type="radio"][value="MALE"],input[type="radio"][value="male"]' },
  gender_F:    { cssSelector: 'input[type="radio"][value="F"],input[type="radio"][value="FEMALE"],input[type="radio"][value="female"]' },
};
