import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, RefreshCw } from 'lucide-react';
import { db } from '../db';
import { Card, SectionHeader } from '../components/UI';
import { RoutineModal } from '../components/RoutineModal';
import { useFeedback } from '../context/feedbackContext';

const formatRecurrenceSummary = (routine) => {
  const timePart = routine.scheduledTime
    ? ` · ${formatTime(routine.scheduledTime)}`
    : '';

  switch (routine.recurrenceType) {
    case 'daily':
      return `Daily${timePart}`;
    case 'weekly': {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = Array.isArray(routine.recurrenceDays) ? routine.recurrenceDays : [];
      const label = days.length === 0 ? 'Weekly' : days.sort((a, b) => a - b).map(d => dayNames[d]).join(', ');
      return `${label}${timePart}`;
    }
    case 'monthly':
      return `Monthly · Day ${routine.monthlyDay || 1}${timePart}`;
    case 'interval':
      return `Every ${routine.recurrenceInterval || 1} days${timePart}`;
    case 'none': {
      if (!routine.scheduledDate) return `One-time${timePart}`;
      const d = new Date(routine.scheduledDate + 'T00:00:00');
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${formatted}${timePart}`;
    }
    default:
      return `Daily${timePart}`;
  }
};

// Helper
const formatTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

const Routine = () => {
  const { showToast, confirm } = useFeedback();
  const [routines, setRoutines] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  const openAdd = () => {
    setEditingRoutine(null);
    setIsModalOpen(true);
  };

  const openEdit = (routine) => {
    setEditingRoutine(routine);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const fetchRoutines = async () => {
      const data = await db.routines.toArray();
      setRoutines(data);
    };
    fetchRoutines();

    // Listen for Navbar triggers
    const triggerModal = () => openAdd();
    window.addEventListener('open-routine-modal', triggerModal);
    return () => window.removeEventListener('open-routine-modal', triggerModal);
  }, []);

  const handleSave = async (routine) => {
    if (routine.id) {
      await db.routines.update(routine.id, routine);
      showToast('Protocol updated', 'success');
    } else {
      await db.routines.add(routine);
      showToast('Protocol activated', 'success');
    }
    const data = await db.routines.toArray();
    setRoutines(data);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Protocol?',
      message: 'This action cannot be undone. Your completion history will be preserved.',
      variant: 'danger',
      confirmText: 'Delete'
    });

    if (isConfirmed) {
      await db.routines.delete(id);
      setRoutines(routines.filter(r => r.id !== id));
      showToast('Protocol removed');
    }
  };

  return (
    <>
      <SectionHeader
        title="Routines"
        subtitle="Manage your daily protocols"
        action={
          <button
            onClick={openAdd}
            className="w-12 h-12 rounded-2xl bg-[#3B82F6] flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-110 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        }
      />

      <div className="space-y-4">
        {routines.length === 0 ? (
          <div className="text-center py-20 opacity-20">
            <RefreshCw size={48} className="mx-auto mb-4 animate-spin-slow" />
            <p className="font-bold uppercase tracking-widest text-sm">No protocols active</p>
          </div>
        ) : (
          routines.map((r) => (
            <Card key={r.id} className="group relative">
              <div className="flex justify-between items-start">
                <div onClick={() => openEdit(r)} className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white group-hover:text-[#3B82F6] transition-colors">
                      {r.name}
                    </h3>
                    {r.taskType !== 'checkbox' && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-black/20 border border-white/10 text-[#9CA3AF] font-black uppercase tracking-widest">
                        {r.taskType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#4B5563] capitalize">
                      <Calendar size={14} className="text-[#10B981]" />
                      {formatRecurrenceSummary(r)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-2 text-[#4B5563] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <RoutineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        routine={editingRoutine}
      />
    </>
  );
};

export default Routine;
