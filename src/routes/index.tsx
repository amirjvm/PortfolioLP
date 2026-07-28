import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import BorderGlow from "@/components/BorderGlow";
import { GlitchBackground } from "@/components/GlitchBackground";
import { Reveal } from "@/components/Reveal";
import SpecularButton from "@/components/SpecularButton";
import { useLenis } from "@/hooks/use-lenis";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Amirali Abbasi — Java Backend Engineer" },
      {
        name: "description",
        content:
          "Java backend engineer in Tehran building APIs and services with Java, Spring Boot, PostgreSQL and clean architecture. Experience with KYC, payments and SMS notification systems.",
      },
      { property: "og:title", content: "Amirali Abbasi — Java Backend Engineer" },
      {
        property: "og:description",
        content:
          "Java & Spring Boot backend engineer focused on clean architecture, reliable data design and cloud-native services.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Portfolio,
});

const NAV = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

const GLOW = {
  edgeSensitivity: 25,
  glowColor: "40 80 80",
  backgroundColor: "oklch(0.19 0.025 158)",
  borderRadius: 24,
  glowRadius: 40,
  glowIntensity: 1,
  coneSpread: 25,
  colors: ["#6ee7a0", "#22c55e", "#38d9c4"],
};

const SKILL_GROUPS = [
  {
    title: "Language & Core",
    items: [
      "Java fundamentals",
      "OOP",
      "Interfaces",
      "Collections",
      "Exception handling",
      "Multithreading basics",
    ],
  },
  {
    title: "Spring Ecosystem",
    items: ["Spring Core", "DI / Beans / Context", "Spring Boot", "REST API", "Status codes", "Basic XML"],
  },
  {
    title: "Data",
    items: ["JPA", "Repositories", "Entity mapping", "ORM", "SQL", "PostgreSQL", "Basic ACID", "Caching basics"],
  },
  {
    title: "Tooling",
    items: ["Git", "IntelliJ IDEA", "Maven", "Apidog / Postman", "Basic Docker", "YAML"],
  },
  {
    title: "Frontend touch",
    items: ["HTML", "CSS / Tailwind", "Basic JavaScript"],
  },
];

const HIGHLIGHTS = [
  "Learned Java Core fundamentals and adapted to the company's Agile/Scrum task workflow during the ramp-up period",
  "Developed and integrated backend features using Spring and Spring Boot",
  "Integrated third-party APIs, including KYC (facial recognition) verification and payment gateway services",
  "Built inquiry / lookup services for various business use cases",
  "Designed and implemented an SMS notification system for a customer loyalty program, triggered by rule-based business logic",
];

