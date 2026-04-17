// Korean Air booking form selectors — tested against koreanair.com as of 2026-04
// version field lets us detect when selectors go stale
export const VERSION = "2026-04";

export interface FieldSelector {
  label?: string;         // label text (fuzzy match)
  placeholder?: string;  // input placeholder (fuzzy match)
  name?: string;         // input[name]
  id?: string;           // input[id]
  type?: string;         // input[type]
}

export const SELECTORS: Record<string, FieldSelector> = {
  given_name: { name: "firstName", label: "이름" },
  family_name: { name: "lastName", label: "성" },
  birth_date: { name: "birthDate", type: "date", label: "생년월일" },
  gender_M: { id: "genderMale" },
  gender_F: { id: "genderFemale" },
};
