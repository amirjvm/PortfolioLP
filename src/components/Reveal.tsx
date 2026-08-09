import { useEffect, useRef, useState, type ReactNode } from "react";

const OPTIONS: IntersectionObserverInit = { threshold: 0.15, rootMargin: "0px 0px -8% 0px" };

// One observer shared by every Reveal on the page. The component is used ~13
// times, and a single observer batches all of their callbacks into one task.
let sharedObserver: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function getObserver() {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const onShow = callbacks.get(entry.target);
        if (onShow) {
          callbacks.delete(entry.target);
          sharedObserver?.unobserve(entry.target);
          onShow();
        }
      }
    }, OPTIONS);
  }
  return sharedObserver;
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Nothing to observe if motion is reduced — show it immediately.
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }

    const observer = getObserver();
    callbacks.set(el, () => setShown(true));
    observer.observe(el);

    return () => {
      callbacks.delete(el);
      observer.unobserve(el);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "reveal-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
