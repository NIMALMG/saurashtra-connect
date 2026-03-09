import Link from 'next/link';
import { Globe, Github, Twitter, Mail, Heart, ExternalLink } from 'lucide-react';

const footerLinks = {
  Platform: [
    { href: '/',              label: 'Home' },
    { href: '/about',         label: 'About' },
    { href: '/blog',          label: 'Blog' },
    { href: '/community',     label: 'Community' },
  ],
  Contribute: [
    { href: '/contribute',    label: 'Submit a Word' },
    { href: '/voice-archive', label: 'Voice Archive' },
    { href: '/blog/new',      label: 'Write a Post' },
    { href: '/join',          label: 'Join Community' },
  ],
  Resources: [
    { href: '/about#history', label: 'Our History' },
    { href: '/about#mission', label: 'Mission' },
    { href: '/admin',         label: 'Admin Panel' },
  ],
};

export default function Footer() {
  return (
   <footer className="bg-[#0F172A] text-[#94A3B8] pt-12 border-t border-[#E5E7EB]">
      <div className="page-container py-12 md:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand — 2 cols */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
              <div className="relative flex items-center justify-center w-8 h-8">
                <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
              </div>
              <div className="leading-tight">
                <span className="font-display font-semibold text-base text-white block">Saurashtra Connect</span>
              </div>
            </Link>

            <p className="text-sm leading-relaxed text-[#94A3B8] mb-6 max-w-[280px]">
              A community platform for Saurashtra speakers to collaborate, 
              preserve words, and build a language dataset for future AI models.
            </p>

            <div className="flex items-center gap-3">
              {[
                { href: 'https://github.com',                      icon: <Github className="w-4 h-4" />,       label: 'GitHub' },
                { href: 'https://twitter.com',                     icon: <Twitter className="w-4 h-4" />,      label: 'Twitter' },
                { href: 'mailto:hello@saurashtraconnect.com',      icon: <Mail className="w-4 h-4" />,         label: 'Email' },
              ].map(({ href, icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-white/5 border border-white/10 text-[#94A3B8] hover:bg-[#2563EB] hover:text-white hover:border-[#38BDF8] transition-all"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links — 3 cols */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-display font-semibold text-white mb-4 text-sm">{category}</h3>
              <ul className="flex flex-col gap-3">
                {links.map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-[#94A3B8] hover:text-white transition-colors flex items-center gap-1 group"
                    >
                      {label}
                      <ExternalLink className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#38BDF8]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-[#0F172A]">
        <div className="page-container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#94A3B8]">
            © {new Date().getFullYear()} Saurashtra Connect.
          </p>
          
          <p className="text-sm text-[#94A3B8] flex items-center gap-1.5">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for the community
          </p>
        </div>
      </div>
    </footer>
  );
}
