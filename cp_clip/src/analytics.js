import mixpanel from 'mixpanel-browser';

// The Token is injected during build time via VITE_MIXPANEL_TOKEN (e.g. from .env.local or CI/CD environment variable)
// In open-source repo, this defaults to empty string, keeping analytics safely disabled.
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || '';

let isInitialized = false;
let isOptedOut = false;

/**
 * Initialize Mixpanel Telemetry
 */
export function initAnalytics() {
  try {
    // Check if user previously opted out
    const savedOptOut = localStorage.getItem('shareclip_telemetry_opt_out');
    if (savedOptOut === 'true') {
      isOptedOut = true;
    }

    if (!MIXPANEL_TOKEN || MIXPANEL_TOKEN.trim() === '') {
      console.log('ℹ️ [Analytics] No Mixpanel Token configured. Telemetry is in pure local/disabled mode.');
      return;
    }

    mixpanel.init(MIXPANEL_TOKEN, {
      debug: import.meta.env.DEV,
      track_pageview: false,
      persistence: 'localStorage',
      ignore_dnt: false,
      opt_out_tracking_by_default: isOptedOut
    });

    isInitialized = true;
    console.log('📊 [Analytics] Mixpanel Telemetry initialized successfully.');

    // Track app launch
    trackEvent('app_launch', {
      platform: 'windows',
      app_version: '1.2.76',
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      is_dev: import.meta.env.DEV
    });
  } catch (err) {
    console.warn('⚠️ [Analytics] Failed to initialize Mixpanel:', err);
  }
}

/**
 * Track an arbitrary event with sanitized metadata
 */
export function trackEvent(eventName, properties = {}) {
  if (!isInitialized || isOptedOut) return;

  try {
    const sanitizedProps = {
      app_version: '1.2.76',
      platform: 'windows',
      timestamp: Date.now(),
      ...properties
    };

    mixpanel.track(eventName, sanitizedProps);
  } catch (err) {
    console.warn(`⚠️ [Analytics] Failed to track event "${eventName}":`, err);
  }
}

/**
 * Helper to track feature adoption
 */
export function trackFeatureUse(featureName, properties = {}) {
  trackEvent('feature_used', {
    feature_name: featureName,
    ...properties
  });
}

/**
 * Stitch distinct ID with paired mobile device
 */
export function identifyUser(distinctId) {
  if (!isInitialized || isOptedOut || !distinctId) return;
  try {
    mixpanel.identify(distinctId);
  } catch (err) {
    console.warn('⚠️ [Analytics] Failed to identify user:', err);
  }
}

/**
 * Toggle user telemetry preference (Opt-in / Opt-out)
 */
export function setTelemetryOptOut(optOut) {
  isOptedOut = !!optOut;
  localStorage.setItem('shareclip_telemetry_opt_out', isOptedOut ? 'true' : 'false');
  
  if (isInitialized) {
    if (isOptedOut) {
      mixpanel.opt_out_tracking();
      console.log('🔒 [Analytics] User opted out of telemetry.');
    } else {
      mixpanel.opt_in_tracking();
      console.log('✅ [Analytics] User opted in to telemetry.');
    }
  }
}

export function isTelemetryEnabled() {
  return isInitialized && !isOptedOut;
}
