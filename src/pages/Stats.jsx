import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Calendar as CalendarIcon,
  Camera
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Card, SectionHeader } from '../components/UI';
import { db } from '../db';
import { PhotoViewer } from '../components/PhotoViewer';
import {
  completionHasPhoto,
  hydrateCompletionPhotos,
} from '../utils/photoStorage';

const Stats = () => {
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    weeklyCompletion: 0,
    totalCompletions: 0
  });
  const [counterInsights, setCounterInsights] = useState([]);
  const [photoInsights, setPhotoInsights] = useState([]);
  const [viewer, setViewer] = useState({ open: false, blob: null, title: '' });

  useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = async () => {
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
      setCounterInsights([]);
      setPhotoInsights([]);
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

    // Counter insights (7-day rolling average)
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const sevenDaysAgoStr = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const recent = await db.completions
      .where('date')
      .between(sevenDaysAgoStr, todayStr, true, true)
      .toArray();

    const counterRoutines = routines.filter(r => (r.taskType || 'checkbox') === 'counter');
    if (counterRoutines.length > 0) {
      const days = Array.from({ length: 7 }, (_, i) =>
        format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
      );
      const byRoutine = new Map();
      for (const c of recent) {
        byRoutine.set(`${c.routineId}:${c.date}`, c);
      }
      setCounterInsights(
        counterRoutines.map(r => {
          const target = Number(r.counterTarget || 1);
          const sum = days.reduce((acc, d) => {
            const c = byRoutine.get(`${r.id}:${d}`);
            return acc + Number(c?.counterValue ?? 0);
          }, 0);
          const avg = Math.round((sum / 7) * 10) / 10;
          return { id: r.id, name: r.name, target, avg };
        })
      );
    } else {
      setCounterInsights([]);
    }

    // Photo insights (recent timeline)
    const photoRoutines = routines.filter(r => (r.taskType || 'checkbox') === 'photo');
    if (photoRoutines.length > 0) {
      const ninetyDaysAgoStr = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      const recentForPhotos = await db.completions
        .where('date')
        .between(ninetyDaysAgoStr, todayStr, true, true)
        .toArray();
      const hydratedPhotoCompletions = await hydrateCompletionPhotos(recentForPhotos);
      const photoByRoutine = new Map(photoRoutines.map(r => [r.id, []]));
      for (const c of hydratedPhotoCompletions) {
        if (!completionHasPhoto(c) || !c.photoBlob) continue;
        if (!photoByRoutine.has(c.routineId)) continue;
        photoByRoutine.get(c.routineId).push({ date: c.date, blob: c.photoBlob });
      }
      setPhotoInsights(
        photoRoutines
          .map(r => {
            const items = (photoByRoutine.get(r.id) || []).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12);
            return { id: r.id, name: r.name, items };
          })
          .filter(r => r.items.length > 0)
      );
    } else {
      setPhotoInsights([]);
    }
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

      {counterInsights.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Target size={14} className="text-[#3B82F6]" />
            <h4 className="text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em]">Counters (7-day avg)</h4>
          </div>
          <div className="space-y-3">
            {counterInsights.map((c) => (
              <Card key={c.id} className="flex items-center justify-between p-5">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{c.name}</p>
                  <p className="text-[10px] text-[#4B5563] font-bold uppercase tracking-widest mt-1">
                    Avg {c.avg} / {c.target}
                  </p>
                </div>
                <span className="text-sm font-black text-white italic">{Math.min(100, Math.round((c.avg / c.target) * 100))}%</span>
              </Card>
            ))}
          </div>
        </section>
      )}

      {photoInsights.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Camera size={14} className="text-[#F59E0B]" />
            <h4 className="text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em]">Photos</h4>
          </div>
          <div className="space-y-4">
            {photoInsights.map((p) => (
              <Card key={p.id} className="p-5">
                <p className="font-bold text-white mb-3">{p.name}</p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {p.items.map((it) => (
                    <PhotoThumbButton
                      key={`${p.id}-${it.date}`}
                      blob={it.blob}
                      label={`${p.name} • ${it.date}`}
                      onClick={() => setViewer({ open: true, blob: it.blob, title: p.name })}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <PhotoViewer
        isOpen={viewer.open}
        onClose={() => setViewer({ open: false, blob: null, title: '' })}
        blob={viewer.blob}
        title={viewer.title || 'Photo'}
      />
    </>
  );
};

export default Stats;

function PhotoThumbButton({ blob, onClick, label }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-black/20 active:scale-95 transition-all flex-shrink-0"
      aria-label={label}
    >
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : null}
    </button>
  );
}
