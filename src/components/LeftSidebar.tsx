import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  Users, 
  Mic, 
  Bookmark, 
  User, 
  BarChart2,
  PenSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';

export default function LeftSidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  const navItems = [
    { icon: <Home className="w-6 h-6" strokeWidth={1.5} />, label: 'Home', href: '/' },
    { icon: <BookOpen className="w-6 h-6" strokeWidth={1.5} />, label: 'Blog', href: '/blog' },
    { icon: <Users className="w-6 h-6" strokeWidth={1.5} />, label: 'Community', href: '/community' },
    { icon: <Mic className="w-6 h-6" strokeWidth={1.5} />, label: 'Voice Archive', href: '/voice-archive' },
    { icon: <Bookmark className="w-6 h-6" strokeWidth={1.5} />, label: 'Bookmarks', href: '/bookmarks' },
    { icon: <User className="w-6 h-6" strokeWidth={1.5} />, label: 'Profile', href: `/profile/${userProfile?.uid || ''}` },
    { icon: <BarChart2 className="w-6 h-6" strokeWidth={1.5} />, label: 'Stats', href: '/stats' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[240px] sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto pb-8 pr-6 border-r border-[#E5E7EB]/60">
      
      {/* Profile summary snippet */}
      <div className="flex items-center gap-3 mb-8 pl-2">
        {userProfile?.photoURL ? (
          <img src={userProfile.photoURL} alt={userProfile.displayName || ''} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
            {getInitials(userProfile?.displayName || 'U')}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold text-[#111827] leading-tight">
            {userProfile?.displayName || 'User'}
          </span>
          <span className="text-[13px] text-[#6B7280]">
            @{userProfile?.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-[#F3F4F6] text-[#111827] font-semibold' 
                  : 'text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827]'
              }`}
            >
              <span className={`text-[#4B5563] group-hover:text-[#111827] transition-colors ${isActive ? 'text-[#111827]' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[15px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-[#E5E7EB]/60 px-2">
        <Link href="/blog/new" className="flex items-center justify-center gap-2 w-full bg-[#10B981] hover:bg-[#059669] text-white py-2.5 rounded-full font-medium transition-colors text-[15px] shadow-sm">
          <PenSquare className="w-4 h-4" />
          Write a Story
        </Link>
      </div>

    </aside>
  );
}
