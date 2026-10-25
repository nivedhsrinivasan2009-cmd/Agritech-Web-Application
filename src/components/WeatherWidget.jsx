// Weather Widget Component
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning,
  CloudDrizzle, CloudFog, Wind, Thermometer, Droplets,
  AlertTriangle, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { useWeather } from '@/lib/weather';

// Weather icon mapping
const weatherIcons = {
  sun: Sun,
  cloud: Cloud,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
  'cloud-drizzle': CloudDrizzle,
  'cloud-fog': CloudFog,
  wind: Wind,
  'sun-dim': Sun
};

export default function WeatherWidget({ compact = false, className = '' }) {
  const { weather, recommendation, loading, error, refresh } = useWeather();
  const [expanded, setExpanded] = React.useState(false);

  if (loading && !weather) {
    return (
      <div className={`bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-4 text-white ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-20 bg-white/20 rounded animate-pulse mb-1" />
            <div className="h-3 w-16 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className={`bg-stone-100 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-stone-500">
          <CloudFog className="w-5 h-5" />
          <span className="text-sm">Weather unavailable</span>
          <button onClick={refresh} className="ml-auto p-1 hover:bg-stone-200 rounded">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const WeatherIcon = weatherIcons[weather.icon] || Sun;
  const bgGradient = {
    clear: 'from-amber-400 to-orange-500',
    clouds: 'from-gray-400 to-gray-500',
    rain: 'from-blue-500 to-blue-600',
    drizzle: 'from-blue-400 to-blue-500',
    thunderstorm: 'from-purple-600 to-purple-800',
    snow: 'from-blue-200 to-blue-300',
    mist: 'from-gray-300 to-gray-400',
    fog: 'from-gray-300 to-gray-400',
    haze: 'from-amber-300 to-amber-400',
    dust: 'from-amber-600 to-amber-700',
    sand: 'from-amber-700 to-amber-800'
  };

  const gradient = bgGradient[weather.condition] || bgGradient.clear;

  if (compact) {
    return (
      <div className={`bg-gradient-to-br ${gradient} rounded-lg px-3 py-2 text-white flex items-center gap-2 ${className}`}>
        <WeatherIcon className="w-5 h-5" />
        <span className="font-semibold">{weather.temperature}°C</span>
        <span className="text-white/80 text-sm">{weather.label}</span>
      </div>
    );
  }

  return (
    <motion.div
      className={`bg-gradient-to-br ${gradient} rounded-xl text-white overflow-hidden ${className}`}
      layout
    >
      {/* Main weather display */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <WeatherIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-3xl font-bold">{weather.temperature}°C</div>
              <div className="text-white/80 text-sm">Feels like {weather.feelsLike}°C</div>
            </div>
          </div>

          <button
            onClick={refresh}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh weather"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Droplets className="w-4 h-4 text-white/70" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind className="w-4 h-4 text-white/70" />
            <span>{weather.windSpeed} km/h</span>
          </div>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div className={`mt-3 p-2 rounded-lg ${
            recommendation.status === 'warning' ? 'bg-red-500/30' :
            recommendation.status === 'caution' ? 'bg-amber-500/30' :
            'bg-green-500/30'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              {recommendation.status !== 'good' && (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span>{recommendation.message}</span>
            </div>
          </div>
        )}

        {/* Expand/collapse button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 pt-2 border-t border-white/20 flex items-center justify-center gap-1 text-sm text-white/80 hover:text-white transition-colors"
        >
          {expanded ? 'Less details' : 'More details'}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/20"
          >
            <div className="p-4 space-y-3">
              {/* Sunrise/Sunset */}
              <div className="flex justify-between text-sm">
                <div>
                  <div className="text-white/60 text-xs">Sunrise</div>
                  <div>{weather.sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/60 text-xs">Sunset</div>
                  <div>{weather.sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              {/* Tips */}
              {recommendation?.tips?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-white/60 text-xs">Tips for today</div>
                  {recommendation.tips.map((tip, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="w-1 h-1 rounded-full bg-white/60" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Last updated */}
              <div className="text-xs text-white/50 text-center">
                Updated {weather.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {weather.isMock && ' (Demo data)'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Compact inline weather for header
export function WeatherBadge({ className = '' }) {
  const { weather, loading } = useWeather();

  if (loading || !weather) {
    return null;
  }

  const WeatherIcon = weatherIcons[weather.icon] || Sun;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 bg-stone-100 rounded-full text-sm ${className}`}>
      <WeatherIcon className="w-4 h-4 text-amber-500" />
      <span className="font-medium text-stone-700">{weather.temperature}°</span>
    </div>
  );
}
