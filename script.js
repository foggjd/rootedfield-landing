const ATTRIBUTION_STORAGE_KEY = 'rootedfield_first_touch';
const ATTRIBUTION_PARAM_MAP = {
  attribution_id: 'rf_attribution_id',
  source: 'rf_source',
  medium: 'rf_medium',
  campaign: 'rf_campaign',
  content: 'rf_content',
  term: 'rf_term',
  referrer: 'rf_referrer',
  landing_page: 'rf_landing_page',
  first_touch_at: 'rf_first_touch_at'
};

function cleanAttributionValue(value, maxLength = 200) {
  return String(value || '').trim().slice(0, maxLength);
}

function classifyReferrer(hostname) {
  const host = hostname.replace(/^www\./, '').toLowerCase();
  const searchEngines = ['google.', 'bing.com', 'duckduckgo.com', 'search.yahoo.', 'ecosia.org', 'brave.com', 'yandex.'];
  const aiAssistants = ['chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'claude.ai', 'gemini.google.com', 'copilot.microsoft.com', 'poe.com'];
  if (aiAssistants.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
    return { source: host, medium: 'ai_assistant' };
  }
  if (searchEngines.some((domain) => host.includes(domain))) {
    return { source: host, medium: 'organic' };
  }
  return { source: host || 'direct', medium: host ? 'referral' : 'none' };
}

function createAttributionId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return `rf_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function captureFirstTouchAttribution() {
  try {
    const existing = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (existing) return JSON.parse(existing);
  } catch (_) {
    // Storage may be disabled; the current visit can still be attributed.
  }

  const params = new URLSearchParams(window.location.search);
  let referrerHost = '';
  try {
    const referrerUrl = document.referrer ? new URL(document.referrer) : null;
    if (referrerUrl && referrerUrl.hostname !== window.location.hostname) referrerHost = referrerUrl.hostname;
  } catch (_) {
    referrerHost = '';
  }
  const inferred = classifyReferrer(referrerHost);
  const attribution = {
    attribution_id: createAttributionId(),
    source: cleanAttributionValue(params.get('utm_source') || inferred.source, 100),
    medium: cleanAttributionValue(params.get('utm_medium') || inferred.medium, 100),
    campaign: cleanAttributionValue(params.get('utm_campaign'), 150),
    content: cleanAttributionValue(params.get('utm_content'), 150),
    term: cleanAttributionValue(params.get('utm_term'), 150),
    referrer: cleanAttributionValue(referrerHost, 150),
    landing_page: cleanAttributionValue(window.location.pathname, 300),
    first_touch_at: new Date().toISOString()
  };
  try {
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  } catch (_) {
    // Continue without persistence when storage is unavailable.
  }
  return attribution;
}

const firstTouchAttribution = captureFirstTouchAttribution();

document.querySelectorAll('a[href]').forEach((link) => {
  try {
    const url = new URL(link.href, window.location.href);
    if (url.hostname !== 'app.rootedfield.com') return;
    Object.entries(ATTRIBUTION_PARAM_MAP).forEach(([field, parameter]) => {
      const value = firstTouchAttribution[field];
      if (value) url.searchParams.set(parameter, value);
    });
    if (link.dataset.cta) url.searchParams.set('rf_cta', cleanAttributionValue(link.dataset.cta, 100));
    link.href = url.toString();
  } catch (_) {
    // Leave malformed or unsupported links untouched.
  }
});

document.getElementById('year').textContent = new Date().getFullYear();

const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

menuButton.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

siteNav.addEventListener('click', () => {
  siteNav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
});

document.querySelectorAll('[data-cta]').forEach((link) => {
  link.addEventListener('click', () => {
    trackEvent('start_trial_click', {
      page_path: window.location.pathname,
      page_location: window.location.href,
      page_title: document.title,
      cta_location: link.dataset.cta,
      source: firstTouchAttribution.source,
      medium: firstTouchAttribution.medium,
      referrer: firstTouchAttribution.referrer
    });
  });
});
