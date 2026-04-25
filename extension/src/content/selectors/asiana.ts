// Asiana Airlines (flyasiana.com) — version 2026-04b (확장 셀렉터)
import type { FieldSelector } from "./types";
export const VERSION = "2026-04b";

export const SELECTORS: Record<string, FieldSelector> = {
  given_name: {
    cssSelector: [
      '[autocomplete="given-name"]',
      'input[name*="givenName" i]',
      'input[name*="firstName" i]',
      'input[name*="first_name" i]',
      'input[id*="givenName" i]',
      'input[id*="firstName" i]',
      'input[placeholder*="이름" i]',
      'input[placeholder*="Given" i]',
      'input[placeholder*="First" i]',
    ].join(","),
    label: "이름",
    placeholder: "Given Name",
  },
  family_name: {
    cssSelector: [
      '[autocomplete="family-name"]',
      'input[name*="familyName" i]',
      'input[name*="lastName" i]',
      'input[name*="last_name" i]',
      'input[id*="familyName" i]',
      'input[id*="lastName" i]',
      'input[placeholder*="Family" i]',
      'input[placeholder*="Last" i]',
      'input[placeholder*="성" i]',
    ].join(","),
    label: "성",
    placeholder: "Family Name",
  },
  phone: {
    cssSelector: [
      '[autocomplete="tel"]',
      'input[name*="phone" i]',
      'input[name*="mobile" i]',
      'input[id*="phone" i]',
      'input[placeholder*="연락처" i]',
      'input[placeholder*="전화" i]',
    ].join(","),
    label: "연락처",
  },
  birth_year: {
    cssSelector: [
      'select[id*="Year" i]',
      'select[name*="Year" i]',
      'select[id*="birth" i]',
    ].join(","),
    elementType: "select",
    label: "년",
  },
  birth_month: {
    cssSelector: [
      'select[id*="Month" i]',
      'select[name*="Month" i]',
    ].join(","),
    elementType: "select",
    label: "월",
  },
  birth_day: {
    cssSelector: [
      'select[id*="Day" i]',
      'select[name*="Day" i]',
    ].join(","),
    elementType: "select",
    label: "일",
  },
  birth_date: {
    cssSelector: [
      '[autocomplete="bday"]',
      'input[type="date"][name*="birth" i]',
    ].join(","),
  },
  gender_M: {
    cssSelector: [
      'input[type="radio"][value="M"]',
      'input[type="radio"][value="MALE"]',
      'input[type="radio"][value="male"]',
      'input[type="radio"][value="1"]',
    ].join(","),
    buttonText: "남성",
  },
  gender_F: {
    cssSelector: [
      'input[type="radio"][value="F"]',
      'input[type="radio"][value="FEMALE"]',
      'input[type="radio"][value="female"]',
      'input[type="radio"][value="2"]',
    ].join(","),
    buttonText: "여성",
  },
};
