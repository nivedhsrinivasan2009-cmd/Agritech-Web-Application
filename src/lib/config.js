// Application Configuration
// Centralized configuration with environment variable handling

const config = {
  // App info
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Gracia Visitor App',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development',
    debug: import.meta.env.VITE_DEBUG === 'true' || import.meta.env.DEV,
    defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || 'en'
  },

  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    enabled: import.meta.env.VITE_USE_SUPABASE === 'true'
  },

  // AI Backend configuration
  ai: {
    apiUrl: import.meta.env.VITE_AI_API_URL || 'http://localhost:3002/api/ai',
    timeout: parseInt(import.meta.env.VITE_AI_TIMEOUT_MS || '60000', 10),
    model: import.meta.env.VITE_AI_MODEL || 'llama3.2:3b',
    enabled: import.meta.env.VITE_ENABLE_AI_ASSISTANT !== 'false'
  },

  // Weather configuration
  weather: {
    apiKey: import.meta.env.VITE_WEATHER_API_KEY || '',
    farmLocation: {
      lat: parseFloat(import.meta.env.VITE_FARM_LAT || '25.276987'),
      lon: parseFloat(import.meta.env.VITE_FARM_LON || '55.296249')
    }
  },

  // Push notifications
  push: {
    vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || '',
    enabled: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS !== 'false'
  },

  // Analytics
  analytics: {
    gaMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID || '',
    apiUrl: import.meta.env.VITE_ANALYTICS_API_URL || '',
    enabled: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false'
  },

  // Error tracking
  errorTracking: {
    sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
    enabled: !!import.meta.env.VITE_SENTRY_DSN
  },

  // Maps configuration
  maps: {
    provider: import.meta.env.VITE_MAP_PROVIDER || 'custom',
    mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
    googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
  },

  // API configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || '',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '30000', 10)
  },

  // Feature flags
  features: {
    booking: import.meta.env.VITE_ENABLE_BOOKING !== 'false',
    aiAssistant: import.meta.env.VITE_ENABLE_AI_ASSISTANT !== 'false',
    pushNotifications: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS !== 'false',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
    offlineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE !== 'false'
  }
};

// Validate required configuration
export function validateConfig() {
  const warnings = [];
  const errors = [];

  // Check Supabase config
  if (config.supabase.enabled) {
    if (!config.supabase.url) {
      warnings.push('Supabase URL not configured - using localStorage fallback');
    }
    if (!config.supabase.anonKey) {
      warnings.push('Supabase anon key not configured - using localStorage fallback');
    }
  }

  // Check AI config
  if (config.ai.enabled && !config.ai.apiUrl) {
    warnings.push('AI API URL not configured - AI features may not work');
  }

  // Check weather config
  if (!config.weather.apiKey) {
    warnings.push('Weather API key not configured - using mock weather data');
  }

  // Check error tracking
  if (config.app.environment === 'production' && !config.errorTracking.sentryDsn) {
    warnings.push('Sentry DSN not configured - errors will not be tracked');
  }

  // Log warnings in development
  if (config.app.debug) {
    warnings.forEach(w => console.warn(`[Config] ${w}`));
    errors.forEach(e => console.error(`[Config] ${e}`));
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}

// Check if we're in production
export function isProduction() {
  return config.app.environment === 'production';
}

// Check if we're in development
export function isDevelopment() {
  return config.app.environment === 'development' || import.meta.env.DEV;
}

// Check if a feature is enabled
export function isFeatureEnabled(feature) {
  return config.features[feature] === true;
}

// Get config value by path
export function getConfig(path) {
  return path.split('.').reduce((obj, key) => obj?.[key], config);
}

// Export config
export default config;
