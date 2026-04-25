// Jeju Air (jejuair.net) — version 2026-04b (확장 셀렉터)
import type { FieldSelector } from "./types";
export const VERSION = "2026-04b";

export const SELECTORS: Record<string, FieldSelector> = {
  // 이름: autocomplete → placeholder → label → name/id 부분매칭 순으로 시도
  given_name: {
    cssSelector: [
      '[autocomplete="given-name"]',
      'input[name*="givenName" i]',
      'input[name*="firstName" i]',
      'input[name*="first_name" i]',
      'input[id*="givenName" i]',
      'input[id*="firstName" i]',
      'input[placeholder*="이름" i]',
      'input[placeholder*="given" i]',
      'input[placeholder*="first" i]',
    ].join(","),
    label: "이름",
    placeholder: "영문 이름",
  },
  family_name: {
    cssSelector: [
      '[autocomplete="family-name"]',
      'input[name*="familyName" i]',
      'input[name*="lastName" i]',
      'input[name*="last_name" i]',
      'input[id*="familyName" i]',
      'input[id*="lastName" i]',
      'input[placeholder*="성(영문)" i]',
      'input[placeholder*="last" i]',
      'input[placeholder*="family" i]',
    ].join(","),
    label: "성",
    placeholder: "영문 성",
  },
  phone: {
    cssSelector: [
      '[autocomplete="tel"]',
      'input[name*="phone" i]',
      'input[name*="mobile" i]',
      'input[name*="contact" i]',
      'input[id*="phone" i]',
      'input[placeholder*="휴대폰" i]',
      'input[placeholder*="연락처" i]',
    ].join(","),
    label: "휴대폰",
    placeholder: "휴대폰",
  },
  // 생년월일: React SPA라 id/name 패턴 다양 — 최대한 넓게
  birth_year: {
    cssSelector: [
      'select[id*="Year" i]',
      'select[name*="Year" i]',
      'select[id*="birth" i][id*="year" i]',
      'select[name*="birth" i][name*="year" i]',
      'select[placeholder*="년" i]',
    ].join(","),
    elementType: "select",
    label: "년",
  },
  birth_month: {
    cssSelector: [
      'select[id*="Month" i]',
      'select[name*="Month" i]',
      'select[id*="birth" i][id*="month" i]',
      'select[name*="birth" i][name*="month" i]',
    ].join(","),
    elementType: "select",
    label: "월",
  },
  birth_day: {
    cssSelector: [
      'select[id*="Day" i]',
      'select[name*="Day" i]',
      'select[id*="birth" i][id*="day" i]',
      'select[name*="birth" i][name*="day" i]',
    ].join(","),
    elementType: "select",
    label: "일",
  },
  // 단일 date input 대비
  birth_date: {
    cssSelector: [
      '[autocomplete="bday"]',
      'input[type="date"][name*="birth" i]',
      'input[type="date"][id*="birth" i]',
    ].join(","),
  },
  // 성별: 라디오 또는 토글 버튼
  gender_M: {
    cssSelector: [
      'input[type="radio"][value="M"]',
      'input[type="radio"][value="male"]',
      'input[type="radio"][value="MALE"]',
      'input[type="radio"][value="1"]',
    ].join(","),
    buttonText: "남성",
  },
  gender_F: {
    cssSelector: [
      'input[type="radio"][value="F"]',
      'input[type="radio"][value="female"]',
      'input[type="radio"][value="FEMALE"]',
      'input[type="radio"][value="2"]',
    ].join(","),
    buttonText: "여성",
  },
};
