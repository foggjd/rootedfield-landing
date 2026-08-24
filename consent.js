const GA_MEASUREMENT_ID = 'G-RL48W4WSTP';
const CLARITY_PROJECT_ID = 'wq7iy6zgoy';
const CONSENT_STORAGE_KEY = 'rootedfield_cookie_consent';

window.dataLayer = window.dataLayer || [];

function gtag() {
  window.dataLayer.push(arguments);
}

gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});

function loadGoogleAnalytics() {
  if (window.rootedFieldGaLoaded) return;
  window.rootedFieldGaLoaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    page_location: window.location.href,
    page_title: document.title
  });
}

// Load GA immediately in Consent Mode. While analytics storage is denied the
// tag cannot read or write analytics cookies, but it can send cookieless pings
// that improve aggregate source and conversion modelling. Microsoft Clarity
// remains fully consent-gated below.
loadGoogleAnalytics();

function loadMicrosoftClarity() {
  if (window.rootedFieldClarityLoaded) return;
  window.rootedFieldClarityLoaded = true;
  (function(c, l, a, r, i, t, y) {
    c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r);
    t.async = 1;
    t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);
}

function hideCookieBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  if (banner) banner.hidden = true;
}

function acceptAnalytics() {
  localStorage.setItem(CONSENT_STORAGE_KEY, 'analytics');
  gtag('consent', 'update', { analytics_storage: 'granted' });
  loadGoogleAnalytics();
  loadMicrosoftClarity();
  hideCookieBanner();
}

function acceptNecessaryOnly() {
  localStorage.setItem(CONSENT_STORAGE_KEY, 'necessary');
  hideCookieBanner();
}

function rejectCookies() {
  localStorage.setItem(CONSENT_STORAGE_KEY, 'rejected');
  hideCookieBanner();
}

function hasAnalyticsConsent() {
  return localStorage.getItem(CONSENT_STORAGE_KEY) === 'analytics';
}

function trackEvent(name, params = {}) {
  if (!hasAnalyticsConsent()) return;
  gtag('event', name, params);
  if (typeof clarity === 'function') clarity('event', name);
}

document.addEventListener('DOMContentLoaded', () => {
  const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (consent === 'analytics') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    loadGoogleAnalytics();
    loadMicrosoftClarity();
  } else if (!consent) {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) banner.hidden = false;
  }
});
