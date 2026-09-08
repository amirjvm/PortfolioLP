import { useEffect, useRef } from "react";

/** rAF-throttled scroll listener; callback fires with window.scrollY. */
export function useScrollY(callback: (scrollY: number) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        callbackRef.current(window.scrollY);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}
