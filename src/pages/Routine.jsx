import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Clock, Calendar, RefreshCw } from 'lucide-react';
import { db } from '../db';
import { Layout } from '../components/Layout';
import { Card, SectionHeader, Button } from '../components/UI';
import { RoutineModal } from '../components/RoutineModal';
import { useFeedback } from '../context/FeedbackContext';

const Routine = () => {
  const { showToast, confirm } = useFeedback();
  const [routines, setRoutines] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

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

  const openEdit = (routine) => {
    setEditingRoutine(routine);
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingRoutine(null);
    setIsModalOpen(true);
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
                  <h3 className="text-xl font-black text-white group-hover:text-[#3B82F6] transition-colors">{r.title}</h3>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#4B5563]">
                      <Clock size={14} className="text-[#3B82F6]" />
                      {r.time}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#4B5563] capitalize">
                      <Calendar size={14} className="text-[#10B981]" />
                      {r.recurrence.type === 'weekly'
                        ? `${r.recurrence.days.length} days/week`
                        : r.recurrence.type === 'interval'
                          ? `Every ${r.recurrence.interval} days`
                          : 'Daily'
                      }
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
