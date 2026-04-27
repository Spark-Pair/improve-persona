import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronRight, Zap, Target, Camera, Plus } from 'lucide-react';
import { Card, SectionHeader } from '../components/UI';
import { db } from '../db';
import { isTaskDue, getTodayString } from '../utils/engine';
import { PhotoViewer } from '../components/PhotoViewer';

const Home = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState({ open: false, blob: null, title: '' });

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

    const completionMap = new Map(completions.map(c => [c.routineId, c]));

    // 4. Combine
    const dailyTasks = dueToday.map(r => {
      const completion = completionMap.get(r.id) || null;
      const taskType = r.taskType || 'checkbox';
      const counterValue = completion?.counterValue ?? 0;
      const counterTarget = r.counterTarget ?? 0;
      const photoBlob = completion?.photoBlob ?? null;
      const completed =
        taskType === 'counter'
          ? counterTarget > 0 && counterValue >= counterTarget
          : taskType === 'photo'
            ? !!photoBlob
            : completion?.completed || false;

      return {
        ...r,
        completion,
        taskType,
        counterValue,
        photoBlob,
        completed,
      };
    }).sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

    setTasks(dailyTasks);
    setLoading(false);
  };

  useEffect(() => {
    loadDailyTasks();
  }, []);

  const upsertCompletion = async (routineId, updates) => {
    const today = getTodayString();
    const existing = await db.completions
      .where('[routineId+date]')
      .equals([routineId, today])
      .first();

    if (existing) {
      await db.completions.update(existing.id, updates);
    } else {
      await db.completions.add({
        routineId,
        date: today,
        completed: false,
        counterValue: null,
        photoBlob: null,
        ...updates,
      });
    }
  };

  const toggleCheckbox = async (task) => {
    await upsertCompletion(task.id, { completed: !task.completed });
    loadDailyTasks();
  };

  const incrementCounter = async (task) => {
    const current = Number(task.completion?.counterValue ?? 0);
    const next = current + 1;
    const completed = next >= Number(task.counterTarget || 1);
    await upsertCompletion(task.id, { counterValue: next, completed });
    loadDailyTasks();
  };

  const decrementCounter = async (task) => {
    const current = Number(task.completion?.counterValue ?? 0);
    const next = Math.max(0, current - 1);
    const completed = next >= Number(task.counterTarget || 1);
    await upsertCompletion(task.id, { counterValue: next, completed });
    loadDailyTasks();
  };

  const savePhoto = async (task, blob) => {
    await upsertCompletion(task.id, { photoBlob: blob, completed: true });
    loadDailyTasks();
  };

  const openViewer = (blob, title) => {
    setViewer({ open: true, blob, title });
  };

  const closeViewer = () => setViewer({ open: false, blob: null, title: '' });

  const TaskCard = ({ task }) => {
    if (task.taskType === 'counter') {
      return <CounterTaskCard task={task} onInc={() => incrementCounter(task)} onDec={() => decrementCounter(task)} />;
    }
    if (task.taskType === 'photo') {
      return <PhotoTaskCard task={task} onSave={(blob) => savePhoto(task, blob)} onView={(blob) => openViewer(blob, task.name)} />;
    }
    return <CheckboxTaskCard task={task} onToggle={() => toggleCheckbox(task)} />;
  };

  const CheckboxTaskCard = ({ task, onToggle }) => (
    <Card
      onClick={onToggle}
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
            {task.name}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/30 text-[#E5E7EB]/50 font-bold uppercase tracking-tighter">
              {task.recurrenceType}
            </span>
          </div>
        </div>
      </div>
      <ChevronRight size={18} className={`transition-transform duration-300 ${task.completed ? 'opacity-0' : 'opacity-20 group-hover:translate-x-1'}`} />
    </Card>
  );

  const CounterTaskCard = ({ task, onInc, onDec }) => {
    const [pressTimer, setPressTimer] = useState(null);
    const [swipeState, setSwipeState] = useState(null);

    const startLongPress = () => {
      if (pressTimer) return;
      const t = window.setTimeout(() => {
        onDec();
        setPressTimer(null);
      }, 500);
      setPressTimer(t);
    };

    const cancelLongPress = () => {
      if (pressTimer) {
        window.clearTimeout(pressTimer);
        setPressTimer(null);
      }
    };

    const onSwipeStart = (e) => {
      const x = e.clientX ?? 0;
      const y = e.clientY ?? 0;
      setSwipeState({ x, y, fired: false });
    };

    const onSwipeMove = (e) => {
      if (!swipeState || swipeState.fired) return;
      const x = e.clientX ?? 0;
      const y = e.clientY ?? 0;
      const dx = x - swipeState.x;
      const dy = y - swipeState.y;
      if (Math.abs(dy) > 30) return;
      if (Math.abs(dx) > 50) {
        setSwipeState({ ...swipeState, fired: true });
        onDec();
      }
    };

    const onSwipeEnd = () => setSwipeState(null);

    const progress = task.counterTarget > 0 ? Math.min(100, Math.round((task.counterValue / task.counterTarget) * 100)) : 0;

    return (
      <Card
        className={`flex items-center justify-between p-4 transition-all duration-500 border
          ${task.completed
            ? 'bg-[#10B981]/10 border-[#10B981]/30'
            : 'bg-[#374151]/80 border-white/5 hover:border-[#3B82F6]/50 shadow-lg'
        }`}
      >
        <div
          className="flex items-center gap-4 flex-1 min-w-0"
          onPointerDown={onSwipeStart}
          onPointerMove={onSwipeMove}
          onPointerUp={onSwipeEnd}
          onPointerCancel={onSwipeEnd}
        >
          <div className={`transition-all duration-300 ${task.completed ? 'scale-110' : ''}`}>
            {task.completed
              ? <CheckCircle2 size={26} className="text-[#10B981]" />
              : <Target size={26} className="text-[#3B82F6]" />
            }
          </div>
          <div className="min-w-0 flex-1">
            <h4 className={`font-semibold transition-all truncate ${task.completed ? 'text-[#10B981]' : 'text-white'}`}>
              {task.name}
            </h4>
            <div className="flex items-center gap-3 mt-2">
              <div
                className="text-[10px] px-3 py-1 rounded-full bg-black/20 border border-white/10 text-[#E5E7EB]/70 font-black uppercase tracking-widest select-none"
                onPointerDown={startLongPress}
                onPointerUp={cancelLongPress}
                onPointerCancel={cancelLongPress}
                onPointerLeave={cancelLongPress}
              >
                {task.counterValue} / {task.counterTarget}
              </div>
              <div className="flex-1 h-2 rounded-full bg-black/20 overflow-hidden border border-white/5">
                <div
                  className={`h-full ${task.completed ? 'bg-[#10B981]' : 'bg-[#3B82F6]'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-[#4B5563] font-medium uppercase tracking-widest">
              Hold count or swipe to decrement
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onInc}
          className="ml-4 w-12 h-12 rounded-2xl bg-[#3B82F6] flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 transition-all"
          aria-label="Increment"
        >
          <Plus size={20} />
        </button>
      </Card>
    );
  };

  const PhotoTaskCard = ({ task, onSave, onView }) => {
    const [thumbUrl, setThumbUrl] = useState(null);

    useEffect(() => {
      if (!task.photoBlob) {
        setThumbUrl(null);
        return;
      }
      const url = URL.createObjectURL(task.photoBlob);
      setThumbUrl(url);
      return () => URL.revokeObjectURL(url);
    }, [task.photoBlob]);

    const handlePick = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await onSave(file);
      e.target.value = '';
    };

    return (
      <Card
        className={`flex items-center justify-between p-4 transition-all duration-500 border
          ${task.completed
            ? 'bg-[#10B981]/10 border-[#10B981]/30'
            : 'bg-[#374151]/80 border-white/5 hover:border-[#3B82F6]/50 shadow-lg'
          }`}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`transition-all duration-300 ${task.completed ? 'scale-110' : ''}`}>
            {task.completed
              ? <CheckCircle2 size={26} className="text-[#10B981]" />
              : <Camera size={26} className="text-[#F59E0B]" />
            }
          </div>
          <div className="min-w-0 flex-1">
            <h4 className={`font-semibold transition-all truncate ${task.completed ? 'text-[#10B981]' : 'text-white'}`}>
              {task.name}
            </h4>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/30 text-[#E5E7EB]/50 font-bold uppercase tracking-tighter">
                Photo
              </span>
              {thumbUrl && (
                <button
                  type="button"
                  onClick={() => onView(task.photoBlob)}
                  className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-black/20 active:scale-95 transition-all"
                  aria-label="View photo"
                >
                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                </button>
              )}
            </div>
          </div>
        </div>

        <label className="ml-4 w-12 h-12 rounded-2xl bg-[#F59E0B] flex items-center justify-center text-white shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-95 transition-all cursor-pointer">
          <Camera size={20} />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePick}
          />
        </label>
      </Card>
    );
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
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </section>

      <p className="text-center text-[#4B5563] text-[10px] mt-8 font-medium uppercase tracking-[0.2em]">
        {tasks.length > 0 ? 'Tap to toggle completion' : 'Add routines to begin'}
      </p>

      <PhotoViewer
        isOpen={viewer.open}
        onClose={closeViewer}
        blob={viewer.blob}
        title={viewer.title || 'Photo'}
      />
    </>
  );
};

export default Home;
