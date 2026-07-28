import { useRef, useEffect } from "react";

type Letter = {
  char: string;
  color: string;
  targetColor: string;
  colorProgress: number;
};

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
};

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
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  const letters = useRef<Letter[]>([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const lastGlitchTime = useRef(Date.now());
  const boundsRef = useRef(interactionBounds);
  boundsRef.current = interactionBounds;

  const lettersAndSymbols = Array.from(characters);

  const fontSize = 16;
  const charWidth = 10;
  const charHeight = 20;

  const getRandomChar = () =>
    lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];

  const getRandomColor = () => glitchColors[Math.floor(Math.random() * glitchColors.length)];

  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const interpolateColor = (
    start: { r: number; g: number; b: number },
    end: { r: number; g: number; b: number },
    factor: number,
  ) =>
    `rgb(${Math.round(start.r + (end.r - start.r) * factor)}, ${Math.round(
      start.g + (end.g - start.g) * factor,
    )}, ${Math.round(start.b + (end.b - start.b) * factor)})`;

  const initializeLetters = (columns: number, rows: number) => {
    grid.current = { columns, rows };
    letters.current = Array.from({ length: columns * rows }, () => ({
      char: getRandomChar(),
      color: getRandomColor(),
      targetColor: getRandomColor(),
      colorProgress: 1,
    }));
  };

  const drawLetters = () => {
    const canvas = canvasRef.current;
    if (!context.current || !canvas || letters.current.length === 0) return;
    const ctx = context.current;
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";

    letters.current.forEach((letter, index) => {
      const x = (index % grid.current.columns) * charWidth;
      const y = Math.floor(index / grid.current.columns) * charHeight;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    });
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    context.current?.setTransform(dpr, 0, 0, dpr, 0, 0);

    initializeLetters(Math.ceil(rect.width / charWidth), Math.ceil(rect.height / charHeight));
    drawLetters();
  };

  const updateLetters = () => {
    if (letters.current.length === 0) return;
    const updateCount = Math.max(1, Math.floor(letters.current.length * 0.05));
    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * letters.current.length);
      const letter = letters.current[index];
      if (!letter) continue;
      letter.char = getRandomChar();
      letter.targetColor = getRandomColor();
      if (!smooth) {
        letter.color = letter.targetColor;
        letter.colorProgress = 1;
      } else {
        letter.colorProgress = 0;
      }
    }
  };

  const handleSmoothTransitions = () => {
    let needsRedraw = false;
    letters.current.forEach((letter) => {
      if (letter.colorProgress < 1) {
        letter.colorProgress = Math.min(1, letter.colorProgress + 0.05);
        const startRgb = hexToRgb(letter.color) ?? parseRgb(letter.color);
        const endRgb = hexToRgb(letter.targetColor);
        if (startRgb && endRgb) {
          letter.color = interpolateColor(startRgb, endRgb, letter.colorProgress);
          needsRedraw = true;
        }
      }
    });
    if (needsRedraw) drawLetters();
  };

  const parseRgb = (value: string) => {
    const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(value);
    return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
  };

  const animate = () => {
    const now = Date.now();
    if (now - lastGlitchTime.current >= glitchSpeed) {
      updateLetters();
      drawLetters();
      lastGlitchTime.current = now;
    }
    if (smooth) handleSmoothTransitions();
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    context.current = canvas.getContext("2d");
    resizeCanvas();
    animate();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        cancelAnimationFrame(animationRef.current);
        resizeCanvas();
        animate();
      }, 100);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const getBounds = boundsRef.current;
      if (!getBounds) return;
      const bounds = getBounds();
      if (
        !bounds ||
        e.clientX < bounds.left ||
        e.clientX > bounds.right ||
        e.clientY < bounds.top ||
        e.clientY > bounds.bottom
      )
        return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const { columns, rows } = grid.current;
      const colRadius = Math.ceil(interactionRadius / charWidth);
      const rowRadius = Math.ceil(interactionRadius / charHeight);
      const col = Math.floor(x / charWidth);
      const row = Math.floor(y / charHeight);

      for (let r = row - rowRadius; r <= row + rowRadius; r++) {
        if (r < 0 || r >= rows) continue;
        for (let c = col - colRadius; c <= col + colRadius; c++) {
          if (c < 0 || c >= columns) continue;
          const dx = (c - col) * charWidth;
          const dy = (r - row) * charHeight;
          const dist = Math.hypot(dx, dy);
          if (dist > interactionRadius) continue;
          if (Math.random() > 1 - dist / interactionRadius) continue;
          const letter = letters.current[r * columns + c];
          if (!letter) continue;
          letter.char = getRandomChar();
          letter.targetColor = getRandomColor();
          letter.colorProgress = smooth ? 0 : 1;
          if (!smooth) letter.color = letter.targetColor;
        }
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glitchSpeed, smooth, interactionRadius]);

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
