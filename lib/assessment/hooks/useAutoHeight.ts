'use client';

import { useEffect, useState } from 'react';

export default function useAutoHeight(ref: React.RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const getMaxHeight = () => {
      if (window.matchMedia('(max-width: 639px)').matches) {
        return element.scrollHeight;
      }
      const viewportPadding = 56;
      const rect = element.getBoundingClientRect();
      const available = window.innerHeight - rect.top - viewportPadding;
      return Math.max(320, available);
    };

    let frame = 0;
    const updateHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const maxHeight = getMaxHeight();
        const nextHeight = Math.min(element.scrollHeight, maxHeight);
        setHeight(nextHeight);
      });
    };

    updateHeight();

    const handleResize = () => updateHeight();
    window.addEventListener('resize', handleResize);

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateHeight());
      observer.observe(element);
      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        window.removeEventListener('resize', handleResize);
      };
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
    };
  }, [ref]);

  return height;
}
