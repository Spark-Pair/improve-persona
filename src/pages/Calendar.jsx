import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, SectionHeader } from '../components/UI';
import { db } from '../db';

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [completions, setCompletions] = useState([]);
  const [dayDetails, setDayDetails] = useState([]);

  useEffect(() => {
    fetchMonthCompletions();
  }, [currentMonth]);

  useEffect(() => {
    fetchDayDetails();
  }, [selectedDate]);

  const fetchMonthCompletions = async () => {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const data = await db.completions
      .where('date')
      .between(start, end, true, true)
      .toArray();

    // Group by date to count completed tasks
    const counts = data.reduce((acc, curr) => {
      if (curr.completed) {
        acc[curr.date] = (acc[curr.date] || 0) + 1;
      }
      return acc;
    }, {});

    setCompletions(counts);
  };

  const fetchDayDetails = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayCompletions = await db.completions
      .where('date')
      .equals(dateStr)
      .toArray();

    const routineIds = dayCompletions.filter(c => c.completed).map(c => c.routineId);
    if (routineIds.length === 0) {
      setDayDetails([]);
      return;
    }

    const routines = await db.routines
      .where('id')
      .anyOf(routineIds)
      .toArray();

    setDayDetails(routines);
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  return (
    <>
      <SectionHeader
        title="History"
        subtitle="Your journey data"
        action={
          <div className="flex gap-2 bg-[#1F2937]/50 rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-white/5 rounded-lg text-[#4B5563] hover:text-white transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-white/5 rounded-lg text-[#4B5563] hover:text-white transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        }
      />

      {/* Calendar Grid */}
      <Card className="p-4 mb-8">
        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={`${day}-${i}`} className="text-[10px] font-black text-[#4B5563] py-2 text-center uppercase tracking-widest">{day}</div>
          ))}

          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasCompletions = completions[dateStr] > 0;
            const isSelected = isSameDay(day, selectedDate);
            const isCurrMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`relative aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all duration-300
                  ${isSelected ? 'bg-[#3B82F6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'hover:bg-white/5'}
                  ${!isCurrMonth ? 'opacity-20' : ''}
                `}
              >
                <span className={`text-xs font-bold ${isSelected ? 'scale-110' : ''}`}>
                  {format(day, 'd')}
                </span>
                {hasCompletions && !isSelected && (
                  <div className="absolute bottom-1.5 w-1 h-1 bg-[#10B981] rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                )}
                {isToday(day) && !isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-white/20 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Day Details */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[#4B5563] mb-4 px-2">
          {format(selectedDate, 'eeee, MMMM do')}
        </h4>

        {dayDetails.length === 0 ? (
          <div className="bg-[#1F2937]/30 border border-white/5 rounded-2xl p-8 text-center">
            <p className="text-[#4B5563] text-sm font-medium italic">No completions logged for this day.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayDetails.map(r => (
              <div key={r.id} className="flex items-center gap-4 bg-[#1F2937]/60 border border-white/5 p-4 rounded-2xl shadow-sm">
                <CheckCircle2 size={20} className="text-[#10B981]" />
                <div>
                  <h5 className="font-bold text-white text-sm">{r.title}</h5>
                  <p className="text-[10px] text-[#4B5563] font-bold uppercase">{r.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default CalendarPage;
