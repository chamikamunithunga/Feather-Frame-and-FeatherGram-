import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTopOnRouteChange = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there's a hash (like #ai-section), scroll to that element
    if (hash) {
      // Small delay to ensure the page has rendered
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    } else {
      // No hash, scroll to top
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Use instant for immediate scroll
      });
    }
  }, [pathname, hash]); // Dependency on both pathname and hash

  return null; // This component doesn't render anything
};

export default ScrollToTopOnRouteChange; 