/**
 * 🔱 GHOST-SOVEREIGNTY Background Service Worker
 * Manages proxy configuration dynamically and handles authentication events.
 */

let proxyUser = "";
let proxyPass = "";

chrome.runtime.onInstalled.addListener(() => {
  console.log("🔱 [GHOST-SOVEREIGNTY] Native Service Worker Active.");
  loadStoredProxySettings();
});

// Load stored settings on start
function loadStoredProxySettings() {
  chrome.storage.local.get(['proxy_enabled', 'proxy_host', 'proxy_port', 'proxy_user', 'proxy_pass'], (res) => {
    if (res.proxy_enabled && res.proxy_host && res.proxy_port) {
      applyProxy(res.proxy_host, res.proxy_port, res.proxy_user, res.proxy_pass);
    } else {
      clearProxy();
    }
  });
}

// Apply proxy via Chrome Settings API
function applyProxy(host, port, user, pass) {
  proxyUser = user || "";
  proxyPass = pass || "";

  const config = {
    mode: "fixed_servers",
    rules: {
      singleProxy: {
        scheme: "http",
        host: host,
        port: parseInt(port)
      },
      bypassList: ["localhost", "127.0.0.1", "<<local>>"]
    }
  };

  chrome.proxy.settings.set(
    { value: config, scope: "regular" },
    () => {
      console.log(`📡 [PROXY] Route configured: ${host}:${port}`);
    }
  );
}

// Clear proxy configurations
function clearProxy() {
  proxyUser = "";
  proxyPass = "";
  chrome.proxy.settings.clear({ scope: "regular" }, () => {
    console.log("📡 [PROXY] Dynamic proxy settings cleared.");
  });
}

// Listen to Proxy Auth requests (Supports credentials in MV3)
chrome.webRequest.onAuthRequired.addListener(
  (details) => {
    if (details.isProxy && proxyUser && proxyPass) {
      return {
        authCredentials: {
          username: proxyUser,
          password: proxyPass
        }
      };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Message broker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "update_proxy") {
    if (message.enabled) {
      applyProxy(message.host, message.port, message.user, message.pass);
      sendResponse({ status: "applied" });
    } else {
      clearProxy();
      sendResponse({ status: "cleared" });
    }
  }
  return true;
});
