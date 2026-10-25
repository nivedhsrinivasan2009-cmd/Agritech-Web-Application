/** @type {import('jest').Config} */
export default {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],

  // Module resolution
  moduleNameMapper: {
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/test/__mocks__/fileMock.js',
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/api/(.*)$': '<rootDir>/src/api/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1'
  },

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: ['/node_modules/(?!(.*\\.mjs$|@tanstack|@radix-ui))'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    'Pages/**/*.{js,jsx}',
    'Components/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/test/**',
    '!**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}',
    '<rootDir>/Pages/**/*.{spec,test}.{js,jsx}',
    '<rootDir>/Components/**/*.{spec,test}.{js,jsx}'
  ],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Detect open handles
  detectOpenHandles: true
};
