import { lazy, Suspense, useEffect, useState, type RefObject } from "react";

const LetterGlitch = lazy(() => import("./LetterGlitch"));

export function GlitchBackground({ heroRef }: { heroRef: RefObject<HTMLElement | null> }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <LetterGlitch
        glitchColors={["#16301f", "#4ade80", "#38d9c4"]}
        glitchSpeed={60}
        centerVignette={false}
        outerVignette
        smooth
        interactionRadius={150}
        interactionBounds={() => heroRef.current?.getBoundingClientRect() ?? null}
      />
    </Suspense>
  );
}
