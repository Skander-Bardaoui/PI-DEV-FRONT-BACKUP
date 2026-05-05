import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { AccessibilityProvider } from './context/AccessibilityContext.tsx'
import './index.css'
import './styles/accessibility.css'
import './styles/simplified-mode.css'

import './styles/reading-mode.css'

import App from './App.tsx'
import { ToastProvider } from './components/ui/Toast.tsx'
import './i18n/index';

// Suppress browser extension errors
window.addEventListener('error', (event) => {
  // Suppress "message channel closed" errors from browser extensions
  if (event.message?.includes('message channel closed') || 
      event.message?.includes('Extension context invalidated')) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Suppress unhandled promise rejections from browser extensions
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('message channel closed') ||
      event.reason?.message?.includes('Extension context invalidated')) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:               1,
      staleTime:           30_000,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>                       
        <ErrorBoundary>
          <AccessibilityProvider>
            <App />
          </AccessibilityProvider>
        </ErrorBoundary>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>
)