import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Mic,
  Users,
  Sparkles,
  ChevronRight,
  Globe,
  Heart
} from 'lucide-react';
import StatsBar from '@/components/StatsBar';

export default function MarketingHome() {
  return (
    <div className="overflow-x-hidden flex flex-col pt-16">
      {/* HERO SECTION */}
      <section className="bg-hero-light min-h-[90vh] flex items-center border-b border-[#E5E7EB]">
        <div className="page-container py-24 relative z-10 w-full">
          <div className="max-w-4xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-[#2563eb] text-sm font-semibold mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-[#38bdf8]" />
              Community-Powered Language Preservation
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#111827] leading-tight mb-6 tracking-tight">
              Preserve the <span className="text-[#2563eb]">Saurashtra</span>{' '}
              Language
            </h1>

            <p className="text-xl text-[#6B7280] max-w-2xl mx-auto mb-10 leading-relaxed">
              Join a growing community of speakers. Contribute words,
              record your voice, share stories, and help build the world's first
              AI-ready Saurashtra language dataset.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/join?tab=signup"
                className="btn-primary text-base py-3 px-8"
              >
                Join the Community
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/contribute"
                className="btn-secondary text-base py-3 px-8 shadow-sm"
              >
                Contribute a Word
              </Link>
            </div>

            <p className="mt-8 text-sm text-[#9CA3AF] flex items-center justify-center gap-1.5 font-medium">
              <Heart className="w-3.5 h-3.5 text-[#38bdf8] fill-[#38bdf8]" />
              Free, open, and community-driven
            </p>

          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-20 bg-white border-b border-[#E5E7EB]">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title">Our Growing Archive</h2>
            <p className="section-subtitle mx-auto">
              Every contribution helps preserve the language for generations to come.
            </p>
          </div>

          <StatsBar />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-[#F8FAFC] border-b border-[#E5E7EB]">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="section-title">How You Can Help</h2>
            <p className="section-subtitle mx-auto">
              Three simple ways to contribute to language preservation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen className="w-6 h-6 text-[#2563EB]" />,
                title: 'Submit Words',
                desc:
                  'Share Saurashtra vocabulary with English and Tamil meanings. Every word counts in building our dictionary.',
                cta: 'Contribute Word',
                href: '/contribute',
                bg: 'bg-[#EFF6FF]',
                border: 'border-[#BFDBFE]'
              },
              {
                icon: <Mic className="w-6 h-6 text-[#2563EB]" />,
                title: 'Record Your Voice',
                desc:
                  'Upload audio recordings of Saurashtra phrases. Your voice helps preserve the authentic pronunciation.',
                cta: 'Visit Archive',
                href: '/voice-archive',
                bg: 'bg-[#EFF6FF]',
                border: 'border-[#BFDBFE]'
              },
              {
                icon: <Users className="w-6 h-6 text-[#2563EB]" />,
                title: 'Share Stories',
                desc:
                  'Write blog posts about Saurashtra culture, history, and experiences. Tell the world our story.',
                cta: 'Start Writing',
                href: '/blog',
                bg: 'bg-[#EFF6FF]',
                border: 'border-[#BFDBFE]'
              },
            ].map((item) => (
              <div
                key={item.title}
                className="card p-8 flex flex-col group"
              >
                <div
                  className={`w-12 h-12 rounded-lg ${item.bg} flex items-center justify-center mb-6 border ${item.border}`}
                >
                  {item.icon}
                </div>

                <h3 className="font-display font-semibold text-xl text-[#111827] mb-3">
                  {item.title}
                </h3>

                <p className="text-[#6B7280] text-sm leading-relaxed flex-1 mb-6">
                  {item.desc}
                </p>

                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors w-fit group-hover:gap-2 duration-200"
                >
                  {item.cta}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-24 bg-white border-b border-[#E5E7EB]">
        <div className="page-container">
          <div className="max-w-3xl mx-auto text-center">

            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl flex items-center justify-center shadow-sm">
                <Globe className="w-8 h-8 text-[#2563EB]" />
              </div>
            </div>

            <h2 className="section-title mb-6">
              Building the Future of
              <br />
              Saurashtra AI
            </h2>

            <p className="text-lg text-[#6B7280] leading-relaxed mb-10">
              Every word you contribute, every voice you record, every story you
              write becomes part of a structured dataset that will power future
              Saurashtra language AI models.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { label: 'Words', value: 'Documented' },
                { label: 'Voice', value: 'Preserved' },
                { label: 'Stories', value: 'Shared' },
              ].map((item) => (
                <div key={item.label} className="text-center p-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC]">
                  <div className="text-[#111827] font-semibold mb-1">
                    {item.value}
                  </div>
                  <div className="text-[#6B7280] text-sm">{item.label}</div>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="btn-secondary"
            >
              Learn About Our Mission
            </Link>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-[#F8FAFC]">
        <div className="page-container text-center max-w-2xl mx-auto">

          <h2 className="section-title mb-4">
            Ready to Preserve Our Heritage?
          </h2>

          <p className="text-[#6B7280] text-lg mb-8">
            Join thousands of Saurashtra speakers helping to document and preserve
            our beautiful language.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/join?tab=signup"
              className="btn-primary py-3 px-8 text-base"
            >
              Create Free Account
            </Link>

            <Link
              href="/community"
              className="btn-secondary py-3 px-8 text-base shadow-sm"
            >
              Meet the Community
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
