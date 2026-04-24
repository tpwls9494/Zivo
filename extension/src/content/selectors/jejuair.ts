// Jeju Air (jejuair.net) — version 2026-04
import type { FieldSelector } from "./types";
export const VERSION = "2026-04";

export const SELECTORS: Record<string, FieldSelector> = {
  // label text includes "이름" (이름/영문 이름 모두 포함); placeholder도 대비
  given_name:  { autocomplete: "given-name",  label: "이름",   placeholder: "영문 이름" },
  family_name: { autocomplete: "family-name", label: "성",     placeholder: "영문 성" },
  phone:       { autocomplete: "tel",         label: "휴대폰", placeholder: "휴대폰" },
  // Jeju Air React form: id may be "birthYear_0", "birthYear_1", ... — id*= matches all
  birth_year:  {
    cssSelector: 'select[id*="Year"],select[id*="year"],select[name*="Year"],select[name*="year"],select[name*="birthYear"]',
    elementType: "select",
    label: "년",
  },
  birth_month: {
    cssSelector: 'select[id*="Month"],select[id*="month"],select[name*="Month"],select[name*="month"],select[name*="birthMonth"]',
    elementType: "select",
    label: "월",
  },
  birth_day:   {
    cssSelector: 'select[id*="Day"],select[id*="day"],select[name*="Day"],select[name*="day"],select[name*="birthDay"]',
    elementType: "select",
    label: "일",
  },
  gender_M:    { cssSelector: 'input[type="radio"][value="M"],input[type="radio"][value="male"],input[type="radio"][value="MALE"]', buttonText: "남성" },
  gender_F:    { cssSelector: 'input[type="radio"][value="F"],input[type="radio"][value="female"],input[type="radio"][value="FEMALE"]', buttonText: "여성" },
};
