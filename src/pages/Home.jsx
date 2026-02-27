import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, ChevronRight, Zap, Target } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, SectionHeader } from '../components/UI';
import { db } from '../db';
import { isTaskDue, getTodayString } from '../utils/engine';

const Home = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyTasks();
  }, []);

  const loadDailyTasks = async () => {
    setLoading(true);
    const today = getTodayString();

    // 1. Get all routines
    const allRoutines = await db.routines.toArray();

    // 2. Filter routines due today
    const dueToday = allRoutines.filter(r => isTaskDue(r));

    // 3. Get today's completions
    const completions = await db.completions
      .where('date')
      .equals(today)
      .toArray();

    const completionMap = new Map(completions.map(c => [c.routineId, c.completed]));

    // 4. Combine
    const dailyTasks = dueToday.map(r => ({
      ...r,
      completed: completionMap.get(r.id) || false
    }));

    setTasks(dailyTasks);
    setLoading(false);
  };

  const toggleTask = async (task) => {
    const today = getTodayString();
    const existing = await db.completions
      .where('[routineId+date]')
      .equals([task.id, today])
      .first();

    if (existing) {
      await db.completions.update(existing.id, { completed: !task.completed });
    } else {
      await db.completions.add({
        routineId: task.id,
        date: today,
        completed: true
      });
    }

    loadDailyTasks();
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <>
      {/* Header Section */}
      <header className="mb-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[#E5E7EB]/60 text-sm font-medium">Welcome back,</p>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-[#E5E7EB]/50 bg-clip-text text-transparent">
              Persona <span className="text-[#10B981]">01</span>
            </h1>
          </div>
          <div className="bg-[#374151]/50 p-2 rounded-xl border border-[#4B5563]/30 backdrop-blur-md">
            <Zap size={20} className="text-[#F59E0B]" />
          </div>
        </div>

        {/* Main Stats Card */}
        <Card className="relative group overflow-hidden bg-gradient-to-br from-[#374151] to-[#1F2937] border-white/10 transition-all hover:shadow-[#3B82F6]/10">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-[#E5E7EB]/70 text-xs font-bold uppercase tracking-widest mb-1">Current Streak</p>
              <h2 className="text-4xl font-black italic">{completedCount === tasks.length && tasks.length > 0 ? '🔥' : ''} Active</h2>
              <div className="mt-4 flex items-center gap-2 bg-black/20 w-fit px-3 py-1 rounded-full border border-white/5">
                <Target size={14} className="text-[#3B82F6]" />
                <span className="text-xs font-medium text-[#3B82F6]">{tasks.length - completedCount} Tasks Remaining</span>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                <circle
                  cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent"
                  strokeDasharray={213.6}
                  strokeDashoffset={213.6 - (213.6 * progressPercent) / 100}
                  className="text-[#10B981] transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-sm font-bold">{progressPercent}%</span>
            </div>
          </div>
        </Card>
      </header>

      {/* Routine Section */}
      <section>
        <SectionHeader
          title="Today's Protocol"
          subtitle={loading ? 'Scanning...' : `${completedCount}/${tasks.length} Completed`}
        />

        <div className="space-y-4">
          {!loading && tasks.length === 0 && (
            <p className="text-center py-10 text-[#4B5563] text-sm font-medium">No tasks scheduled for today.</p>
          )}
          {tasks.map((task) => (
            <Card
              key={task.id}
              onClick={() => toggleTask(task)}
              className={`flex items-center justify-between p-4 transition-all duration-500 border
                ${task.completed
                  ? 'bg-[#1F2937]/40 border-[#10B981]/20 opacity-60'
                  : 'bg-[#374151]/80 border-white/5 hover:border-[#3B82F6]/50 shadow-lg'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`transition-all duration-300 ${task.completed ? 'scale-110' : ''}`}>
                  {task.completed
                    ? <CheckCircle2 size={26} className="text-[#10B981]" />
                    : <Circle size={26} className="text-[#4B5563] group-hover:text-[#3B82F6]" />
                  }
                </div>
                <div>
                  <h4 className={`font-semibold transition-all ${task.completed ? 'line-through text-[#9CA3AF]' : 'text-white'}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/30 text-[#E5E7EB]/50 font-bold uppercase tracking-tighter">
                      {task.recurrence.type}
                    </span>
                    <span className="text-[10px] text-[#E5E7EB]/40 flex items-center gap-1 font-medium">
                      <Clock size={10} /> {task.time}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className={`transition-transform duration-300 ${task.completed ? 'opacity-0' : 'opacity-20 group-hover:translate-x-1'}`} />
            </Card>
          ))}
        </div>
      </section>

      <p className="text-center text-[#4B5563] text-[10px] mt-8 font-medium uppercase tracking-[0.2em]">
        {tasks.length > 0 ? 'Tap to toggle completion' : 'Add routines to begin'}
      </p>
    </>
  );
};

export default Home;