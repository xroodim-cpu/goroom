import { useState, useEffect } from 'react';

export default function useBreakpoint() {
  const calc = () => window.innerWidth <= 480 ? 'mobile' : window.innerWidth <= 1024 ? 'tablet' : 'desktop';
  const [bp, setBp] = useState(calc);
  useEffect(() => { const h = () => setBp(calc()); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return bp;
}
