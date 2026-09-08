import { useEffect } from "react";
import Lenis from "lenis";

// The live instance, so callers outside the anchor handler (the mobile menu)
// can scroll with the same smoothing instead of jumping.
let active: Lenis | null = null;

/** Null when smooth scrolling is off — reduced motion, or not mounted yet. */
export const getLenis = () => active;

export function useLenis() {
  useEffect(() => {
    // Respect the OS setting: smooth scrolling is exactly the kind of motion
    // "reduce motion" is asking us to drop.
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    active = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf === 0) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    start();

    // A backgrounded tab still schedules rAF in some conditions; nothing here
    // needs to run while the page is hidden.
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    // Animate in-page anchor clicks instead of jumping there instantly.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash) as HTMLElement | null;
      if (!target) return;

      e.preventDefault();
      lenis.scrollTo(target, {
        offset: -96,
        duration: 1.3,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
      });
      // The hash is deliberately NOT written to the URL: it would make the
      // next reload jump straight back down to that section.
    };

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
      lenis.destroy();
      active = null;
    };
  }, []);
}