function Portfolio() {
  useLenis();
  const heroRef = useRef<HTMLElement | null>(null);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Fixed generative background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 opacity-45">
          <GlitchBackground heroRef={heroRef} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_10%,var(--background)_78%)]" />

      </div>

      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-5">
        <nav className="glass-panel flex items-center gap-1 rounded-full border border-border px-2 py-2 text-sm">
          <a
            href="#top"
            className="rounded-full px-3 py-1.5 font-mono text-xs tracking-widest text-primary uppercase"
          >
            AA
          </a>
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      <div id="top" className="relative z-10 mx-auto w-full max-w-5xl px-5 sm:px-8">
        {/* Hero */}
        <section ref={heroRef} className="flex min-h-[88vh] flex-col justify-center py-24">
          <Reveal>
            <p className="font-mono text-xs tracking-[0.35em] text-primary uppercase">
              Tehran, Iran · Available for work
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-5xl leading-[0.95] font-semibold sm:text-7xl">
              <span className="text-gradient">Amirali Abbasi</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground sm:text-xl">
              Java backend engineer building APIs and services with{" "}
              <span className="text-foreground">Spring Boot</span>, relational data and clean
              architecture — and going deeper, not just broader.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:scale-105"
              >
                Get in touch
              </a>
              <a
                href="#experience"
                className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                See experience
              </a>
              <a
                href="https://github.com/abbasigudarzi"
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                GitHub
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <dl className="mt-16 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
              {[
                ["9 mo", "Industry experience"],
                ["Java · Spring Boot", "Main stack"],
                ["B.Eng", "Computer Engineering"],
                ["M.Sc", "Software Engineering (ongoing)"],
              ].map(([v, k]) => (
                <div key={k}>
                  <dt className="font-display text-xl whitespace-pre-line text-foreground">{v}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{k}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        {/* About */}
        <Section id="about" title="About me" kicker="01">
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal>
              <BorderGlow {...GLOW} animated className="h-full">
                <div className="p-7 sm:p-9">
                  <h3 className="text-lg font-semibold">Where I'm coming from</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    I spent 9 months at a software company as a Java backend developer. The first 4
                    months went into Java Core fundamentals and getting used to the team's
                    Scrum-based workflow. After that I moved onto Spring and Spring Boot tasks —
                    integrating third-party APIs like KYC facial recognition, payment services and
                    inquiry services. My last task there was an SMS notification system for a
                    customer loyalty program, triggered by business rules.
                  </p>
                </div>
              </BorderGlow>
            </Reveal>
            <Reveal delay={120}>
              <BorderGlow {...GLOW} className="h-full">
                <div className="p-7 sm:p-9">
                  <h3 className="text-lg font-semibold">Where I'm going</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    I want depth, not just breadth: understanding not only how to build APIs and
                    services with Java and Spring Boot, but why they work — data structures and
                    algorithms, SOLID, design patterns and DDD, reliable database design, secure and
                    well-tested systems. Beyond the application layer I'm expanding into cloud
                    infrastructure, containerization, CI/CD and distributed systems, and I strongly
                    prefer learning inside a real team.
                  </p>
                </div>
              </BorderGlow>
            </Reveal>
          </div>
        </Section>

        {/* Experience */}
        <Section id="experience" title="Experience" kicker="02">
          <Reveal>
            <BorderGlow {...GLOW}>
              <div className="p-7 sm:p-10">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">Junior Java Backend Developer (Intern)</h3>
                    <p className="mt-1 text-sm text-primary">Electronic Taban Software Company</p>
                  </div>
                  <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                    2025 — 2026 · 9 months
                  </p>
                </div>
                <ul className="mt-7 space-y-4">
                  {HIGHLIGHTS.map((h) => (
                    <li key={h} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </BorderGlow>
          </Reveal>
        </Section>

        {/* Skills */}
        <Section id="skills" title="Skills" kicker="03">
          <div className="grid gap-5 sm:grid-cols-2">
            {SKILL_GROUPS.map((group, i) => (
              <Reveal key={group.title} delay={i * 80}>
                <BorderGlow {...GLOW} borderRadius={20} glowRadius={30} className="h-full">
                  <div className="p-6 sm:p-7">
                    <h3 className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
                      {group.title}
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.items.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </BorderGlow>
              </Reveal>
            ))}
            <Reveal delay={SKILL_GROUPS.length * 80}>
              <BorderGlow {...GLOW} borderRadius={20} glowRadius={30} className="h-full">
                <div className="p-6 sm:p-7">
                  <h3 className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
                    Languages
                  </h3>
                  <div className="mt-5">
                    <div className="flex items-baseline justify-between text-sm">
                      <span>English</span>
                      <span className="text-muted-foreground">70%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[70%] rounded-full bg-primary" />
                    </div>
                    <div className="mt-5 flex items-baseline justify-between text-sm">
                      <span>Persian</span>
                      <span className="text-muted-foreground">Native</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-full rounded-full bg-primary" />
                    </div>
                  </div>
                </div>
              </BorderGlow>
            </Reveal>
          </div>
        </Section>

        {/* Education */}
        <Section id="education" title="Education" kicker="04">
          <div className="grid gap-5 md:grid-cols-2">
            {[
              {
                degree: "Master's Degree in Software Engineering",
                school: "Islamic Azad University, Electronic Campus (Tehran)",
                years: "2025 — present",
              },
              {
                degree: "Computer Engineering",
                school: "Technical and Vocational University of Khorramabad (TVU)",
                years: "2021 — 2025",
              },
            ].map((e, i) => (
              <Reveal key={e.degree} delay={i * 100}>
                <BorderGlow {...GLOW} borderRadius={20} glowRadius={30} className="h-full">
                  <div className="p-6 sm:p-8">
                    <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                      {e.years}
                    </p>
                    <h3 className="mt-3 text-lg font-semibold">{e.degree}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{e.school}</p>
                  </div>
                </BorderGlow>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* Contact */}
        <Section id="contact" title="Contact" kicker="05">
          <Reveal>
            <BorderGlow {...GLOW} glowRadius={55} glowIntensity={1.2}>
              <div className="p-8 text-center sm:p-14">
                <h3 className="text-3xl font-semibold sm:text-4xl">
                  <span className="text-gradient">Let's build the backend.</span>
                </h3>
                <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
                  Open to junior Java / Spring Boot roles where I can grow inside a real engineering
                  team.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <a
                    href="mailto:abbasigudarzi@gmail.com"
                    className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:scale-105"
                  >
                    abbasigudarzi@gmail.com
                  </a>
                  <a
                    href="tel:+989102179870"
                    className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    +98 910 217 9870
                  </a>
                  <a
                    href="https://github.com/abbasigudarzi"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    github.com/abbasigudarzi
                  </a>
                </div>
                <p className="mt-8 font-mono text-xs tracking-widest text-muted-foreground uppercase">
                  Tehran, Region 2, Sattar-khan
                </p>
              </div>
            </BorderGlow>
          </Reveal>
        </Section>

        <footer className="border-t border-border py-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Amirali Abbasi — Java Backend Engineer
        </footer>
      </div>
    </main>
  );
}

function Section({
  id,
  title,
  kicker,
  children,
}: {
  id: string;
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-10 sm:py-14">
      <Reveal>
        <div className="mb-10 flex items-end gap-4">
          <span className="font-mono text-xs tracking-[0.3em] text-primary">{kicker}</span>
          <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
          <span className="mb-2 h-px flex-1 bg-border" />
        </div>
      </Reveal>
      {children}
    </section>
  );
}
