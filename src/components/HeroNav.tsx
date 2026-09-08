import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUpRight, Github, Mail, Menu, X } from "lucide-react";
import { useCallback, useRef, useState, type RefObject } from "react";
import { getLenis } from "@/hooks/use-lenis";
import { useScrollY } from "@/hooks/use-scroll";

type NavItem = { id: string; label: string };

/** Matches the offset the anchor handler in use-lenis scrolls to. */
const SCROLL_OFFSET = -96;

const PILL =
  "inline-flex items-center justify-center rounded-full border border-border bg-background/60 text-foreground backdrop-blur-md transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none";

export function HeroNav({
  items,
  heroRef,
}: {
  items: NavItem[];
  heroRef: RefObject<HTMLElement | null>;
}) {
  const navRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const onScroll = useCallback(
    (scrollY: number) => {
      const hero = heroRef.current;
      const span = Math.max(1, (hero?.offsetHeight ?? window.innerHeight) * 0.75);
      const p = Math.min(1, Math.max(0, scrollY / span));
      const eased = p * p * (3 - 2 * p);

      const nav = navRef.current;
      if (nav) {
        nav.style.opacity = String(1 - eased);
        nav.style.pointerEvents = eased >= 1 ? "none" : "auto";
      }
    },
    [heroRef],
  );

  useScrollY(onScroll);

  const goTo = (id: string) => {
    setOpen(false);
    const target = document.getElementById(id);
    if (!target) return;

    // The dialog locks body scroll while it is open, so let it close first.
    window.setTimeout(() => {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(target, {
          offset: SCROLL_OFFSET,
          duration: 1.3,
          easing: (t: number) => 1 - Math.pow(1 - t, 4),
        });
      } else {
        // No Lenis means reduced motion — jump, don't animate.
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY + SCROLL_OFFSET,
        });
      }
      // No hash written to the URL, so a reload still starts at the top.
    }, 200);
  };

  return (
    <>
      {/* Desktop — lives with the hero and dissolves once you scroll past it */}
      <nav
        ref={navRef}
        className="fixed inset-x-0 top-0 z-20 hidden justify-center px-5 pt-6 sm:flex"
      >
        <ul className="flex w-max items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-2 backdrop-blur-md">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="block rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile — the menu is the only way to navigate here, so it never fades out */}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Trigger
          aria-label="Open menu"
          className={`${PILL} fixed top-4 right-4 z-30 size-11 sm:hidden`}
        >
          <Menu className="size-5" />
        </DialogPrimitive.Trigger>

        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-background/70 backdrop-blur-xl duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 sm:hidden" />

          <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col px-6 pt-20 pb-10 duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 sm:hidden">
            <DialogPrimitive.Title className="sr-only">Site navigation</DialogPrimitive.Title>

            <DialogPrimitive.Close
              aria-label="Close menu"
              className={`${PILL} absolute top-4 right-4 size-11`}
            >
              <X className="size-5" />
            </DialogPrimitive.Close>

            <nav className="flex flex-col">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(item.id)}
                  style={{ animationDelay: `${80 + i * 35}ms` }}
                  className="menu-row-in group flex w-full items-center justify-between gap-4 border-b border-border/60 py-5 text-left transition-transform duration-150 ease-out active:scale-[0.98]"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-[11px] tracking-[0.3em] text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-2xl font-semibold text-foreground">{item.label}</span>
                  </span>
                  <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-active:-translate-y-0.5 group-active:translate-x-0.5" />
                </button>
              ))}
            </nav>

            <div
              className="menu-row-in mt-auto flex flex-wrap items-center gap-3 pt-10"
              style={{ animationDelay: `${80 + items.length * 35}ms` }}
            >
              <a
                href="https://github.com/amirjvm"
                target="_blank"
                rel="noreferrer noopener"
                className={`${PILL} gap-2 px-4 py-2.5 text-xs font-medium`}
              >
                <Github className="size-4" />
                GitHub
              </a>
              <a
                href="mailto:abbasigudarzi@gmail.com"
                className={`${PILL} gap-2 px-4 py-2.5 text-xs font-medium`}
              >
                <Mail className="size-4" />
                Email
              </a>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
