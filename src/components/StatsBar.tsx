'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Mic, Users, Globe } from 'lucide-react';
import { getStats } from '@/lib/firestore';

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  suffix?: string;
}

export default function StatsBar() {
  const [stats, setStats] = useState({ totalWords: 0, totalRecordings: 0, totalMembers: 0, totalPosts: 0 });
  const [animated, setAnimated] = useState<Record<string, number>>({});

  useEffect(() => {
    getStats().then(setStats).catch(() => {
      // Use demo stats if Firebase not configured
      setStats({ totalWords: 1250, totalRecordings: 340, totalMembers: 820, totalPosts: 95 });
    });
  }, []);

  useEffect(() => {
    const targets: Record<string, number> = {
      totalWords: stats.totalWords,
      totalRecordings: stats.totalRecordings,
      totalMembers: stats.totalMembers,
      totalPosts: stats.totalPosts,
    };

    const duration = 1500;
    const steps = 60;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current: Record<string, number> = {};
      Object.keys(targets).forEach((k) => {
        current[k] = Math.round(targets[k] * eased);
      });
      setAnimated(current);
      if (step >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [stats]);

  const statItems: StatItem[] = [
    {
      label: 'Words Documented',
      value: animated.totalWords || stats.totalWords,
      icon: <BookOpen className="w-6 h-6" />,
      suffix: '+',
    },
    {
      label: 'Voice Recordings',
      value: animated.totalRecordings || stats.totalRecordings,
      icon: <Mic className="w-6 h-6" />,
      suffix: '+',
    },
    {
      label: 'Community Members',
      value: animated.totalMembers || stats.totalMembers,
      icon: <Users className="w-6 h-6" />,
      suffix: '+',
    },
    {
      label: 'Blog Posts',
      value: animated.totalPosts || stats.totalPosts,
      icon: <Globe className="w-6 h-6" />,
      suffix: '+',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className="card p-5 text-center border border-gray-100 hover:border-primary-200 transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center mx-auto mb-3">
            {stat.icon}
          </div>
          <div className="text-3xl font-display font-bold text-gray-900 mb-1">
            {stat.value.toLocaleString()}{stat.suffix}
          </div>
          <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
