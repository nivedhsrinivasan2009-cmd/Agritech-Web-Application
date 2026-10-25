/**
 * Local Data Service for Gracia Visitor App
 * Handles all data operations using local storage
 */

import { events as sampleEvents, activities as sampleActivities, shops as sampleShops, locations as sampleLocations, announcements as sampleAnnouncements, staffUsers as sampleStaffUsers, rolePermissions } from "../data/sampleData";
import { isShopOpen } from "../../utils";

// Simple password hashing for local storage (demo mode)
// Uses SHA-256 via Web Crypto API
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_gracia_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hashedPassword) {
  // Support both hashed and legacy plain text passwords
  if (hashedPassword.length === 64 && /^[a-f0-9]+$/.test(hashedPassword)) {
    // It's a hash, compare hashes
    const inputHash = await hashPassword(password);
    return inputHash === hashedPassword;
  }
  // Legacy plain text password (for backwards compatibility during migration)
  return password === hashedPassword;
}

// Storage keys
const STORAGE_KEYS = {
  EVENTS: "gracia_events",
  ACTIVITIES: "gracia_activities",
  SHOPS: "gracia_shops",
  LOCATIONS: "gracia_locations",
  ANNOUNCEMENTS: "gracia_announcements",
  USER: "gracia_user",
  USER_PERSISTENT: "gracia_user_persistent", // For "remember me" feature
  STAFF_USER: "gracia_staff_user",
  STAFF_USER_PERSISTENT: "gracia_staff_user_persistent", // For "remember me" feature
  STAFF_USERS: "gracia_staff_users",
  BOOKINGS: "gracia_bookings",
  CONVERSATIONS: "gracia_conversations",
  ANALYTICS: "gracia_analytics",
};

// Force reset all data to sample data (useful for debugging)
function resetAllData() {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(sampleEvents));
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(sampleActivities));
  localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(sampleShops));
  localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(sampleLocations));
  localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(sampleAnnouncements));
  localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(sampleStaffUsers));
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify({
    pageViews: {},
    searches: [],
    bookings: 0,
    aiQuestions: [],
  }));
  console.log("All data reset to sample data");
}

// Sample dates are relative to "today", but once stored they would go stale on later visits.
// Re-apply today's sample dates to sample items that staff have never edited (no updated_at).
const SAMPLE_DATE_FIELDS = [
  { key: STORAGE_KEYS.EVENTS, sample: sampleEvents, fields: ["start_time", "end_time"] },
  { key: STORAGE_KEYS.ANNOUNCEMENTS, sample: sampleAnnouncements, fields: ["start_date", "end_date"] },
  { key: STORAGE_KEYS.LOCATIONS, sample: sampleLocations, fields: ["closure_end_time"] },
];

function refreshSampleDates() {
  let changed = false;

  SAMPLE_DATE_FIELDS.forEach(({ key, sample, fields }) => {
    try {
      const items = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(items)) return;
      const sampleById = new Map(sample.map((s) => [s.id, s]));
      let collectionChanged = false;

      const refreshed = items.map((item) => {
        const original = sampleById.get(item.id);
        if (!original || item.updated_at) return item;
        const updated = { ...item };
        fields.forEach((field) => {
          if (updated[field] !== original[field]) {
            updated[field] = original[field];
            collectionChanged = true;
          }
        });
        return updated;
      });

      if (collectionChanged) {
        localStorage.setItem(key, JSON.stringify(refreshed));
        changed = true;
      }
    } catch {
      // Corrupted data is handled by ensureAllDataExists
    }
  });

  return changed;
}

