// JAL — version 2026-04 (TODO: DOM 직접 확인 필요)
import type { FieldSelector } from "./types";
export const VERSION = "2026-04";

export const SELECTORS: Record<string, FieldSelector> = {
  given_name:   { name: "firstName",  autocomplete: "given-name",  placeholder: "Given Name" },
  family_name:  { name: "lastName",   autocomplete: "family-name", placeholder: "Family Name" },
  phone:        { name: "phone",      autocomplete: "tel" },
  birth_year:   { elementType: "select", name: "birthYear",  label: "Year" },
  birth_month:  { elementType: "select", name: "birthMonth", label: "Month" },
  birth_day:    { elementType: "select", name: "birthDay",   label: "Day" },
  gender_M:     { id: "genderMale",   elementType: "button" },
  gender_F:     { id: "genderFemale", elementType: "button" },
};
