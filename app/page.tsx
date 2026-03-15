import { ArrowRight, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    title: "1. Capture stream transcript",
    description:
      "TrustStream AI ingests live chat and spoken transcript snippets in near-real time."
  },
  {
    title: "2. Verify claims against evidence",
    description:
      "Detected claims are matched against uploaded proofs, seller records, and platform policies."
  },
  {
    title: "3. Deliver buyer-safe guidance",
    description:
      "A trust score, risk flags, and plain-language summary help buyers make informed decisions fast."
  }
];

export default function HomePage() {
  return (
    <div className="space-y-14 pb-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-hero-glow px-6 py-12 shadow-soft md:px-12">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy">
            <ShieldCheck size={14} /> AI Trust Layer for ASEAN Livestream Commerce
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-ink md:text-5xl">
            Make livestream shopping safer without killing conversion.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
            TrustStream AI detects high-risk sales tactics, verifies product claims, and gives buyers a transparent
            trust snapshot in under a minute.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/buyer">
              Try Demo
              <ArrowRight size={15} className="ml-1.5" />
            </Button>
            <Button href="/seller" variant="ghost">
              View Seller Mode
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          <Card className="bg-white/80">
            <p className="text-xs uppercase tracking-wide text-slate-500">Scam prevention</p>
            <p className="mt-2 text-2xl font-semibold text-ink">Real-time risk flags</p>
          </Card>
          <Card className="bg-white/80">
            <p className="text-xs uppercase tracking-wide text-slate-500">Trust by design</p>
            <p className="mt-2 text-2xl font-semibold text-ink">Claim + proof matching</p>
          </Card>
          <Card className="bg-white/80">
            <p className="text-xs uppercase tracking-wide text-slate-500">Buyer clarity</p>
            <p className="mt-2 text-2xl font-semibold text-ink">1-minute AI summary</p>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2 text-danger">
            <TriangleAlert size={16} />
            <h2 className="text-sm font-semibold uppercase tracking-wide">The problem</h2>
          </div>
          <p className="text-sm leading-7 text-slate-700">
            Livestream commerce is growing across ASEAN, but scams and misleading product claims spread faster than
            platform moderation can respond. Buyers face pressure tactics in seconds and sellers who do the right thing
            struggle to stand out.
          </p>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 text-trust">
            <Sparkles size={16} />
            <h2 className="text-sm font-semibold uppercase tracking-wide">The opportunity</h2>
          </div>
          <p className="text-sm leading-7 text-slate-700">
            TrustStream AI introduces a trust layer that runs during live selling. It rewards evidence-backed sellers,
            warns buyers about risky persuasion patterns, and gives moderators a clear signal map to act earlier.
          </p>
        </Card>
      </section>

      <section>
        <h2 className="mb-5 text-2xl font-bold text-ink">How TrustStream AI Works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.title}>
              <p className="text-sm font-semibold text-ink">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
