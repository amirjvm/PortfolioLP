import { lazy, Suspense, useEffect, useRef, useState, type RefObject } from "react";

const LetterGlitch = lazy(() => import("./LetterGlitch"));
const Grainient = lazy(() => import("./Grainient"));

/**
 * Fixed page background: LetterGlitch owns the hero, a Grainient gradient owns
 * everything below it, cross-fading smoothly as you scroll out of the hero.
 */
export function SceneBackground({ heroRef }: { heroRef: RefObject<HTMLElement | null> }) {
  const [mounted, setMounted] = useState(false);
  const glitchLayer = useRef<HTMLDivElement | null>(null);
  const gradientLayer = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const hero = heroRef.current;
      const span = Math.max(1, (hero?.offsetHeight ?? window.innerHeight) * 0.75);
      const p = Math.min(1, Math.max(0, window.scrollY / span));
      const eased = p * p * (3 - 2 * p);
      if (glitchLayer.current) glitchLayer.current.style.opacity = String(0.45 * (1 - eased));
      if (gradientLayer.current) gradientLayer.current.style.opacity = String(eased);
    };
    const onScroll = () => {
      if (raf === 0) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mounted, heroRef]);

  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <div ref={gradientLayer} className="absolute inset-0 opacity-0">
        <Grainient
          color1="#6ee7a0"
          color2="#0b3524"
          color3="#04120c"
          timeSpeed={0.18}
          warpSpeed={1.2}
          rotationAmount={320}
          grainAmount={0.09}
          contrast={1.35}
          saturation={1.05}
          zoom={0.9}
        />
      </div>
      <div ref={glitchLayer} className="absolute inset-0 opacity-45">
        <LetterGlitch
          glitchColors={["#16301f", "#4ade80", "#38d9c4"]}
          glitchSpeed={60}
          centerVignette={false}
          outerVignette
          smooth
          interactionRadius={150}
          interactionBounds={() => heroRef.current?.getBoundingClientRect() ?? null}
        />
      </div>
    </Suspense>
  );
}
