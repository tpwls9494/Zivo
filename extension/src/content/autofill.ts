/// <reference types="chrome" />

import type { FieldSelector } from "./selectors/koreanair";
import { SELECTORS as KE_SELECTORS } from "./selectors/koreanair";
import { SELECTORS as JL_SELECTORS } from "./selectors/jal";

interface ProfileCache {
  passport_given_name?: string;
  passport_family_name?: string;
  birth_date?: string;
  gender?: "M" | "F";
  phone?: string;
}

type SelectorMap = Record<string, FieldSelector>;

function getSelectorMap(): SelectorMap | null {
  const host = location.hostname;
  if (host.includes("koreanair.com")) return KE_SELECTORS;
  if (host.includes("jal.co.jp")) return JL_SELECTORS;
  return null;
}

function findInput(sel: FieldSelector): HTMLInputElement | null {
  // 1) name attribute
  if (sel.name) {
    const el = document.querySelector<HTMLInputElement>(`input[name="${sel.name}"]`);
    if (el) return el;
  }
  // 2) id attribute
  if (sel.id) {
    const el = document.getElementById(sel.id) as HTMLInputElement | null;
    if (el?.tagName === "INPUT") return el;
  }
  // 3) placeholder fuzzy match
  if (sel.placeholder) {
    const inputs = document.querySelectorAll<HTMLInputElement>("input");
    for (const input of inputs) {
      if (input.placeholder?.toLowerCase().includes(sel.placeholder.toLowerCase())) return input;
    }
  }
  // 4) label text fuzzy match
  if (sel.label) {
    const labels = document.querySelectorAll<HTMLLabelElement>("label");
    for (const label of labels) {
      if (label.textContent?.includes(sel.label)) {
        const forId = label.htmlFor;
        if (forId) return document.getElementById(forId) as HTMLInputElement | null;
        return label.querySelector<HTMLInputElement>("input");
      }
    }
  }
  return null;
}

function fillInput(input: HTMLInputElement, value: string) {
  // Trigger React/Vue synthetic events so the framework picks up the change
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  nativeSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
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

  const fieldMap: Array<{ key: keyof SelectorMap; value: string | undefined }> = [
    { key: "given_name", value: profile.passport_given_name },
    { key: "family_name", value: profile.passport_family_name },
    { key: "birth_date", value: profile.birth_date },
  ];

  for (const { key, value } of fieldMap) {
    if (!value || !selectors[key]) continue;
    const input = findInput(selectors[key]);
    if (input) { fillInput(input, value); filled++; }
  }

  // Gender radio
  if (profile.gender) {
    const genderKey = `gender_${profile.gender}` as keyof SelectorMap;
    const radioSel = selectors[genderKey];
    if (radioSel) {
      const radio = findInput(radioSel) as HTMLInputElement | null;
      if (radio) { radio.checked = true; radio.dispatchEvent(new Event("change", { bubbles: true })); filled++; }
    }
  }

  return filled;
}

async function run() {
  const selectors = getSelectorMap();
  if (!selectors) return;

  const profile = await getProfile();
  if (!profile) {
    showToast("Zivo: 저장된 프로필이 없습니다. 익스텐션에서 프로필을 먼저 입력해주세요.");
    return;
  }

  let filled = applyProfile(profile, selectors);

  // MutationObserver: 동적으로 렌더링되는 폼 필드 대응
  if (filled === 0) {
    let attempts = 0;
    const observer = new MutationObserver(() => {
      attempts++;
      filled = applyProfile(profile, selectors);
      if (filled > 0 || attempts > 20) {
        observer.disconnect();
        if (filled > 0) showToast(`Zivo: ${filled}개 항목을 자동 입력했습니다.`);
        else showToast("Zivo: 입력 필드를 찾지 못했습니다. 직접 입력해주세요.");
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    showToast(`Zivo: ${filled}개 항목을 자동 입력했습니다.`);
  }
}

void run();
