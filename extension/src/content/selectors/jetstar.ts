// Jetstar Japan (jetstar.com) — version 2026-04
import type { FieldSelector } from "./types";
export const VERSION = "2026-04";

export const SELECTORS: Record<string, FieldSelector> = {
  given_name:  { autocomplete: "given-name",  name: "firstName",  placeholder: "First name" },
  family_name: { autocomplete: "family-name", name: "lastName",   placeholder: "Last name" },
  phone:       { autocomplete: "tel",         name: "phoneNumber", placeholder: "Phone number" },
  birth_year:  { cssSelector: 'select[id*="year"],select[name*="year"],select[data-ref*="year"]', elementType: "select", label: "Year" },
  birth_month: { cssSelector: 'select[id*="month"],select[name*="month"],select[data-ref*="month"]', elementType: "select", label: "Month" },
  birth_day:   { cssSelector: 'select[id*="day"],select[name*="day"],select[data-ref*="day"]', elementType: "select", label: "Day" },
  gender_M:    { cssSelector: 'input[type="radio"][value="Male"],input[type="radio"][value="M"]', buttonText: "Male" },
  gender_F:    { cssSelector: 'input[type="radio"][value="Female"],input[type="radio"][value="F"]', buttonText: "Female" },
};
