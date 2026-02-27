import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { Layout } from '../components/Layout';
import { Card, SectionHeader } from '../components/UI';
import { db } from '../db';

const Stats = () => {
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    weeklyCompletion: 0,
    totalCompletions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = async () => {
    setLoading(true);

    // 1. Get all completions
    const completions = await db.completions.where('completed').equals(true).toArray();
    const routines = await db.routines.toArray();

    if (completions.length === 0) {
      setStats({
        currentStreak: 0,
        longestStreak: 0,
        completionRate: 0,
        weeklyCompletion: 0,
        totalCompletions: 0
      });
      setLoading(false);
      return;
    }

    // 2. Streak Logic
    const dates = [...new Set(completions.map(c => c.date))].sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    // Check if streak is still alive
    const lastDate = dates[0];
    if (lastDate === today || lastDate === yesterday) {
      let checkDate = lastDate === today ? new Date() : subDays(new Date(), 1);

      for (const date of dates) {
        if (date === format(checkDate, 'yyyy-MM-dd')) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }
    }

    // Longest Streak
    let lastD = null;
    dates.reverse().forEach(d => {
      if (!lastD) {
        tempStreak = 1;
      } else {
        const diff = Math.round((new Date(d) - new Date(lastD)) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      lastD = d;
    });

    // 3. Completion Rate (Last 30 days)
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const recentCompletions = completions.filter(c => c.date >= thirtyDaysAgo).length;
    // Estimate total possible (this is simplified as routines might have changed)
    const totalPossible = routines.length * 30; // Approximation
    const completionRate = totalPossible > 0 ? Math.round((recentCompletions / totalPossible) * 100) : 0;

    // 4. Weekly Summary (Last 7 days)
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const weeklyCount = completions.filter(c => c.date >= sevenDaysAgo).length;

    setStats({
      currentStreak,
      longestStreak,
      completionRate: Math.min(completionRate, 100),
      weeklyCompletion: weeklyCount,
      totalCompletions: completions.length
    });
    setLoading(false);
  };

  return (
    <>
      <SectionHeader title="Statistics" subtitle="Performance analytics" />

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="flex flex-col items-center justify-center py-8 text-center bg-gradient-to-br from-[#374151] to-[#1F2937]">
          <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center text-[#F59E0B] mb-4">
            <Flame size={24} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#4B5563] mb-1">Current</span>
          <h4 className="text-3xl font-black text-white italic">{stats.currentStreak} Days</h4>
        </Card>

        <Card className="flex flex-col items-center justify-center py-8 text-center bg-gradient-to-br from-[#1F2937] to-[#0F172A]">
          <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center text-[#3B82F6] mb-4">
            <Trophy size={24} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#4B5563] mb-1">Longest</span>
          <h4 className="text-3xl font-black text-white italic">{stats.longestStreak} Days</h4>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center text-[#10B981]">
              <Target size={20} />
            </div>
            <div>
              <h5 className="font-bold text-white">Completion Rate</h5>
              <p className="text-[10px] text-[#4B5563] font-bold uppercase tracking-widest">Last 30 Days</p>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
              <circle
                cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                strokeDasharray={175.8}
                strokeDashoffset={175.8 - (175.8 * stats.completionRate) / 100}
                className="text-[#10B981] transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-[10px] font-black">{stats.completionRate}%</span>
          </div>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#8B5CF6]/10 rounded-xl flex items-center justify-center text-[#8B5CF6]">
              <TrendingUp size={20} />
            </div>
            <div>
              <h5 className="font-bold text-white">Weekly Effort</h5>
              <p className="text-[10px] text-[#4B5563] font-bold uppercase tracking-widest">Tasks Mastered</p>
            </div>
          </div>
          <span className="text-2xl font-black text-white italic">{stats.weeklyCompletion}</span>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#EC4899]/10 rounded-xl flex items-center justify-center text-[#EC4899]">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h5 className="font-bold text-white">Total Logged</h5>
              <p className="text-[10px] text-[#4B5563] font-bold uppercase tracking-widest">Lifetime Success</p>
            </div>
          </div>
          <span className="text-2xl font-black text-white italic">{stats.totalCompletions}</span>
        </Card>
      </div>

      <div className="mt-12 p-6 rounded-[2.5rem] bg-[#10B981]/5 border border-[#10B981]/10 text-center animate-pulse">
        <p className="text-xs font-bold text-[#10B981] uppercase tracking-[0.3em]">System optimized</p>
      </div>
    </>
  );
};

export default Stats;
