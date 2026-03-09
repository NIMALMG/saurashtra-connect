'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, User, LogOut, LayoutDashboard, Settings, PlusCircle, PenSquare, BookOpen } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { href: '/',              label: 'Home' },
  { href: '/about',         label: 'About' },
  { href: '/community',     label: 'Community' },
  { href: '/voice-archive', label: 'Voice Archive' },
  { href: '/blog',          label: 'Blog' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, userProfile, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-[#E5E7EB]'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <nav className="page-container">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative flex items-center justify-center w-9 h-9">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
            </div>
            <div className="hidden sm:block leading-none">
              <span className="font-display font-bold text-[1.15rem] text-[#111827] block tracking-tight">Saurashtra Connect</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'text-[#111827] bg-[#F3F4F6]'
                      : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]',
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative hidden lg:block" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] transition-colors shadow-sm"
                >
                  {userProfile?.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.displayName || 'User'}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-[#E5E7EB]"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#2563eb] flex items-center justify-center text-xs font-bold text-white shadow-inner">
                      {getInitials(userProfile?.displayName || 'U')}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-[#111827] max-w-[90px] truncate">
                    {userProfile?.displayName?.split(' ')[0] || 'Account'}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-2 z-50 animate-fade-in">
                    <div className="px-5 py-3 border-b border-[#E5E7EB] mb-1 bg-[#F9FAFB] mx-2 rounded-lg">
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Signed in as</p>
                      <p className="text-sm font-semibold text-[#111827] truncate">{userProfile?.displayName}</p>
                    </div>
                    {[
                      { href: `/profile/${user.uid}`, label: 'My Profile',   icon: <User className="w-4 h-4" /> },
                      { href: '/settings',            label: 'Settings',     icon: <Settings className="w-4 h-4" /> },
                    ].map(({ href, label, icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                      >
                        <span className="text-[#9CA3AF] flex items-center justify-center w-6">{icon}</span> {label}
                      </Link>
                    ))}

                    <div className="border-t border-[#E5E7EB] my-1 pt-1 pb-1">
                      {[
                        { href: '/contribute',          label: 'Contribute Word', icon: <PlusCircle className="w-4 h-4" /> },
                        { href: '/blog/new',            label: 'Write a Post',    icon: <PenSquare className="w-4 h-4" /> },
                        { href: '/blog',                label: 'Community Blog',  icon: <BookOpen className="w-4 h-4" /> },
                      ].map(({ href, label, icon }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-3 px-5 py-2.5 text-sm text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                        >
                          <span className="text-[#9CA3AF] flex items-center justify-center w-6">{icon}</span> {label}
                        </Link>
                      ))}
                    </div>
                    {userProfile?.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-[#2563eb] hover:bg-[#EFF6FF] font-medium transition-colors border-t border-[#E5E7EB] mt-1"
                      >
                        <span className="flex items-center justify-center w-6"><LayoutDashboard className="w-4 h-4" /></span> Admin Panel
                      </Link>
                    )}

                    <div className="border-t border-[#E5E7EB] mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                      >
                        <span className="flex items-center justify-center w-6"><LogOut className="w-4 h-4" /></span> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link href="/join?tab=login" className="text-sm font-medium text-[#4B5563] hover:text-[#111827] transition-colors px-3">
                  Sign In
                </Link>
                <Link href="/join?tab=signup" className="btn-primary">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="lg:hidden p-2 rounded-md border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6] transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-[#E5E7EB] py-5 animate-fade-in bg-white shadow-xl absolute left-0 right-0 top-full">
            <div className="flex flex-col gap-1 mb-4">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'px-5 py-3 text-sm font-medium rounded-md mx-4 transition-colors',
                      isActive
                        ? 'bg-[#F3F4F6] text-[#111827]'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]',
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
            <div className="px-5 pt-4 flex flex-col gap-3 border-t border-[#E5E7EB]">
              {user ? (
                <>
                  <Link href={`/profile/${user.uid}`} className="btn-secondary text-center text-sm w-full">My Profile</Link>
                  <button onClick={handleSignOut} className="btn-outline text-[#DC2626] border-[#FECACA] hover:bg-[#FEF2F2] text-sm w-full">Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/join?tab=login" className="btn-secondary text-center text-sm w-full">Sign In</Link>
                  <Link href="/join?tab=signup" className="btn-primary text-center text-sm w-full">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
