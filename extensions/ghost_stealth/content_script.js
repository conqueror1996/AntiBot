/**
 * 🔱 GHOST-SOVEREIGNTY Content Script - Advanced v3 (content_script.js)
 * Implements dynamic stealth spoofing, client settings sync, and API overrides.
 */

(function() {
    'use strict';

    let currentSettings = {
        'stealth-masking-toggle': true,
        'modal-shredder-toggle': true,
        'adv-user-agent-profile': 'default',
        'adv-custom-ua': '',
        'adv-hardware-concurrency': 8,
        'adv-device-memory': 8,
        'adv-gpu-vendor': 'Intel Inc.',
        'adv-gpu-renderer': 'Intel(R) Iris(R) Xe Graphics'
    };

    // Load initial config from local storage immediately on script runtime start
    try {
        chrome.storage.local.get(Object.keys(currentSettings), (res) => {
            if (res) {
                currentSettings = { ...currentSettings, ...res };
                applyStealthShield();
            }
        });
    } catch (e) {
        applyStealthShield();
    }

    // Sync settings dynamically during run-time changes from popup interface
    try {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "sync_settings" && message.settings) {
                currentSettings = { ...currentSettings, ...message.settings };
                applyStealthShield();
                sendResponse({ synced: true });
            }
            return true;
        });
    } catch (e) {}

    function applyStealthShield() {
        if (!currentSettings['stealth-masking-toggle']) return;

        // 1. 🛡️ WebDriver Bypass
        try {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
                configurable: true
            });
        } catch (e) {}

        // 2. 🛡️ User-Agent Profile Override (Webpage Context Interface)
        try {
            let selectedUA = '';
            if (currentSettings['adv-user-agent-profile'] === 'chrome-windows') {
                selectedUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
            } else if (currentSettings['adv-user-agent-profile'] === 'chrome-mac') {
                selectedUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
            } else if (currentSettings['adv-user-agent-profile'] === 'safari-ios') {
                selectedUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1';
            } else if (currentSettings['adv-user-agent-profile'] === 'chrome-android') {
                selectedUA = 'Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';
            }

            if (currentSettings['adv-custom-ua']) {
                selectedUA = currentSettings['adv-custom-ua'];
            }

            if (selectedUA) {
                Object.defineProperty(navigator, 'userAgent', {
                    get: () => selectedUA,
                    configurable: true
                });
            }
        } catch (e) {}

        // 3. 🛡️ Hardware & GPU Overrides
        try {
            const cores = parseInt(currentSettings['adv-hardware-concurrency']) || 8;
            Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => cores, configurable: true });

            const memory = parseInt(currentSettings['adv-device-memory']) || 8;
            Object.defineProperty(navigator, 'deviceMemory', { get: () => memory, configurable: true });
        } catch (e) {}

        // WebGL parameter intercepts
        try {
            const getParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(parameter) {
                // UNMASKED_VENDOR_WEBGL (37445)
                if (parameter === 37445) return currentSettings['adv-gpu-vendor'] || 'Intel Inc.';
                // UNMASKED_RENDERER_WEBGL (37446)
                if (parameter === 37446) return currentSettings['adv-gpu-renderer'] || 'Intel(R) Iris(R) Xe Graphics';
                return getParameter.apply(this, arguments);
            };
        } catch (e) {}

        // 4. 🛡️ Notification Permissions Spoofing
        try {
            const originalQuery = window.navigator.permissions?.query;
            if (originalQuery) {
                window.navigator.permissions.query = (parameters) => (
                    parameters && parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );
            }
        } catch (e) {}

        // 5. 🛡️ Browser Plugin Arrays
        try {
            const plugins = [
                { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
            ];
            Object.defineProperty(navigator, 'plugins', { get: () => plugins, configurable: true });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'], configurable: true });
        } catch (e) {}
    }

    // 6. 🛡️ Dynamic Modal & Overlay Shredder
    window.addEventListener('DOMContentLoaded', () => {
        if (!currentSettings['modal-shredder-toggle']) return;

        const style = document.createElement('style');
        style.id = 'sovereign-modal-shredder';
        style.innerHTML = `
            .maintenance-popup, .warning-overlay, .modal-backdrop, .popup-container,
            [class*="popup-backdrop"], [id*="terms-modal"], [class*="maintenance-modal"],
            .cookie-consent, #cookie-law, .ad-banner {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                z-index: -999999 !important;
            }
        `;
        document.documentElement.appendChild(style);
    });

    // Run Initial execution
    applyStealthShield();
})();
