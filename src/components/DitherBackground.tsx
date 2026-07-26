import { lazy, Suspense, useEffect, useState } from "react";

const Dither = lazy(() => import("./Dither"));

export function DitherBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <Dither
        waveColor={[0.16, 0.5, 0.28]}
        disableAnimation={false}
        enableMouseInteraction
        mouseRadius={0.32}
        colorNum={3.5}
        waveAmplitude={0.07}
        waveFrequency={3}
        waveSpeed={0.035}
        pixelSize={2}
      />
    </Suspense>
  );
}
