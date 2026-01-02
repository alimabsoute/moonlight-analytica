/**
 * Janus Shared Components & Utilities
 * Export all shared modules for use in both dashboard versions
 */

// Mock Data Generator
export * from './mockData.js';
export { default as mockData } from './mockData.js';

// Theme System
export * from './theme.js';
export { default as themes } from './theme.js';

// Humanoid Tracking Demo
export { default as HumanoidTrackingDemo, ZONES as DemoZones, CONFIG as DemoConfig } from './HumanoidTrackingDemo.jsx';
