// Weather Integration for Gracia Visitor App
import { useState, useEffect } from 'react';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';
const FARM_LOCATION = {
  lat: import.meta.env.VITE_FARM_LAT || 25.276987,
  lon: import.meta.env.VITE_FARM_LON || 55.296249
};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Weather condition mappings
const weatherConditions = {
  clear: { icon: 'sun', label: 'Clear', outdoor: 'perfect' },
  clouds: { icon: 'cloud', label: 'Cloudy', outdoor: 'good' },
  rain: { icon: 'cloud-rain', label: 'Rainy', outdoor: 'poor' },
  drizzle: { icon: 'cloud-drizzle', label: 'Drizzle', outdoor: 'fair' },
  thunderstorm: { icon: 'cloud-lightning', label: 'Thunderstorm', outdoor: 'avoid' },
  snow: { icon: 'cloud-snow', label: 'Snow', outdoor: 'poor' },
  mist: { icon: 'cloud-fog', label: 'Misty', outdoor: 'fair' },
  fog: { icon: 'cloud-fog', label: 'Foggy', outdoor: 'fair' },
  haze: { icon: 'sun-dim', label: 'Hazy', outdoor: 'fair' },
  dust: { icon: 'wind', label: 'Dusty', outdoor: 'poor' },
  sand: { icon: 'wind', label: 'Sandstorm', outdoor: 'avoid' }
};

// Get cached weather data
function getCachedWeather() {
  try {
    const cached = localStorage.getItem('weather_cache');
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (e) {
    // Ignore cache errors
  }
  return null;
}

// Save weather to cache
function cacheWeather(data) {
  try {
    localStorage.setItem('weather_cache', JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    // Ignore cache errors
  }
}

// Fetch weather from API
async function fetchWeatherFromAPI() {
  if (!WEATHER_API_KEY) {
    console.warn('Weather API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${FARM_LOCATION.lat}&lon=${FARM_LOCATION.lon}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error('Weather API error');
    }

    const data = await response.json();
    return parseWeatherData(data);
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
}

// Parse weather API response
function parseWeatherData(data) {
  const mainCondition = data.weather[0].main.toLowerCase();
  const condition = weatherConditions[mainCondition] || weatherConditions.clear;

  return {
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
    condition: mainCondition,
    description: data.weather[0].description,
    icon: condition.icon,
    label: condition.label,
    outdoorCondition: condition.outdoor,
    sunrise: new Date(data.sys.sunrise * 1000),
    sunset: new Date(data.sys.sunset * 1000),
    updatedAt: new Date()
  };
}

// Get current weather
export async function getCurrentWeather() {
  // Check cache first
  const cached = getCachedWeather();
  if (cached) {
    return cached;
  }

  // Fetch from API
  const weather = await fetchWeatherFromAPI();
  if (weather) {
    cacheWeather(weather);
    return weather;
  }

  // Return mock data as fallback
  return getMockWeather();
}

// Mock weather for development
function getMockWeather() {
  const now = new Date();
  const hour = now.getHours();

  return {
    temperature: hour >= 10 && hour <= 16 ? 32 : 26,
    feelsLike: hour >= 10 && hour <= 16 ? 35 : 28,
    humidity: 45,
    windSpeed: 12,
    condition: 'clear',
    description: 'clear sky',
    icon: 'sun',
    label: 'Clear',
    outdoorCondition: 'perfect',
    sunrise: new Date(now.setHours(6, 0, 0)),
    sunset: new Date(now.setHours(18, 30, 0)),
    updatedAt: new Date(),
    isMock: true
  };
}

// Get weather recommendation for outdoor activities
export function getOutdoorRecommendation(weather) {
  if (!weather) return null;

  const { temperature, outdoorCondition, humidity, windSpeed } = weather;

  let recommendation = {
    status: 'good',
    message: 'Great day for outdoor activities!',
    tips: []
  };

  // Check temperature
  if (temperature > 40) {
    recommendation.status = 'warning';
    recommendation.message = 'Very hot - take precautions';
    recommendation.tips.push('Stay hydrated', 'Seek shade frequently', 'Avoid peak sun hours (12-3 PM)');
  } else if (temperature > 35) {
    recommendation.status = 'caution';
    recommendation.message = 'Hot weather - stay cool';
    recommendation.tips.push('Drink plenty of water', 'Use sunscreen', 'Take breaks in shaded areas');
  } else if (temperature < 15) {
    recommendation.status = 'caution';
    recommendation.message = 'Cool weather - dress warmly';
    recommendation.tips.push('Bring a jacket', 'Layer your clothing');
  }

  // Check outdoor condition
  if (outdoorCondition === 'avoid') {
    recommendation.status = 'warning';
    recommendation.message = 'Weather conditions not ideal for outdoor activities';
    recommendation.tips.push('Consider indoor activities', 'Check zone closures');
  } else if (outdoorCondition === 'poor') {
    recommendation.status = 'caution';
    recommendation.message = 'Weather may affect outdoor experience';
    recommendation.tips.push('Bring rain gear', 'Have backup indoor plans');
  }

  // Check humidity
  if (humidity > 80) {
    recommendation.tips.push('High humidity - take it easy');
  }

  // Check wind
  if (windSpeed > 30) {
    recommendation.tips.push('Windy conditions - secure loose items');
  }

  return recommendation;
}

// Get weather forecast (placeholder for extended API)
export async function getWeatherForecast(days = 5) {
  // This would use a forecast API endpoint
  // For now, return mock forecast
  const forecast = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    forecast.push({
      date,
      high: 30 + Math.floor(Math.random() * 8),
      low: 22 + Math.floor(Math.random() * 5),
      condition: ['clear', 'clouds', 'clear', 'clouds', 'clear'][i],
      icon: ['sun', 'cloud', 'sun', 'cloud', 'sun'][i],
      precipitation: Math.floor(Math.random() * 20)
    });
  }

  return forecast;
}

// React hook for weather
export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        const [currentWeather, weatherForecast] = await Promise.all([
          getCurrentWeather(),
          getWeatherForecast()
        ]);
        setWeather(currentWeather);
        setForecast(weatherForecast);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();

    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  const refresh = async () => {
    localStorage.removeItem('weather_cache');
    setLoading(true);
    const currentWeather = await getCurrentWeather();
    setWeather(currentWeather);
    setLoading(false);
  };

  return {
    weather,
    forecast,
    loading,
    error,
    refresh,
    recommendation: weather ? getOutdoorRecommendation(weather) : null
  };
}

export default {
  getCurrentWeather,
  getWeatherForecast,
  getOutdoorRecommendation,
  useWeather
};