// Ensure all data exists - called on every page load
function ensureAllDataExists() {
  let needsRefresh = false;

  // Check each data type
  const dataChecks = [
    { key: STORAGE_KEYS.EVENTS, sample: sampleEvents, name: 'events' },
    { key: STORAGE_KEYS.ACTIVITIES, sample: sampleActivities, name: 'activities' },
    { key: STORAGE_KEYS.SHOPS, sample: sampleShops, name: 'shops' },
    { key: STORAGE_KEYS.LOCATIONS, sample: sampleLocations, name: 'locations' },
    { key: STORAGE_KEYS.ANNOUNCEMENTS, sample: sampleAnnouncements, name: 'announcements' },
    { key: STORAGE_KEYS.STAFF_USERS, sample: sampleStaffUsers, name: 'staff' },
  ];

  dataChecks.forEach(({ key, sample, name }) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        console.log(`Missing ${name} data - initializing...`);
        localStorage.setItem(key, JSON.stringify(sample));
        needsRefresh = true;
      } else {
        const parsed = JSON.parse(stored);
        // An empty list is a valid admin choice; only staff must never be empty (no one could log in)
        const mustNotBeEmpty = key === STORAGE_KEYS.STAFF_USERS;
        if (!Array.isArray(parsed) || (mustNotBeEmpty && parsed.length === 0)) {
          console.log(`Invalid ${name} data - initializing...`);
          localStorage.setItem(key, JSON.stringify(sample));
          needsRefresh = true;
        }
      }
    } catch (e) {
      console.log(`Corrupted ${name} data - reinitializing...`);
      localStorage.setItem(key, JSON.stringify(sample));
      needsRefresh = true;
    }
  });

  if (refreshSampleDates()) {
    needsRefresh = true;
  }

  // Initialize other required data
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ANALYTICS)) {
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify({
      pageViews: {},
      searches: [],
      bookings: 0,
      aiQuestions: [],
    }));
  }

  return needsRefresh;
}

// Make reset function available globally for debugging
if (typeof window !== 'undefined') {
  window.resetGraciaData = resetAllData;

  // Ensure all data exists on every page load
  const wasRefreshed = ensureAllDataExists();
  if (wasRefreshed) {
    console.log("✅ Sample data initialized successfully");
  }
}

// Helper to generate unique IDs
function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Session helpers: "remember me" sessions live in localStorage (survive browser close),
// all other sessions live in sessionStorage (cleared when the browser closes)
function readSession(key, persistentKey) {
  const persistent = localStorage.getItem(persistentKey);
  if (persistent) return JSON.parse(persistent);

  // Older versions always copied the session into localStorage under `key`;
  // drop that copy so it can't outlive a non-"remember me" session
  const legacy = localStorage.getItem(key);
  localStorage.removeItem(key);

  const session = sessionStorage.getItem(key) || legacy;
  return session ? JSON.parse(session) : null;
}

function writeSession(key, persistentKey, value, rememberMe) {
  clearSession(key, persistentKey);
  if (rememberMe) {
    localStorage.setItem(persistentKey, JSON.stringify(value));
  } else {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
}

// Update the stored session in place, keeping its "remember me" choice
function updateSession(key, persistentKey, value) {
  writeSession(key, persistentKey, value, !!localStorage.getItem(persistentKey));
}

function clearSession(key, persistentKey) {
  localStorage.removeItem(key);
  localStorage.removeItem(persistentKey);
  sessionStorage.removeItem(key);
}

const readUserSession = () => readSession(STORAGE_KEYS.USER, STORAGE_KEYS.USER_PERSISTENT);
const readStaffSession = () => readSession(STORAGE_KEYS.STAFF_USER, STORAGE_KEYS.STAFF_USER_PERSISTENT);

// Helper to notify other tabs AND current tab about data changes
function notifyDataChange(storageKey) {
  // Dispatch custom event for current tab
  window.dispatchEvent(new CustomEvent('gracia-data-change', {
    detail: { key: storageKey }
  }));

  // Manually trigger storage event for other tabs by writing a timestamp
  const syncKey = 'gracia_sync_timestamp';
  localStorage.setItem(syncKey, Date.now().toString());
}

// Helper to simulate network delay (makes UI feel more realistic)
function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Map storage keys to sample data for auto-recovery
const SAMPLE_DATA_MAP = {
  [STORAGE_KEYS.EVENTS]: sampleEvents,
  [STORAGE_KEYS.ACTIVITIES]: sampleActivities,
  [STORAGE_KEYS.SHOPS]: sampleShops,
  [STORAGE_KEYS.LOCATIONS]: sampleLocations,
  [STORAGE_KEYS.ANNOUNCEMENTS]: sampleAnnouncements,
  [STORAGE_KEYS.STAFF_USERS]: sampleStaffUsers,
};

// Generic CRUD operations for entities
function createEntityService(storageKey, idPrefix) {
  return {
    async list(orderBy = "", limit = 100) {
      await delay(200);
      const stored = localStorage.getItem(storageKey);
      let data = stored ? JSON.parse(stored) : [];

      // Auto-recover only when the key is missing (e.g. storage was cleared), not when
      // staff deliberately deleted every item
      if (stored === null && SAMPLE_DATA_MAP[storageKey]) {
        console.log(`Auto-recovering missing data for ${storageKey}`);
        data = [...SAMPLE_DATA_MAP[storageKey]];
        localStorage.setItem(storageKey, JSON.stringify(data));
      }

      // Handle ordering
      if (orderBy) {
        const desc = orderBy.startsWith("-");
        const field = desc ? orderBy.slice(1) : orderBy;
        data.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          if (desc) return aVal > bVal ? -1 : 1;
          return aVal > bVal ? 1 : -1;
        });
      }

      // Handle limit
      if (limit && limit < data.length) {
        data = data.slice(0, limit);
      }

      return data;
    },

    async get(id) {
      await delay(100);
      const data = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const item = data.find((d) => d.id === id);
      if (!item) throw new Error("Item not found");
      return item;
    },

    async create(itemData) {
      await delay(200);
      const data = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const newItem = {
        ...itemData,
        id: generateId(idPrefix),
        created_at: new Date().toISOString(),
      };
      data.push(newItem);
      localStorage.setItem(storageKey, JSON.stringify(data));
      notifyDataChange(storageKey);
      return newItem;
    },

    async update(id, updates) {
      await delay(200);
      const data = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const index = data.findIndex((d) => d.id === id);
      if (index === -1) throw new Error("Item not found");
      data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(storageKey, JSON.stringify(data));
      notifyDataChange(storageKey);
      return data[index];
    },

    async delete(id) {
      await delay(200);
      const data = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const filtered = data.filter((d) => d.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      notifyDataChange(storageKey);
      return { success: true };
    },
  };
}

