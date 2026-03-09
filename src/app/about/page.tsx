import type { Metadata } from 'next';
import { Globe, BookOpen, Heart, Target, Lightbulb, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Saurashtra Language',
  description: 'Learn about the Saurashtra language, its rich history, and why preserving it matters for future generations.',
};

export default function AboutPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-cultural-gradient py-20">
        <div className="page-container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-600 text-sm font-medium mb-6">
            <Globe className="w-3.5 h-3.5" />
            Our Story &amp; Mission
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            About the{' '}
            <span className="text-gradient">Saurashtra Language</span>
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed">
            An ancient Indo-Aryan language spoken by the Saurashtra community,
            primarily in Tamil Nadu — now being preserved for eternity through technology and community.
          </p>
        </div>
      </section>

      {/* Language History */}
      <section id="history" className="py-20 bg-white">
        <div className="page-container">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="font-display text-4xl font-bold text-gray-900 mb-5">
                What is the Saurashtra Language?
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Saurashtra (also spelled Sourashtra or Sowrashtra) is an Indo-Aryan language 
                  spoken by the Saurashtra people, who originally migrated from the Saurashtra 
                  region of Gujarat. Today, the community has settled predominantly in 
                  Madurai and other parts of Tamil Nadu, where they have maintained their 
                  distinct linguistic identity for centuries.
                </p>
                <p>
                  The language has its own unique script — the Saurashtra script — though it is 
                  commonly written in Tamil or Devanagari scripts for practical purposes today. 
                  Linguistically, it belongs to the Indo-Aryan branch, related to Gujarati and 
                  Rajasthani, yet has absorbed influences from Tamil, Kannada, and Telugu 
                  over generations.
                </p>
                <p>
                  With approximately 200,000–300,000 speakers primarily concentrated in Tamil Nadu,
                  Saurashtra is classified as a <strong>critically endangered language</strong> 
                  by UNESCO, making preservation efforts urgently important.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Language Family', value: 'Indo-Aryan' },
                { label: 'Primary Region', value: 'Tamil Nadu, India' },
                { label: 'Speakers', value: '~300,000' },
                { label: 'UNESCO Status', value: 'Endangered' },
                { label: 'Origin Region', value: 'Saurashtra, Gujarat' },
                { label: 'Scripts Used', value: 'Saurashtra, Tamil' },
              ].map((item) => (
                <div key={item.label} className="card p-4 text-center border border-gray-100">
                  <div className="text-lg font-bold text-primary-600 mb-1">{item.value}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Preservation Matters */}
      <section className="py-20 bg-surface">
        <div className="page-container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">Why Preservation Matters</h2>
            <p className="section-subtitle mx-auto">
              Every language lost takes with it an entire world of thought, culture, and wisdom.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: <Heart className="w-5 h-5" />,
                title: 'Cultural Identity',
                desc: 'Language is the vessel of culture. Preserving Saurashtra preserves the stories, proverbs, and traditions of generations.',
              },
              {
                icon: <BookOpen className="w-5 h-5" />,
                title: 'Linguistic Diversity',
                desc: 'Each language represents a unique way of understanding the world. Losing one impoverishes all of humanity.',
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: 'Community Bonds',
                desc: 'Shared language strengthens community ties across generations, diaspora, and geographies.',
              },
              {
                icon: <Lightbulb className="w-5 h-5" />,
                title: 'Future Technology',
                desc: 'A documented language can power AI tools — keyboards, translators, and speech recognition for Saurashtra speakers.',
              },
            ].map((item) => (
              <div key={item.title} className="card p-6 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Goals */}
      <section id="mission" className="py-20 bg-gray-950 text-white">
        <div className="page-container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Target className="w-10 h-10 text-primary-400 mx-auto mb-4" />
            <h2 className="font-display text-4xl font-bold mb-4">Our Mission &amp; Goals</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Saurashtra Connect was built to be the digital home for our language — a living, 
              growing archive powered by the community itself.
            </p>
          </div>

          <div id="goals" className="space-y-4">
            {[
              {
                num: '01',
                title: 'Build the World\'s Largest Saurashtra Dictionary',
                desc: 'Crowdsource vocabulary, idioms, and phrases from native speakers across the globe.',
              },
              {
                num: '02',
                title: 'Create an Audio Archive of Native Voices',
                desc: 'Preserve authentic pronunciation and speech patterns from all age groups and regions.',
              },
              {
                num: '03',
                title: 'Enable Community Knowledge Sharing',
                desc: 'A blog platform where members can write about history, culture, recipes, and life in Saurashtra.',
              },
              {
                num: '04',
                title: 'Power Future AI Language Models',
                desc: 'All data is structured and exportable — ready to train the first AI models for Saurashtra NLP.',
              },
              {
                num: '05',
                title: 'Connect Global Saurashtra Diaspora',
                desc: 'Build a directory and community space for Saurashtra speakers worldwide to connect and collaborate.',
              },
            ].map((goal) => (
              <div key={goal.num} className="flex gap-5 p-5 rounded-2xl bg-gray-900 hover:bg-gray-800 transition-colors">
                <span className="font-display text-3xl font-bold text-primary-500/40 w-10 shrink-0">
                  {goal.num}
                </span>
                <div>
                  <h3 className="font-semibold text-white mb-1.5">{goal.title}</h3>
                  <p className="text-sm text-gray-400">{goal.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
