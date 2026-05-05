import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to preserve sidebar scroll position during navigation
 */
export function useSidebarScroll() {
  const location = useLocation();
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    // Find the sidebar navigation element
    const desktopNav = document.querySelector('nav[aria-label="Menu principal"]');
    const mobileNav = document.querySelector('nav[aria-label="Menu principal mobile"]');
    const nav = desktopNav || mobileNav;

    if (nav) {
      // Save current scroll position before navigation
      const saveScrollPosition = () => {
        scrollPositionRef.current = nav.scrollTop;
      };

      // Restore scroll position after navigation
      const restoreScrollPosition = () => {
        requestAnimationFrame(() => {
          if (nav) {
            nav.scrollTop = scrollPositionRef.current;
          }
        });
      };

      // Save scroll position on every scroll
      nav.addEventListener('scroll', saveScrollPosition);

      // Restore scroll position after route change
      restoreScrollPosition();

      return () => {
        nav.removeEventListener('scroll', saveScrollPosition);
      };
    }
  }, [location.pathname]);

  return scrollPositionRef;
}
