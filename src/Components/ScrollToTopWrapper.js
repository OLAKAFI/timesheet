// components/ScrollToTopWrapper.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTopWrapper = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on every route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'smooth' for animated scrolling
    });
  }, [location.pathname]); // Trigger on route change

  return children;
};

export default ScrollToTopWrapper;