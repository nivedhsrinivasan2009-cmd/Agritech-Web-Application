// Test Utilities
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a fresh query client for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Custom render with providers
export function renderWithProviders(
  ui,
  {
    route = '/',
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = {}
) {
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Mock data generators
export const mockEvent = (overrides = {}) => ({
  id: 'event-1',
  title: 'Test Event',
  description: 'A test event description',
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 3600000).toISOString(),
  location_id: 'loc-1',
  zone_id: 'zone-1',
  audience_type: 'family',
  capacity: 50,
  booked_count: 10,
  image_url: null,
  tags: ['family', 'outdoor'],
  ...overrides,
});

export const mockActivity = (overrides = {}) => ({
  id: 'activity-1',
  title: 'Test Activity',
  description: 'A test activity description',
  activity_type: 'workshop',
  location_id: 'loc-1',
  zone_id: 'zone-1',
  age_group: 'all',
  duration_minutes: 60,
  image_url: null,
  tags: ['educational'],
  ...overrides,
});

export const mockShop = (overrides = {}) => ({
  id: 'shop-1',
  name: 'Test Shop',
  description: 'A test shop description',
  category: 'cafe',
  location_id: 'loc-1',
  zone_id: 'zone-1',
  opening_hours: '08:00-18:00',
  is_open: true,
  phone: '+1234567890',
  image_url: null,
  ...overrides,
});

export const mockZone = (overrides = {}) => ({
  id: 'zone-1',
  zone_name: 'Test Zone',
  zone_type: 'activity',
  description: 'A test zone',
  color: '#22C55E',
  is_closed: false,
  ...overrides,
});

export const mockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  ...overrides,
});

export const mockAdminUser = (overrides = {}) => ({
  id: 'admin-1',
  email: 'admin@gracia.farm',
  name: 'Admin User',
  role: 'super_admin',
  permissions: ['all'],
  ...overrides,
});

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock API response helper
export const mockApiResponse = (data, options = {}) => {
  const { status = 200, ok = true } = options;
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
};

// Mock API error helper
export const mockApiError = (message = 'API Error', status = 500) => {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(message),
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
