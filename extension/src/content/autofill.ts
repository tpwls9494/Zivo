/// <reference types="chrome" />

import type { FieldSelector } from "./selectors/types";
import { SELECTORS as KE_SELECTORS } from "./selectors/koreanair";
import { SELECTORS as JL_SELECTORS } from "./selectors/jal";
import { SELECTORS as OZ_SELECTORS } from "./selectors/asiana";
import { SELECTORS as NH_SELECTORS } from "./selectors/ana";
import { SELECTORS as C7_SELECTORS } from "./selectors/jejuair";
import { SELECTORS as LJ_SELECTORS } from "./selectors/jinair";
import { SELECTORS as BX_SELECTORS } from "./selectors/airbusan";
import { SELECTORS as TW_SELECTORS } from "./selectors/tway";
import { SELECTORS as MM_SELECTORS } from "./selectors/peach";
import { SELECTORS as GK_SELECTORS } from "./selectors/jetstar";

interface ProfileCache {
  passport_given_name?: string;
  passport_family_name?: string;
  birth_date?: string; // "YYYY-MM-DD"
  gender?: "M" | "F";
  phone?: string;
}

type SelectorMap = Record<string, FieldSelector>;

function getSelectorMap(): SelectorMap | null {
  const host = location.hostname;
  if (host.includes("koreanair.com")) return KE_SELECTORS;
  if (host.includes("jal.co.jp")) return JL_SELECTORS;
  if (host.includes("flyasiana.com") || host.includes("asiana.com")) return OZ_SELECTORS;
  if (host.includes("ana.co.jp")) return NH_SELECTORS;
  if (host.includes("jejuair.net")) return C7_SELECTORS;
  if (host.includes("jinair.com")) return LJ_SELECTORS;
  if (host.includes("airbusan.com")) return BX_SELECTORS;
  if (host.includes("twayair.com")) return TW_SELECTORS;
  if (host.includes("flypeach.com")) return MM_SELECTORS;
  if (host.includes("jetstar.com")) return GK_SELECTORS;
  return null;
}

function findElement(sel: FieldSelector): HTMLElement | null {
  const elType = sel.elementType ?? "input";

  if (sel.cssSelector) {
    return document.querySelector<HTMLElement>(sel.cssSelector);
  }
  if (sel.id) {
    const el = document.getElementById(sel.id);
    if (el) return el;
  }
  if (sel.name) {
    const el = document.querySelector<HTMLElement>(`${elType}[name="${sel.name}"]`);
    if (el) return el;
  }
  if (sel.autocomplete) {
    const el = document.querySelector<HTMLElement>(`[autocomplete="${sel.autocomplete}"]`);
    if (el) return el;
  }
  if (sel.placeholder) {
    const inputs = document.querySelectorAll<HTMLInputElement>("input");
    for (const input of inputs) {
      if (input.placeholder?.toLowerCase().includes(sel.placeholder.toLowerCase())) return input;
    }
  }
  if (sel.label) {
    const labels = document.querySelectorAll<HTMLLabelElement>("label");
    for (const label of labels) {
      if (label.textContent?.trim().includes(sel.label)) {
        const forId = label.htmlFor;
        if (forId) return document.getElementById(forId);
        return label.querySelector<HTMLElement>("input, select");
      }
    }
  }
  if (sel.buttonText) {
    const candidates = document.querySelectorAll<HTMLElement>(
      "button, label, [role='radio'], [role='button']"
    );
    for (const el of candidates) {
      if (el.textContent?.trim().includes(sel.buttonText)) return el;
    }
  }
  return null;
}

