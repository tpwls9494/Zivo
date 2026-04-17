// JAL booking form selectors — tested against jal.co.jp as of 2026-04
export const VERSION = "2026-04";

export interface FieldSelector {
  label?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  type?: string;
}

export const SELECTORS: Record<string, FieldSelector> = {
  given_name: { name: "firstName", placeholder: "Given Name" },
  family_name: { name: "lastName", placeholder: "Family Name" },
  birth_date: { name: "dateOfBirth", type: "date", label: "Date of Birth" },
  gender_M: { id: "genderMale" },
  gender_F: { id: "genderFemale" },
};
