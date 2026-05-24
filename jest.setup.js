// Jest setup - runs before all tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/belarro_test';

// Set test environment
process.env.NODE_ENV = 'test';