// Auth service
const authService = {
  async login(email, password, rememberMe = false) {
    await delay(500);

    // Check if user exists
    const users = JSON.parse(localStorage.getItem("gracia_users") || "[]");
    const user = users.find((u) => u.email === email);

    if (!user) {
      throw new Error("User not found. Please sign up first.");
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error("Invalid password");
    }

    // Store current user (without password)
    const { password: _, ...safeUser } = user;
    writeSession(STORAGE_KEYS.USER, STORAGE_KEYS.USER_PERSISTENT, safeUser, rememberMe);

    return safeUser;
  },

  async register(userData, rememberMe = false) {
    await delay(500);

    const users = JSON.parse(localStorage.getItem("gracia_users") || "[]");

    // Check if email exists
    if (users.find((u) => u.email === userData.email)) {
      throw new Error("Email already registered");
    }

    // Hash the password before storing
    const hashedPassword = await hashPassword(userData.password);

    const newUser = {
      id: generateId("user"),
      ...userData,
      password: hashedPassword,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem("gracia_users", JSON.stringify(users));

    // Auto login after register
    const { password: _, ...safeUser } = newUser;
    writeSession(STORAGE_KEYS.USER, STORAGE_KEYS.USER_PERSISTENT, safeUser, rememberMe);

    return safeUser;
  },

  async logout() {
    await delay(200);
    clearSession(STORAGE_KEYS.USER, STORAGE_KEYS.USER_PERSISTENT);
    return { success: true };
  },

  async getCurrentUser() {
    await delay(100);
    const user = readUserSession();
    if (!user) throw new Error("Not authenticated");
    return user;
  },

  async updateProfile(data) {
    await delay(300);
    const user = readUserSession();
    if (!user) throw new Error("Not authenticated");

    const updatedUser = { ...user, ...data, updated_at: new Date().toISOString() };
    updateSession(STORAGE_KEYS.USER, STORAGE_KEYS.USER_PERSISTENT, updatedUser);

    // Also update in users list
    const users = JSON.parse(localStorage.getItem("gracia_users") || "[]");
    const index = users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      localStorage.setItem("gracia_users", JSON.stringify(users));
    }

    return updatedUser;
  },
};

