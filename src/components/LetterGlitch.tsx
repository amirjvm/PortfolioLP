import { useEffect, useMemo, useRef } from "react";

type Props = {
  glitchColors?: string[];
  className?: string;
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  characters?: string;
  /** Region (in viewport coords) where the pointer may disturb the letters. */
  interactionBounds?: () => DOMRect | null;
  /** Radius in px around the cursor that gets scrambled. */
  interactionRadius?: number;
  /** Stop the loop entirely — e.g. the layer has faded out of view. */
  paused?: boolean;
};

const FONT_SIZE = 16;
const CHAR_WIDTH = 10;
const CHAR_HEIGHT = 20;
// A fade runs in this many discrete steps, which lets every colour the canvas
// can ever paint be precomputed into a lookup table instead of interpolated
// (and re-stringified) per letter per frame.
const FADE_STEPS = 20;
// Glyph rasterisation cost scales with device pixels; a decorative noise field
// gains nothing from a 3x backing store on a phone.
const MAX_DPR = 2;

const hexToRgb = (hex: string) => {
  const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const full = hex.replace(shorthand, (_m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(full);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
};

/**
 * Every colour a letter can hold is `from -> to` at one of FADE_STEPS+1 steps,
 * so the whole space is a few hundred strings. Build them once.
 */
function buildColorTable(colors: string[]) {
  const rgb = colors.map(hexToRgb);
  const n = rgb.length;
  const table = new Array<string>(n * n * (FADE_STEPS + 1));
  for (let from = 0; from < n; from++) {
    for (let to = 0; to < n; to++) {
      for (let step = 0; step <= FADE_STEPS; step++) {
        const f = step / FADE_STEPS;
        const r = Math.round(rgb[from].r + (rgb[to].r - rgb[from].r) * f);
        const g = Math.round(rgb[from].g + (rgb[to].g - rgb[from].g) * f);
        const b = Math.round(rgb[from].b + (rgb[to].b - rgb[from].b) * f);
        table[(from * n + to) * (FADE_STEPS + 1) + step] = `rgb(${r}, ${g}, ${b})`;
      }
    }
  }
  return table;
}

const LetterGlitch = ({
  glitchColors = ["#1b3326", "#4ade80", "#38d9c4"],
  className = "",
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789",
  interactionBounds,
  interactionRadius = 130,
  paused = false,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boundsRef = useRef(interactionBounds);
  boundsRef.current = interactionBounds;
  const pausedRef = useRef(paused);
  // Set by the canvas effect so the `paused` effect can re-evaluate the run
  // gate without tearing the canvas down and rebuilding the grid.
  const syncRef = useRef<() => void>(() => {});

  const charset = useMemo(() => Array.from(characters), [characters]);
  const colorTable = useMemo(() => buildColorTable(glitchColors), [glitchColors]);

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const paletteSize = glitchColors.length;
    const stride = FADE_STEPS + 1;
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let columns = 0;
    let rows = 0;
    let count = 0;

    // Letter state as parallel typed arrays: no per-frame object churn.
    let chars = new Uint8Array(0);
    let fromColor = new Uint8Array(0);
    let toColor = new Uint8Array(0);
    let step = new Uint8Array(0);

    // Only cells that actually changed get repainted, so the per-frame cost
    // tracks the number of glitching letters rather than the whole grid.
    let dirtyFlag = new Uint8Array(0);
    let dirtyList = new Int32Array(0);
    let dirtyCount = 0;

    // Letters mid-fade, so the fade pass never scans the full grid.
    let fadingFlag = new Uint8Array(0);
    let fadingList = new Int32Array(0);
    let fadingCount = 0;

    const randomChar = () => (Math.random() * charset.length) | 0;
    const randomColor = () => (Math.random() * paletteSize) | 0;

    const markDirty = (i: number) => {
      if (dirtyFlag[i]) return;
      dirtyFlag[i] = 1;
      dirtyList[dirtyCount++] = i;
    };

    const markFading = (i: number) => {
      if (fadingFlag[i]) return;
      fadingFlag[i] = 1;
      fadingList[fadingCount++] = i;
    };

    const allocate = (cols: number, rws: number) => {
      columns = cols;
      rows = rws;
      count = cols * rws;
      chars = new Uint8Array(count);
      fromColor = new Uint8Array(count);
      toColor = new Uint8Array(count);
      step = new Uint8Array(count);
      dirtyFlag = new Uint8Array(count);
      dirtyList = new Int32Array(count);
      fadingFlag = new Uint8Array(count);
      fadingList = new Int32Array(count);
      dirtyCount = 0;
      fadingCount = 0;

      for (let i = 0; i < count; i++) {
        chars[i] = randomChar();
        const c = randomColor();
        fromColor[i] = c;
        toColor[i] = c;
        step[i] = FADE_STEPS;
      }
    };

    const colorOf = (i: number) =>
      colorTable[(fromColor[i] * paletteSize + toColor[i]) * stride + step[i]];

    const drawCell = (i: number) => {
      const x = (i % columns) * CHAR_WIDTH;
      const y = ((i / columns) | 0) * CHAR_HEIGHT;
      ctx.clearRect(x, y, CHAR_WIDTH, CHAR_HEIGHT);
      ctx.fillStyle = colorOf(i);
      ctx.fillText(charset[chars[i]], x, y);
    };

    const drawAll = () => {
      ctx.clearRect(0, 0, columns * CHAR_WIDTH, rows * CHAR_HEIGHT);
      for (let i = 0; i < count; i++) drawCell(i);
      dirtyCount = 0;
      dirtyFlag.fill(0);
    };

    const flushDirty = () => {
      for (let d = 0; d < dirtyCount; d++) {
        const i = dirtyList[d];
        dirtyFlag[i] = 0;
        drawCell(i);
      }
      dirtyCount = 0;
    };

    const scramble = (i: number) => {
      chars[i] = randomChar();
      fromColor[i] = toColor[i];
      toColor[i] = randomColor();
      if (smooth && !reduceMotion) {
        step[i] = 0;
        markFading(i);
      } else {
        step[i] = FADE_STEPS;
      }
      markDirty(i);
    };

    const glitchTick = () => {
      const updates = Math.max(1, (count * 0.05) | 0);
      for (let i = 0; i < updates; i++) scramble((Math.random() * count) | 0);
    };

    const advanceFades = () => {
      let write = 0;
      for (let r = 0; r < fadingCount; r++) {
        const i = fadingList[r];
        const next = step[i] + 1;
        step[i] = next;
        markDirty(i);
        if (next < FADE_STEPS) {
          fadingList[write++] = i;
        } else {
          fadingFlag[i] = 0;
        }
      }
      fadingCount = write;
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.textBaseline = "top";

      allocate(
        Math.max(1, Math.ceil(rect.width / CHAR_WIDTH)),
        Math.max(1, Math.ceil(rect.height / CHAR_HEIGHT)),
      );
      drawAll();
    };

    resize();

    let raf = 0;
    let lastGlitch = 0;
    let isOnScreen = true;
    let isPageVisible = !document.hidden;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (lastGlitch === 0) lastGlitch = now;
      if (now - lastGlitch >= glitchSpeed) {
        glitchTick();
        lastGlitch = now;
      }
      if (smooth && !reduceMotion) advanceFades();
      if (dirtyCount > 0) flushDirty();
    };

    const running = () => isOnScreen && isPageVisible && !pausedRef.current && !reduceMotion;

    const start = () => {
      if (raf === 0 && running()) {
        lastGlitch = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const sync = () => (running() ? start() : stop());
    syncRef.current = sync;

    const io = new IntersectionObserver(
      ([entry]) => {
        isOnScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(parent);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        stop();
        resize();
        sync();
      }, 120);
    };
    window.addEventListener("resize", onResize);

    // Pointer scrambling is coalesced into one rAF so a high-rate mouse cannot
    // drive more scrambles than there are frames to draw them.
    let pointerX = 0;
    let pointerY = 0;
    let pointerPending = false;
    let pointerRaf = 0;

    const applyPointer = () => {
      pointerRaf = 0;
      if (!pointerPending) return;
      pointerPending = false;

      const getBounds = boundsRef.current;
      if (!getBounds) return;
      const bounds = getBounds();
      if (
        !bounds ||
        pointerX < bounds.left ||
        pointerX > bounds.right ||
        pointerY < bounds.top ||
        pointerY > bounds.bottom
      )
        return;

      // The canvas fills a fixed, full-viewport layer, so its origin is the
      // viewport origin — no getBoundingClientRect needed per move.
      const col = (pointerX / CHAR_WIDTH) | 0;
      const row = (pointerY / CHAR_HEIGHT) | 0;
      const colRadius = Math.ceil(interactionRadius / CHAR_WIDTH);
      const rowRadius = Math.ceil(interactionRadius / CHAR_HEIGHT);

      for (let r = row - rowRadius; r <= row + rowRadius; r++) {
        if (r < 0 || r >= rows) continue;
        for (let c = col - colRadius; c <= col + colRadius; c++) {
          if (c < 0 || c >= columns) continue;
          const dx = (c - col) * CHAR_WIDTH;
          const dy = (r - row) * CHAR_HEIGHT;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > interactionRadius) continue;
          if (Math.random() > 1 - dist / interactionRadius) continue;
          scramble(r * columns + c);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!running()) return;
      pointerX = e.clientX;
      pointerY = e.clientY;
      pointerPending = true;
      if (pointerRaf === 0) pointerRaf = requestAnimationFrame(applyPointer);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    sync();

    return () => {
      stop();
      syncRef.current = () => {};
      if (pointerRaf) cancelAnimationFrame(pointerRaf);
      clearTimeout(resizeTimer);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [glitchSpeed, smooth, interactionRadius, charset, colorTable, glitchColors.length]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full" />
      {outerVignette && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%)",
          }}
        />
      )}
      {centerVignette && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
      )}
    </div>
  );
};

export default LetterGlitch;
