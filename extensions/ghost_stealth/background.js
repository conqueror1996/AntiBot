/**
 * 🔱 GHOST-SOVEREIGNTY Background Service Worker
 * Coordinates background execution and provides a logging channel.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("🔱 [GHOST-SOVEREIGNTY] Native Service Worker Active.");
});

// Listener for logging/monitoring signals from injected scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "log") {
    console.log(`📡 [INJECT-LOG] ${message.text}`);
    sendResponse({ received: true });
  }
  return true;
});