// Bookings service
const bookingsService = {
  async create(eventId, bookingData) {
    await delay(300);

    const user = readUserSession();
    if (!user) {
      throw new Error("Please login to book events");
    }

    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || "[]");

    // Check if already booked (cancelled bookings don't count, so visitors can rebook)
    if (bookings.find((b) => b.event_id === eventId && b.user_id === user.id && b.status !== "cancelled")) {
      throw new Error("You have already booked this event");
    }

    const newBooking = {
      id: generateId("booking"),
      event_id: eventId,
      user_id: user.id,
      ...bookingData,
      status: "confirmed",
      created_at: new Date().toISOString(),
    };

    bookings.push(newBooking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    return newBooking;
  },

  async list() {
    await delay(200);

    const user = readUserSession();
    if (!user) return [];

    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || "[]");
    return bookings.filter((b) => b.user_id === user.id);
  },

  async cancel(bookingId) {
    await delay(200);

    const user = readUserSession();
    if (!user) throw new Error("Please login to manage bookings");

    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || "[]");
    const index = bookings.findIndex((b) => b.id === bookingId && b.user_id === user.id);

    if (index === -1) throw new Error("Booking not found");

    bookings[index].status = "cancelled";
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    return bookings[index];
  },
};

// Admin/Staff authentication service
const adminAuthService = {
  async login(email, password, rememberMe = true) {
    await delay(500);

    const staffUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_USERS) || "[]");
    const staff = staffUsers.find((s) => s.email === email);

    if (!staff) {
      throw new Error("Staff account not found");
    }

    const isValid = await verifyPassword(password, staff.password);
    if (!isValid) {
      throw new Error("Invalid password");
    }

    // Store current staff user (without password)
    const { password: _, ...safeStaff } = staff;
    const staffWithPermissions = {
      ...safeStaff,
      rolePermissions: rolePermissions[staff.role] || rolePermissions.support,
    };

    writeSession(STORAGE_KEYS.STAFF_USER, STORAGE_KEYS.STAFF_USER_PERSISTENT, staffWithPermissions, rememberMe);

    return staffWithPermissions;
  },

  async logout() {
    await delay(200);
    clearSession(STORAGE_KEYS.STAFF_USER, STORAGE_KEYS.STAFF_USER_PERSISTENT);
    return { success: true };
  },

  async getCurrentStaff() {
    await delay(100);
    return readStaffSession();
  },

  // Alias for consistency with the Login page
  async getCurrentUser() {
    return this.getCurrentStaff();
  },

  async checkPermission(area) {
    const staff = await this.getCurrentStaff();
    if (!staff) return false;

    const perms = staff.rolePermissions;
    if (!perms) return false;

    return perms.areas.includes(area) || perms.areas.includes("all");
  },

  async canCreate() {
    const staff = await this.getCurrentStaff();
    return staff?.rolePermissions?.canCreate || false;
  },

  async canEdit() {
    const staff = await this.getCurrentStaff();
    return staff?.rolePermissions?.canEdit || false;
  },

  async canDelete() {
    const staff = await this.getCurrentStaff();
    return staff?.rolePermissions?.canDelete || false;
  },

  async listStaff() {
    await delay(200);
    const staffUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_USERS) || "[]");
    return staffUsers.map(({ password, ...rest }) => rest);
  },

  async createStaff(staffData) {
    await delay(300);
    const currentStaff = await this.getCurrentStaff();
    if (!currentStaff?.rolePermissions?.canManageStaff) {
      throw new Error("No permission to manage staff");
    }

    const staffUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_USERS) || "[]");

    if (staffUsers.find((s) => s.email === staffData.email)) {
      throw new Error("Email already exists");
    }

    // Hash the password before storing
    const hashedPassword = staffData.password ? await hashPassword(staffData.password) : null;

    const newStaff = {
      id: generateId("staff"),
      ...staffData,
      password: hashedPassword,
      created_at: new Date().toISOString(),
    };

    staffUsers.push(newStaff);
    localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(staffUsers));

    const { password, ...safeStaff } = newStaff;
    return safeStaff;
  },

  async updateStaff(staffId, updates) {
    await delay(300);
    const currentStaff = await this.getCurrentStaff();
    if (!currentStaff?.rolePermissions?.canManageStaff) {
      throw new Error("No permission to manage staff");
    }

    const staffUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_USERS) || "[]");
    const index = staffUsers.findIndex((s) => s.id === staffId);

    if (index === -1) throw new Error("Staff not found");

    // Hash a changed password the same way createStaff does
    const safeUpdates = { ...updates };
    if (safeUpdates.password) {
      safeUpdates.password = await hashPassword(safeUpdates.password);
    } else {
      delete safeUpdates.password;
    }

    staffUsers[index] = { ...staffUsers[index], ...safeUpdates, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(staffUsers));

    const { password, ...safeStaff } = staffUsers[index];
    return safeStaff;
  },

  async deleteStaff(staffId) {
    await delay(300);
    const currentStaff = await this.getCurrentStaff();
    if (!currentStaff?.rolePermissions?.canManageStaff) {
      throw new Error("No permission to manage staff");
    }

    if (currentStaff.id === staffId) {
      throw new Error("Cannot delete your own account");
    }

    const staffUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_USERS) || "[]");
    const filtered = staffUsers.filter((s) => s.id !== staffId);
    localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(filtered));

    return { success: true };
  },
};

