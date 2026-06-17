import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — FlowStage" },
      {
        name: "description",
        content:
          "Simple, transparent pricing for FlowStage. Starter, Professional, and Enterprise plans for conference organizers, event agencies, and production teams.",
      },
      { property: "og:title", content: "FlowStage Pricing" },
      {
        property: "og:description",
        content:
          "Plans for solo organizers, growing event teams, and enterprise conference programs.",
      },
    ],
  }),
  component: PricingPage,
});

type Tier = {
  id: "starter" | "professional" | "enterprise";
  name: string;
  tagline: string;
  monthly: number | null;
  annual: number | null;
  cta: string;
  ctaTo?: string;
  href?: string;
  highlight?: boolean;
  features: string[];
  meta?: string;
};

const TIERS: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For solo organizers running a few events a year.",
    monthly: 39,
    annual: 32,
    cta: "Start with Starter",
    ctaTo: "/generate",
    features: [
      "5 run sheets per month",
      "Event templates (Conference, Summit, Gala, Awards, more)",
      "Smart Review findings",
      "Single workspace · 1 user",
      "PDF export",
      "Email support",
    ],
    meta: "Includes 14-day trial. No credit card required.",
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "For event teams shipping high-stakes shows.",
    monthly: 119,
    annual: 99,
    cta: "Start Professional",
    ctaTo: "/generate",
    highlight: true,
    features: [
      "Unlimited run sheets",
      "Event Readiness Score (10-category breakdown)",
      "AI Briefing Center (Speaker · Moderator · Production · Sponsor)",
      "Advanced exports (PDF, DOCX, CSV, shareable link)",
      "Up to 5 users",
      "Smart Review with priority risks",
      "Priority email support",
    ],
    meta: "Most popular for agencies and in-house event teams.",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For congress operators and multi-event programs.",
    monthly: null,
    annual: null,
    cta: "Contact sales",
    href: "mailto:sales@flowstage.app?subject=FlowStage%20Enterprise",
    features: [
      "Multi-event management and program rollups",
      "Team collaboration with roles and approvals",
      "Custom branding on documents and exports",
      "SSO / SAML and audit logs",
      "Dedicated success manager · priority support SLA",
      "Procurement, MSA, and DPA support",
    ],
    meta: "Trusted by healthcare congress teams and executive summit operators.",
  },
];

function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <header className="mx-auto max-w-2xl text-center animate-in-up">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
          Pricing · v1.0
        </p>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
          Plans built for high-stakes event teams.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          Start small, scale to multi-event programs. Every plan includes the FlowStage AI run-sheet
          engine, event templates, and Smart Review.
        </p>

        <div
          role="group"
          aria-label="Billing period"
          className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1 text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => setAnnual(false)}
            aria-pressed={!annual}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              !annual ? "bg-navy text-navy-foreground shadow-sm" : "text-muted-foreground hover:text-navy"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            aria-pressed={annual}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 transition-colors ${
              annual ? "bg-navy text-navy-foreground shadow-sm" : "text-muted-foreground hover:text-navy"
            }`}
          >
            Annual
            <span
              className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                annual ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
              }`}
            >
              −17%
            </span>
          </button>
        </div>
      </header>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {TIERS.map((tier) => {
          const price = annual ? tier.annual : tier.monthly;
          const isCustom = price === null;
          return (
            <article
              key={tier.id}
              className={`lift relative flex flex-col rounded-2xl border bg-card p-7 ${
                tier.highlight
                  ? "border-accent/40 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-30px_rgba(20,30,60,0.35)] ring-1 ring-accent/20"
                  : "border-border"
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-7 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-foreground shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground/80" />
                  Most popular
                </span>
              )}

              <div>
                <h2 className="text-lg font-semibold text-navy">{tier.name}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{tier.tagline}</p>
              </div>

              <div className="mt-6 flex items-baseline gap-1.5 tabular">
                {isCustom ? (
                  <span className="text-4xl font-semibold tracking-tight text-navy">Custom</span>
                ) : (
                  <>
                    <span className="text-5xl font-semibold tracking-tight text-navy">${price}</span>
                    <span className="text-sm text-muted-foreground">/ user / mo</span>
                  </>
                )}
              </div>
              <p className="mt-1.5 min-h-[1.25rem] text-xs text-muted-foreground">
                {isCustom
                  ? "Volume-based · invoiced annually"
                  : annual
                    ? "Billed annually. Cancel anytime."
                    : `Billed monthly. Save 17% with annual.`}
              </p>

              {tier.href ? (
                <a
                  href={tier.href}
                  className={`mt-6 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-px ${
                    tier.highlight
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "bg-navy text-navy-foreground hover:bg-navy/90"
                  }`}
                >
                  {tier.cta}
                </a>
              ) : (
                <Link
                  to={tier.ctaTo ?? "/generate"}
                  className={`mt-6 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-px ${
                    tier.highlight
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "bg-navy text-navy-foreground hover:bg-navy/90"
                  }`}
                >
                  {tier.cta}
                </Link>
              )}

              <div className="mt-7 border-t border-border pt-6">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Included
                </p>
                <ul className="mt-3 space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                      <CheckIcon highlight={tier.highlight} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {tier.meta && (
                <p className="mt-6 text-xs text-muted-foreground">{tier.meta}</p>
              )}
            </article>
          );
        })}
      </div>

      {/* Enterprise contact band */}
      <section className="mt-16 overflow-hidden rounded-2xl border border-border bg-navy text-navy-foreground">
        <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
              Enterprise & Congress Programs
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Running 10+ events a year, or a multi-day congress?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-navy-foreground/75">
              Talk to our team about multi-event rollups, custom branding, SSO, procurement support, and
              a dedicated success manager for your stage and production leads.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <a
              href="mailto:sales@flowstage.app?subject=FlowStage%20Enterprise"
              className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-accent/90"
            >
              Contact sales →
            </a>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center rounded-md border border-navy-foreground/20 bg-transparent px-5 py-2.5 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy-foreground/10"
            >
              View live demo
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="text-center text-xl font-semibold tracking-tight text-navy">
          Frequently asked
        </h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-5 sm:grid-cols-2">
          {[
            {
              q: "Can I switch plans later?",
              a: "Yes. Upgrade, downgrade, or move to annual at any time. Prorated automatically on the next invoice.",
            },
            {
              q: "What counts as a run sheet?",
              a: "One generated run-of-show document for a single event date. Regenerations and revisions on the same event don't count.",
            },
            {
              q: "Do you support multi-day events?",
              a: "Yes. Professional and Enterprise plans support multi-day programs with per-day timelines, handoff notes, and per-day readiness scoring.",
            },
            {
              q: "Is my event data private?",
              a: "Your event content is private to your workspace, never used to train external models, and exportable at any time.",
            },
          ].map((item) => (
            <div key={item.q} className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm font-semibold text-navy">{item.q}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CheckIcon({ highlight }: { highlight?: boolean }) {
  return (
    <span
      className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
        highlight ? "bg-accent/15 text-accent" : "bg-navy/8 text-navy"
      }`}
      aria-hidden
    >
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M2 6.5l2.5 2.5L10 3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
