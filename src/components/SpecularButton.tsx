import { useRef, useEffect } from "react";
import { Renderer, Program, Mesh, Triangle, Color } from "ogl";
import "./SpecularButton.css";

const PAD = 20;

// One window-level pointer listener shared by every button on the page instead
// of one per instance — this component is used ~7 times in the hero//page.
type PointerSubscriber = (x: number, y: number) => void;
const pointerSubscribers = new Set<PointerSubscriber>();
let pointerListenerAttached = false;

const dispatchPointer = (e: PointerEvent) => {
  for (const fn of pointerSubscribers) fn(e.clientX, e.clientY);
};

function subscribeToPointer(fn: PointerSubscriber) {
  pointerSubscribers.add(fn);
  if (!pointerListenerAttached && typeof window !== "undefined") {
    window.addEventListener("pointermove", dispatchPointer, { passive: true });
    pointerListenerAttached = true;
  }
  return () => {
    pointerSubscribers.delete(fn);
    if (pointerSubscribers.size === 0 && pointerListenerAttached) {
      window.removeEventListener("pointermove", dispatchPointer);
      pointerListenerAttached = false;
    }
  };
}

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float shapeSDF(vec2 p) { return sdRoundedRect(p, uHalfSize, uRadius); }

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = shapeSDF(p);

  vec2 L = vec2(cos(uAngle), sin(uAngle));

  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;

  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);

  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;

  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
}
`;

type Props = {
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  radius?: number;
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  textColor?: string;
  lineColor?: string;
  baseColor?: string;
  intensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler;
  className?: string;
  type?: "button" | "submit" | "reset";
  /** Render as an anchor instead of a button. */
  href?: string;
  target?: string;
  rel?: string;
};

const SpecularButton = ({
  children = "Get Started",
  size = "lg",
  radius = 18,
  tint = "#ffffff",
  tintOpacity = 0,
  blur = 0,
  textColor = "#f5f5f5",
  lineColor = "#ffffff",
  baseColor = "#525252",
  intensity = 1,
  shineSize = 10,
  shineFade = 40,
  thickness = 1,
  speed = 0.35,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
  disabled = false,
  onClick,
  className = "",
  type = "button",
  href,
  target,
  rel,
}: Props) => {
  const btnRef = useRef<HTMLElement | null>(null);
  const fxRef = useRef<HTMLSpanElement | null>(null);
  const propsRef = useRef<any>({});
  propsRef.current = {
    radius,
    lineColor,
    baseColor,
    intensity,
    shineSize,
    shineFade,
    thickness,
    speed,
    followMouse,
    proximity,
    autoAnimate,
  };

  useEffect(() => {
    const btn = btnRef.current;
    const fx = fxRef.current;
    if (!btn || !fx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      dpr,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) delete (geometry.attributes as any).uv;

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uCenter: { value: [0, 0] },
        uHalfSize: { value: [1, 1] },
        uRadius: { value: 0 },
        uAngle: { value: 2.4 },
        uPx: { value: dpr },
        uLineColor: { value: [1, 1, 1] },
        uBaseColor: { value: [0.32, 0.32, 0.32] },
        uIntensity: { value: 1 },
        uShineSize: { value: 0.17 },
        uShineFade: { value: 0.7 },
        uThickness: { value: 1 },
        uBaseWidth: { value: dpr },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    fx.appendChild(gl.canvas);

    const sizeRef = { w: 1, h: 1 };

    // Cached viewport box so pointer handling never reads layout. Refreshed
    // wherever the box can actually move: resize and scroll.
    let boxLeft = 0;
    let boxTop = 0;
    let boxRight = 0;
    let boxBottom = 0;
    const readBox = () => {
      const rect = btn.getBoundingClientRect();
      boxLeft = rect.left;
      boxTop = rect.top;
      boxRight = rect.right;
      boxBottom = rect.bottom;
      return rect;
    };

    const resize = () => {
      const rect = readBox();
      const w = rect.width;
      const h = rect.height;
      sizeRef.w = w;
      sizeRef.h = h;
      renderer.setSize(w + PAD * 2, h + PAD * 2);
      program.uniforms.uCenter.value = [(PAD + w / 2) * dpr, (PAD + h / 2) * dpr];
      program.uniforms.uHalfSize.value = [(w / 2) * dpr, (h / 2) * dpr];
    };

    const ro = new ResizeObserver(resize);
    ro.observe(btn);
    resize();

    let pointerAngle: number | null = null;
    let proximityT = 0;

    const onPointer = (px: number, py: number) => {
      const width = boxRight - boxLeft;
      const height = boxBottom - boxTop;
      if (width <= 0 || height <= 0) return;
      const cx = boxLeft + width / 2;
      const cy = boxTop + height / 2;
      const dx = Math.max(boxLeft - px, 0, px - boxRight);
      const dy = Math.max(boxTop - py, 0, py - boxBottom);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) {
        const nx = (px - cx) / (width / 2);
        const ny = (cy - py) / (height / 2);
        pointerAngle = Math.atan2(2 / height, -2 / width) + nx * 0.3 + ny * 0.15;
      } else {
        pointerAngle = Math.atan2(cy - py, px - cx);
      }

      const t = Math.max(0, 1 - dist / Math.max(propsRef.current.proximity, 1));
      proximityT = t * t * (3 - 2 * t);
      // A pointer that can influence this button wakes the loop back up.
      if (proximityT > 0) sync();
    };

    const unsubscribePointer = subscribeToPointer(onPointer);
    const onScroll = () => readBox();
    window.addEventListener("scroll", onScroll, { passive: true });

    let angle = 2.4;
    let idleAngle = 2.4;
    let bright = 0;
    let last = performance.now();
    let raf = 0;
    let isOnScreen = true;
    let isPageVisible = !document.hidden;
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Colour props are static in practice; parse them only when they change
    // rather than allocating and re-parsing two Colors every frame.
    const lineC = new Color();
    const baseC = new Color();
    let lastLineColor = "";
    let lastBaseColor = "";
    const lineUniform = program.uniforms.uLineColor.value as number[];
    const baseUniform = program.uniforms.uBaseColor.value as number[];

    /**
     * With uIntensity at 0 the shader's highlight term vanishes and the output
     * depends only on the geometry — so once the glow has faded out there is
     * nothing left for a new frame to change, and the loop can stop until the
     * pointer comes back.
     */
    const IDLE_EPSILON = 0.001;
    const isIdle = () =>
      !propsRef.current.autoAnimate && bright < IDLE_EPSILON && proximityT < IDLE_EPSILON;

    const renderFrame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const p = propsRef.current;

      idleAngle += p.speed * dt;
      const steer = p.followMouse && pointerAngle != null && (!p.autoAnimate || proximityT > 0);
      const target = steer ? (pointerAngle as number) : idleAngle;
      const diff = ((target - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      angle += diff * (1 - Math.exp(-dt * 7));

      const brightTarget = p.autoAnimate ? 1 : proximityT;
      bright += (brightTarget - bright) * (1 - Math.exp(-dt * 8));
      if (bright < IDLE_EPSILON) bright = 0;

      if (p.lineColor !== lastLineColor) {
        lineC.set(p.lineColor);
        lastLineColor = p.lineColor;
        lineUniform[0] = lineC.r;
        lineUniform[1] = lineC.g;
        lineUniform[2] = lineC.b;
      }
      if (p.baseColor !== lastBaseColor) {
        baseC.set(p.baseColor);
        lastBaseColor = p.baseColor;
        baseUniform[0] = baseC.r;
        baseUniform[1] = baseC.g;
        baseUniform[2] = baseC.b;
      }

      program.uniforms.uAngle.value = angle;
      program.uniforms.uRadius.value =
        Math.min(p.radius, Math.min(sizeRef.w, sizeRef.h) / 2) * dpr;
      program.uniforms.uIntensity.value = p.intensity * bright;
      program.uniforms.uShineSize.value = (p.shineSize * Math.PI) / 180;
      program.uniforms.uShineFade.value = (p.shineFade * Math.PI) / 180;
      program.uniforms.uThickness.value = p.thickness * dpr;

      renderer.render({ scene: mesh });
    };

    const update = (now: number) => {
      renderFrame(now);
      if (isIdle()) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(update);
    };

    const running = () => isOnScreen && isPageVisible && !reduceMotion;
    const start = () => {
      if (raf === 0 && running() && !isIdle()) {
        last = performance.now();
        raf = requestAnimationFrame(update);
      }
    };
    const stop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    function sync() {
      if (running()) start();
      else stop();
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        isOnScreen = entry.isIntersecting;
        readBox();
        sync();
      },
      { threshold: 0 },
    );
    io.observe(btn);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Paint the settled state once so the button is correct while idle.
    renderFrame(performance.now());
    sync();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      unsubscribePointer();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      if (gl.canvas.parentNode === fx) fx.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  const style = {
    "--sb-radius": `${radius}px`,
    "--sb-tint": tint,
    "--sb-tint-opacity": tintOpacity,
    "--sb-blur": `${blur}px`,
    "--sb-text-color": textColor,
  } as React.CSSProperties;

  const classes = `specular-button specular-button--${size}${className ? ` ${className}` : ""}`;

  const inner = (
    <>
      <span ref={fxRef} className="specular-button__fx" aria-hidden="true" />
      <span className="specular-button__label">{children}</span>
    </>
  );

  if (href) {
    return (
      <a
        ref={btnRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        className={classes}
        style={style}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={btnRef as React.RefObject<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classes}
      style={style}
    >
      {inner}
    </button>
  );
};

export default SpecularButton;