// Analytics service for admin dashboard
const analyticsService = {
  async trackPageView(page) {
    const analytics = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANALYTICS) || "{}");
    analytics.pageViews = analytics.pageViews || {};
    analytics.pageViews[page] = (analytics.pageViews[page] || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
  },

  async trackSearch(query) {
    const analytics = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANALYTICS) || "{}");
    analytics.searches = analytics.searches || [];
    analytics.searches.push({ query, timestamp: new Date().toISOString() });
    // Keep only last 100 searches
    if (analytics.searches.length > 100) {
      analytics.searches = analytics.searches.slice(-100);
    }
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
  },

  async trackAIQuestion(question) {
    const analytics = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANALYTICS) || "{}");
    analytics.aiQuestions = analytics.aiQuestions || [];
    analytics.aiQuestions.push({ question, timestamp: new Date().toISOString() });
    // Keep only last 100 questions
    if (analytics.aiQuestions.length > 100) {
      analytics.aiQuestions = analytics.aiQuestions.slice(-100);
    }
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
  },

  async getAnalytics() {
    await delay(200);
    const analytics = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANALYTICS) || "{}");
    const events = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || "[]");
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || "[]");
    const activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || "[]");
    const shops = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOPS) || "[]");

    return {
      ...analytics,
      totalEvents: events.length,
      totalActivities: activities.length,
      totalShops: shops.length,
      totalBookings: bookings.length,
      recentBookings: bookings.slice(-10).reverse(),
      topSearches: this.getTopSearches(analytics.searches || []),
      topAIQuestions: this.getTopQuestions(analytics.aiQuestions || []),
    };
  },

  getTopSearches(searches) {
    const counts = {};
    searches.forEach((s) => {
      const q = s.query.toLowerCase();
      counts[q] = (counts[q] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  },

  getTopQuestions(questions) {
    const counts = {};
    questions.forEach((q) => {
      const text = q.question.toLowerCase().slice(0, 50);
      counts[text] = (counts[text] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([question, count]) => ({ question, count }));
  },
};

/**
 * Snapshot of the live visitor-facing data, used as the AI assistant's knowledge (RAG).
 * The data lives in this browser, so it's sent to the AI backend with each question.
 */
export function getKnowledgeSnapshot() {
  const read = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };
  // Images aren't useful to the AI and would bloat every request
  const withoutImage = ({ image_url: _, ...item }) => item;

  return {
    events: read(STORAGE_KEYS.EVENTS).map(withoutImage),
    activities: read(STORAGE_KEYS.ACTIVITIES).map(withoutImage),
    shops: read(STORAGE_KEYS.SHOPS).map((shop) => ({ ...withoutImage(shop), open_now: isShopOpen(shop.opening_hours) })),
    locations: read(STORAGE_KEYS.LOCATIONS).map(withoutImage),
    announcements: read(STORAGE_KEYS.ANNOUNCEMENTS).map(withoutImage),
  };
}

// Export the complete API service
export const api = {
  entities: {
    Event: createEntityService(STORAGE_KEYS.EVENTS, "evt"),
    Activity: createEntityService(STORAGE_KEYS.ACTIVITIES, "act"),
    Shop: createEntityService(STORAGE_KEYS.SHOPS, "shop"),
    Location: createEntityService(STORAGE_KEYS.LOCATIONS, "loc"),
    Announcement: createEntityService(STORAGE_KEYS.ANNOUNCEMENTS, "ann"),
  },
  auth: authService,
  adminAuth: adminAuthService,
  bookings: bookingsService,
  analytics: analyticsService,
  rolePermissions,
};

export default api;
