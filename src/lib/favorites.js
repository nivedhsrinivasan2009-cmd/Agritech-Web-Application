// Favorites System for Gracia Visitor App
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'gracia_favorites';

// Favorite types
export const FavoriteType = {
  EVENT: 'event',
  ACTIVITY: 'activity',
  SHOP: 'shop',
  ZONE: 'zone'
};

// Storage key for a favorite type ("activity" -> "activities", not "activitys")
function storageKeyFor(type) {
  return type === FavoriteType.ACTIVITY ? 'activities' : `${type}s`;
}

// Get all favorites from storage
export function getAllFavorites() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      events: [],
      activities: [],
      shops: [],
      zones: []
    };
  } catch (e) {
    console.error('Failed to load favorites:', e);
    return { events: [], activities: [], shops: [], zones: [] };
  }
}

// Save favorites to storage
function saveFavorites(favorites) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    // Dispatch event for cross-tab sync
    window.dispatchEvent(new CustomEvent('favoritesChange', { detail: favorites }));
  } catch (e) {
    console.error('Failed to save favorites:', e);
  }
}

// Check if item is favorited
export function isFavorite(type, id) {
  const favorites = getAllFavorites();
  const key = storageKeyFor(type);
  return favorites[key]?.some(item => item.id === id) || false;
}

// Add to favorites
export function addFavorite(type, item) {
  const favorites = getAllFavorites();
  const key = storageKeyFor(type);

  if (!favorites[key]) {
    favorites[key] = [];
  }

  // Check if already exists
  if (favorites[key].some(f => f.id === item.id)) {
    return false;
  }

  // Add with timestamp
  favorites[key].push({
    ...item,
    favoritedAt: new Date().toISOString()
  });

  saveFavorites(favorites);

  // Track analytics
  trackFavoriteAction('add', type, item.id);

  return true;
}

// Remove from favorites
export function removeFavorite(type, id) {
  const favorites = getAllFavorites();
  const key = storageKeyFor(type);

  if (!favorites[key]) {
    return false;
  }

  const index = favorites[key].findIndex(item => item.id === id);
  if (index === -1) {
    return false;
  }

  favorites[key].splice(index, 1);
  saveFavorites(favorites);

  // Track analytics
  trackFavoriteAction('remove', type, id);

  return true;
}

// Toggle favorite
export function toggleFavorite(type, item) {
  if (isFavorite(type, item.id)) {
    removeFavorite(type, item.id);
    return false;
  } else {
    addFavorite(type, item);
    return true;
  }
}

// Get favorites by type
export function getFavoritesByType(type) {
  const favorites = getAllFavorites();
  const key = storageKeyFor(type);
  return favorites[key] || [];
}

// Get favorite count
export function getFavoriteCount(type = null) {
  const favorites = getAllFavorites();

  if (type) {
    const key = storageKeyFor(type);
    return favorites[key]?.length || 0;
  }

  return Object.values(favorites).reduce((sum, arr) => sum + (arr?.length || 0), 0);
}

// Clear all favorites
export function clearAllFavorites() {
  const emptyFavorites = { events: [], activities: [], shops: [], zones: [] };
  saveFavorites(emptyFavorites);
}

// Clear favorites by type
export function clearFavoritesByType(type) {
  const favorites = getAllFavorites();
  const key = storageKeyFor(type);
  favorites[key] = [];
  saveFavorites(favorites);
}

// Track favorite action for analytics
function trackFavoriteAction(action, type, id) {
  try {
    const analytics = JSON.parse(localStorage.getItem('gracia_analytics') || '{}');

    if (!analytics.favorites) {
      analytics.favorites = [];
    }

    analytics.favorites.push({
      action,
      type,
      id,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 entries
    if (analytics.favorites.length > 100) {
      analytics.favorites = analytics.favorites.slice(-100);
    }

    localStorage.setItem('gracia_analytics', JSON.stringify(analytics));
  } catch (e) {
    // Ignore analytics errors
  }
}

// React hook for favorites
export function useFavorites(type = null) {
  const [favorites, setFavorites] = useState(() => {
    if (type) {
      return getFavoritesByType(type);
    }
    return getAllFavorites();
  });

  // Listen for changes
  useEffect(() => {
    const handleChange = (e) => {
      if (type) {
        const key = storageKeyFor(type);
        setFavorites(e.detail[key] || []);
      } else {
        setFavorites(e.detail);
      }
    };

    window.addEventListener('favoritesChange', handleChange);
    return () => window.removeEventListener('favoritesChange', handleChange);
  }, [type]);

  const add = useCallback((item) => {
    const itemType = type || item.type;
    if (!itemType) {
      console.error('Favorite type is required');
      return false;
    }
    const result = addFavorite(itemType, item);
    if (result) {
      if (type) {
        setFavorites(getFavoritesByType(type));
      } else {
        setFavorites(getAllFavorites());
      }
    }
    return result;
  }, [type]);

  const remove = useCallback((id) => {
    const itemType = type;
    if (!itemType) {
      console.error('Favorite type is required for removal');
      return false;
    }
    const result = removeFavorite(itemType, id);
    if (result) {
      setFavorites(getFavoritesByType(type));
    }
    return result;
  }, [type]);

  const toggle = useCallback((item) => {
    const itemType = type || item.type;
    if (!itemType) {
      console.error('Favorite type is required');
      return false;
    }
    const result = toggleFavorite(itemType, item);
    if (type) {
      setFavorites(getFavoritesByType(type));
    } else {
      setFavorites(getAllFavorites());
    }
    return result;
  }, [type]);

  const check = useCallback((id) => {
    if (!type) {
      console.error('Favorite type is required for check');
      return false;
    }
    return isFavorite(type, id);
  }, [type]);

  const clear = useCallback(() => {
    if (type) {
      clearFavoritesByType(type);
      setFavorites([]);
    } else {
      clearAllFavorites();
      setFavorites({ events: [], activities: [], shops: [], zones: [] });
    }
  }, [type]);

  return {
    favorites,
    add,
    remove,
    toggle,
    isFavorite: check,
    clear,
    count: type ? favorites.length : getFavoriteCount()
  };
}

// Hook for single item favorite status
export function useFavoriteStatus(type, id) {
  const [isFav, setIsFav] = useState(() => isFavorite(type, id));

  useEffect(() => {
    const handleChange = () => {
      setIsFav(isFavorite(type, id));
    };

    window.addEventListener('favoritesChange', handleChange);
    return () => window.removeEventListener('favoritesChange', handleChange);
  }, [type, id]);

  const toggle = useCallback((item) => {
    const result = toggleFavorite(type, item);
    setIsFav(result);
    return result;
  }, [type]);

  return {
    isFavorite: isFav,
    toggle
  };
}

export default {
  FavoriteType,
  getAllFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  getFavoritesByType,
  getFavoriteCount,
  clearAllFavorites,
  clearFavoritesByType,
  useFavorites,
  useFavoriteStatus
};
