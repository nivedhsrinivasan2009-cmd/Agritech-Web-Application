// Favorites System Tests
import {
  getAllFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  getFavoritesByType,
  getFavoriteCount,
  clearAllFavorites,
  FavoriteType
} from '../favorites';

describe('Favorites System', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getAllFavorites', () => {
    it('returns empty favorites when storage is empty', () => {
      localStorage.getItem.mockReturnValue(null);

      const favorites = getAllFavorites();

      expect(favorites).toEqual({
        events: [],
        activities: [],
        shops: [],
        zones: []
      });
    });

    it('returns stored favorites', () => {
      const storedFavorites = {
        events: [{ id: '1', title: 'Event 1' }],
        activities: [],
        shops: [],
        zones: []
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(storedFavorites));

      const favorites = getAllFavorites();

      expect(favorites).toEqual(storedFavorites);
    });
  });

  describe('addFavorite', () => {
    it('adds a new favorite', () => {
      localStorage.getItem.mockReturnValue(null);

      const item = { id: '1', title: 'Test Event' };
      const result = addFavorite(FavoriteType.EVENT, item);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('does not add duplicate favorites', () => {
      const existingFavorites = {
        events: [{ id: '1', title: 'Test Event' }],
        activities: [],
        shops: [],
        zones: []
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(existingFavorites));

      const item = { id: '1', title: 'Test Event' };
      const result = addFavorite(FavoriteType.EVENT, item);

      expect(result).toBe(false);
    });
  });

  describe('removeFavorite', () => {
    it('removes an existing favorite', () => {
      const existingFavorites = {
        events: [{ id: '1', title: 'Test Event' }],
        activities: [],
        shops: [],
        zones: []
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(existingFavorites));

      const result = removeFavorite(FavoriteType.EVENT, '1');

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('returns false when favorite does not exist', () => {
      localStorage.getItem.mockReturnValue(null);

      const result = removeFavorite(FavoriteType.EVENT, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('isFavorite', () => {
    it('returns true when item is favorited', () => {
      const existingFavorites = {
        events: [{ id: '1', title: 'Test Event' }],
        activities: [],
        shops: [],
        zones: []
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(existingFavorites));

      expect(isFavorite(FavoriteType.EVENT, '1')).toBe(true);
    });

    it('returns false when item is not favorited', () => {
      localStorage.getItem.mockReturnValue(null);

      expect(isFavorite(FavoriteType.EVENT, '1')).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('adds favorite when not favorited', () => {
      localStorage.getItem.mockReturnValue(null);

      const item = { id: '1', title: 'Test Event' };
      const result = toggleFavorite(FavoriteType.EVENT, item);

      expect(result).toBe(true);
    });

    it('removes favorite when already favorited', () => {
      const existingFavorites = {
        events: [{ id: '1', title: 'Test Event' }],
        activities: [],
        shops: [],
        zones: []
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(existingFavorites));

      const item = { id: '1', title: 'Test Event' };
      const result = toggleFavorite(FavoriteType.EVENT, item);

      expect(result).toBe(false);
    });
  });

  describe('getFavoriteCount', () => {
    it('returns count for specific type', () => {
      const existingFavorites = {
        events: [{ id: '1' }, { id: '2' }],
        activities: [{ id: '3' }],
        shops: [],
        zones: []
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(existingFavorites));

      expect(getFavoriteCount(FavoriteType.EVENT)).toBe(2);
      expect(getFavoriteCount(FavoriteType.ACTIVITY)).toBe(1);
    });

    it('returns total count when no type specified', () => {
      const existingFavorites = {
        events: [{ id: '1' }, { id: '2' }],
        activities: [{ id: '3' }],
        shops: [{ id: '4' }],
        zones: []
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(existingFavorites));

      expect(getFavoriteCount()).toBe(4);
    });
  });

  describe('clearAllFavorites', () => {
    it('clears all favorites', () => {
      clearAllFavorites();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'gracia_favorites',
        JSON.stringify({ events: [], activities: [], shops: [], zones: [] })
      );
    });
  });
});
