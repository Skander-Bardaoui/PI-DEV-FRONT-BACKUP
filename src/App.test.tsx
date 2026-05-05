import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

// Mock the AccessibilityProvider
vi.mock('./context/AccessibilityContext', () => ({
  AccessibilityProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAccessibility: () => ({
    settings: {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNav: false,
      focusIndicators: true,
      colorTheme: 'default',
      fontSize: 16,
      lineHeight: 1.5,
      letterSpacing: 0,
      readingMode: false,
      simplifiedMode: false,
    },
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
  }),
}));

describe('App', () => {
  it('renders without crashing', () => {
    // App already includes BrowserRouter, so we don't wrap it again
    render(<App />);
    expect(document.body).toBeTruthy();
  });
});