/// <reference types="chrome" />

// Service Worker 엔트리. Phase 1 Day 6 에서 가격 알림 폴링 추가.

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[Zivo] installed:", details.reason);
});

// 6시간마다 깨어나 가격 알림 체크 (Day 6 에서 실제 로직 추가)
chrome.alarms.create("price-poll", { periodInMinutes: 360 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "price-poll") {
    console.log("[Zivo] price-poll tick");
  }
});

export {};