function fillInput(input: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  nativeSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

// English month name → numeric string (for select options like "March", "Jan")
const MONTH_NAMES: Record<string, string> = {
  january: "1", february: "2", march: "3", april: "4", may: "5", june: "6",
  july: "7", august: "8", september: "9", october: "10", november: "11", december: "12",
  jan: "1", feb: "2", mar: "3", apr: "4", jun: "6", jul: "7",
  aug: "8", sep: "9", oct: "10", nov: "11", dec: "12",
};

function fillSelect(select: HTMLSelectElement, value: string) {
  const stripped = String(parseInt(value, 10)); // "03" → "3"
  const setOption = (val: string) => {
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    nativeSetter?.call(select, val);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  };
  // 1) exact value match (handles zero-padded "03" and plain "3")
  for (const option of select.options) {
    if (option.value === value || option.value === stripped) { setOption(option.value); return; }
  }
  // 2) text fuzzy match
  for (const option of select.options) {
    const text = option.text.replace(/\s/g, "");
    if (text.includes(value) || new RegExp(`^${stripped}[^0-9]|^${stripped}$`).test(text)) {
      setOption(option.value); return;
    }
  }
  // 3) English month name match (e.g., "March" → "3")
  for (const option of select.options) {
    const monthNum = MONTH_NAMES[option.text.trim().toLowerCase()];
    if (monthNum && (monthNum === stripped || monthNum === value)) {
      setOption(option.value); return;
    }
  }
}

function fillField(sel: FieldSelector, value: string): boolean {
  const el = findElement(sel);
  if (!el) return false;
  const actualValue = sel.value ?? value; // value 오버라이드 (gender: "M"→"male")

  if (sel.elementType === "select" || el.tagName === "SELECT") {
    fillSelect(el as HTMLSelectElement, actualValue);
    return true;
  }
  if (sel.elementType === "button") {
    (el as HTMLElement).click();
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  if (el.tagName === "INPUT") {
    const input = el as HTMLInputElement;
    if (input.type === "radio" || input.type === "checkbox") {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      fillInput(input, actualValue);
    }
    return true;
  }
  return false;
}

function showToast(message: string) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = [
    "position:fixed", "bottom:20px", "right:20px", "z-index:2147483647",
    "background:#1a1a1a", "color:#fff", "padding:10px 16px",
    "border-radius:8px", "font-size:13px", "font-family:sans-serif",
    "box-shadow:0 4px 12px rgba(0,0,0,0.3)", "pointer-events:none",
  ].join(";");
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

async function getProfile(): Promise<ProfileCache | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_PROFILE" }, (response) => {
      resolve((response?.profile as ProfileCache) ?? null);
    });
  });
}

function applyProfile(profile: ProfileCache, selectors: SelectorMap): number {
  let filled = 0;
  const [year, month, day] = (profile.birth_date ?? "").split("-");

  const fieldMap: Array<{ key: string; value: string | undefined }> = [
    { key: "given_name",   value: profile.passport_given_name },
    { key: "family_name",  value: profile.passport_family_name },
    { key: "phone",        value: profile.phone },
    { key: "birth_date",   value: profile.birth_date },
    { key: "birth_year",   value: year },
    { key: "birth_month",  value: month },
    { key: "birth_day",    value: day },
  ];

  for (const { key, value } of fieldMap) {
    if (!value || !selectors[key]) continue;
    if (fillField(selectors[key], value)) filled++;
  }

  // 성별
  if (profile.gender) {
    const genderKey = `gender_${profile.gender}`;
    if (selectors[genderKey] && fillField(selectors[genderKey], profile.gender)) filled++;
  }

  return filled;
}

async function run() {
  const selectors = getSelectorMap();
  if (!selectors) return;

  const profile = await getProfile();
  if (!profile) {
    showToast("Zivo: 저장된 프로필이 없습니다. 익스텐션에서 먼저 입력해주세요.");
    return;
  }

  let filled = applyProfile(profile, selectors);
  if (filled > 0) {
    showToast(`Zivo: ${filled}개 항목을 자동 입력했습니다.`);
    return;
  }

  // Form not yet rendered (SPA) — retry via MutationObserver + timeout fallbacks
  let settled = false;
  let mutationCount = 0;

  const resolve = (success: boolean) => {
    if (settled) return;
    settled = true;
    observer.disconnect();
    if (success) showToast(`Zivo: ${filled}개 항목을 자동 입력했습니다.`);
    else showToast("Zivo: 입력 필드를 찾지 못했습니다. 직접 입력해주세요.");
  };

  const observer = new MutationObserver(() => {
    mutationCount++;
    filled = applyProfile(profile, selectors);
    if (filled > 0) { resolve(true); return; }
    if (mutationCount >= 20) resolve(false);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Additional retries for SPAs that finish rendering without triggering mutations
  for (const delay of [500, 1500, 4000]) {
    setTimeout(() => {
      if (settled) return;
      filled = applyProfile(profile, selectors);
      if (filled > 0) resolve(true);
    }, delay);
  }
  setTimeout(() => resolve(false), 8000);
}

void run();
