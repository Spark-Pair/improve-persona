import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, ChevronRight, Zap, Target } from 'lucide-react';

const Home = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Morning Meditation', time: '08:00 AM', completed: true, category: 'Mind' },
    { id: 2, title: 'Deep Work Session', time: '10:00 AM', completed: false, category: 'Work' },
    { id: 3, title: 'Gym - Leg Day', time: '05:00 PM', completed: false, category: 'Health' },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F9FAFB] pb-32 p-6 font-sans max-w-md mx-auto relative overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#3B82F6] opacity-10 blur-[100px] rounded-full" />
      <div className="absolute top-[20%] right-[-10%] w-48 h-48 bg-[#10B981] opacity-10 blur-[80px] rounded-full" />

      {/* Header Section */}
      <header className="relative z-10 mb-10 pt-4">
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

        {/* Main Stats Card (Floating) */}
        <div className="relative group overflow-hidden bg-gradient-to-br from-[#374151] to-[#1F2937] p-6 rounded-3xl shadow-2xl border border-white/10 transition-all hover:shadow-[#3B82F6]/10">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-[#E5E7EB]/70 text-xs font-bold uppercase tracking-widest mb-1">Current Streak</p>
              <h2 className="text-4xl font-black italic">12 Days</h2>
              <div className="mt-4 flex items-center gap-2 bg-black/20 w-fit px-3 py-1 rounded-full border border-white/5">
                <Target size={14} className="text-[#3B82F6]" />
                <span className="text-xs font-medium text-[#3B82F6]">Next: 15 Day Badge</span>
              </div>
            </div>
            
            {/* Circular Progress Indicator */}
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
        </div>
      </header>

      {/* Routine Section */}
      <section className="relative z-10">
        <div className="flex items-end justify-between mb-6 px-1">
          <h3 className="text-lg font-bold">Today's Protocol</h3>
          <p className="text-xs font-semibold text-[#3B82F6]">{completedCount}/{tasks.length} Completed</p>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`group flex items-center justify-between p-4 rounded-2xl transition-all duration-500 cursor-pointer border
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
                      {task.category}
                    </span>
                    <span className="text-[10px] text-[#E5E7EB]/40 flex items-center gap-1 font-medium">
                      <Clock size={10} /> {task.time}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className={`transition-transform duration-300 ${task.completed ? 'opacity-0' : 'opacity-20 group-hover:translate-x-1'}`} />
            </div>
          ))}
        </div>
      </section>

      {/* Quick Action Hint */}
      <p className="text-center text-[#4B5563] text-[10px] mt-8 font-medium uppercase tracking-[0.2em]">
        Tap to toggle completion
      </p>
    </div>
  );
};

export default Home;