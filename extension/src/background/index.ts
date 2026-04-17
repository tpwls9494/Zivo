/// <reference types="chrome" />

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[Zivo] installed:", details.reason);
});

// Content script 에서 프로필 요청 시 chrome.storage.sync 에서 읽어 응답
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_PROFILE") {
    void chrome.storage.sync.get("zivo:profile").then((result) => {
      sendResponse({ profile: result["zivo:profile"] ?? null });
    });
    return true; // async response
  }
});

export {};
