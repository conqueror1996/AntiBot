/**
 * 🔱 GHOST-SOVEREIGNTY Content Script (MAIN World Injection)
 * Implements browser-native anti-fingerprinting and stealth bypasses.
 */

(function() {
    'use strict';

    console.log("🔱 [GHOST-SOVEREIGNTY] Injecting Native Stealth...");

    // 1. 🛡️ WebDriver Automation Bypass
    try {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true
        });
    } catch (e) {
        console.error("⚠️ [GHOST] Failed to override webdriver:", e);
    }

    // 2. 🛡️ Chrome Runtime Spoof
    window.chrome = window.chrome || {};
    window.chrome.runtime = window.chrome.runtime || {
        id: 'cjpalhdlnbpafiamejdnhcphjbkeiagm', // Mock uBlock Origin ID to prevent extensions audit checks
        sendMessage: function() {},
        onMessage: { addListener: function() {} },
        connect: function() { return { onMessage: { addListener: function() {} }, postMessage: function() {} }; }
    };

    // 3. 🛡️ Normalize Permissions API
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

    // 4. 🛡️ Normalize Plugins & Languages
    try {
        const plugins = [
            { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
        ];
        Object.defineProperty(navigator, 'plugins', { get: () => plugins, configurable: true });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'], configurable: true });
    } catch (e) {}

    // 5. 🛡️ WebGL Spoofing (Prevent GPU-based automation fingerprinting)
    try {
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
            // UNMASKED_VENDOR_WEBGL
            if (parameter === 37445) return 'Intel Inc.';
            // UNMASKED_RENDERER_WEBGL
            if (parameter === 37446) return 'Intel(R) Iris(R) Xe Graphics';
            return getParameter.apply(this, arguments);
        };
    } catch (e) {}

    // 6. 🛡️ Hardware Concurrency Normalization
    try {
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true });
        Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true });
    } catch (e) {}

    // 7. 🛡️ Viewport Mismatch Protection
    try {
        Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth || 1920, configurable: true });
        Object.defineProperty(window, 'outerHeight', { get: () => window.innerHeight || 1080, configurable: true });
    } catch (e) {}

    // 8. 🛡️ AudioContext Anti-Stuck Wrapper
    try {
        const OldAudio = window.AudioContext || window.webkitAudioContext;
        if (OldAudio) {
            window.AudioContext = window.webkitAudioContext = function() {
                return new OldAudio();
            };
        }
    } catch (e) {}

    // 9. 🛡️ Popup & Modal Shredder (Destroys terms, maintenance or operator warning modals dynamically)
    window.addEventListener('DOMContentLoaded', () => {
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
        console.log("🔱 [GHOST-SOVEREIGNTY] Warning & Maintenance Modal Shredder Armed.");
    });

    console.log("🔱 [GHOST-SOVEREIGNTY] Stealth Engine Fully Ignited.");
})();
