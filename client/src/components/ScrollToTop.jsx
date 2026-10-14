import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollToTop ensures every route transition (especially opening a product detail page)
 * starts cleanly at the top of the viewport (0, 0), while respecting browser POP (back/forward)
 * navigation where browser history restoration is appropriate.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Only scroll to top on new navigations (PUSH/REPLACE).
    // On POP (browser Back / Forward buttons), let browser handle scroll restoration.
    if (navType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);

  return null;
}
