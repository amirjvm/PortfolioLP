import { lazy, Suspense, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useScrollY } from "@/hooks/use-scroll";

const CRTWarp = lazy(() => import("./CRTWarp"));

/** Below this opacity the layer contributes nothing visible, so stop drawing it. */
const VISIBLE_EPSILON = 0.01;

/**
 * Fixed page background. CRTWarp owns the hero and nothing else: past the
 * hero the page sits on an opaque black panel, so the field is faded out and
 * its loop stopped rather than drawn underneath something that hides it.
 */
export function SceneBackground({ heroRef }: { heroRef: RefObject<HTMLElement | null> }) {
  const [mounted, setMounted] = useState(false);
  const glitchLayer = useRef<HTMLDivElement | null>(null);
  const [glitchPaused, setGlitchPaused] = useState(false);
  // Mirror of the React state so the scroll path only calls setState when the
  // layer actually crosses its visibility threshold, not on every frame.
  const glitchOffRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const onScroll = useCallback(
    (scrollY: number) => {
      const hero = heroRef.current;
      const span = Math.max(1, (hero?.offsetHeight ?? window.innerHeight) * 0.75);
      const p = Math.min(1, Math.max(0, scrollY / span));
      const eased = p * p * (3 - 2 * p);
      const glitchOpacity = 0.45 * (1 - eased);

      if (glitchLayer.current) glitchLayer.current.style.opacity = String(glitchOpacity);

      const nextGlitchOff = glitchOpacity <= VISIBLE_EPSILON;
      if (nextGlitchOff !== glitchOffRef.current) {
        glitchOffRef.current = nextGlitchOff;
        setGlitchPaused(nextGlitchOff);
      }
    },
    [heroRef],
  );

  useScrollY(onScroll);

  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <div ref={glitchLayer} className="absolute inset-0 opacity-45">
        <CRTWarp
          color="#22c55e"
          backgroundColor="#050a08"
          speed={0.35}
          curvature={0.2}
          scanlineStrength={0.2}
          bloom={1.2}
          brightness={1.1}
          vignette={0.4}
          mouseStrength={0.3}
          dpr={1}
          fps={30}
          paused={glitchPaused}
        />
      </div>
    </Suspense>
  );
}
