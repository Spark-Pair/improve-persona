import React, { useState } from 'react';
import { Modal, Input, Button } from './UI';

export const RoutineModal = ({ isOpen, onClose, onSave, routine = null }) => {
    const [title, setTitle] = useState(routine?.title || '');
    const [time, setTime] = useState(routine?.time || '08:00');
    const [recurrenceType, setRecurrenceType] = useState(routine?.recurrence?.type || 'daily');
    const [interval, setIntervalValue] = useState(routine?.recurrence?.interval || 1);
    const [selectedDays, setSelectedDays] = useState(routine?.recurrence?.days || [1, 2, 3, 4, 5]);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const toggleDay = (index) => {
        setSelectedDays(prev =>
            prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
        );
    };

    const handleSave = () => {
        const newRoutine = {
            title,
            time,
            recurrence: {
                type: recurrenceType,
                interval: recurrenceType === 'interval' ? Number(interval) : null,
                days: recurrenceType === 'weekly' ? selectedDays : null
            },
            createdAt: routine?.createdAt || new Date()
        };
        if (routine?.id) newRoutine.id = routine.id;
        onSave(newRoutine);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={routine ? 'Edit Routine' : 'Add Routine'}>
            <Input
                label="Title"
                placeholder="e.g. Deep Work"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />
            <Input
                label="Time"
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
            />

            <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#4B5563] mb-4 px-1">Recurrence</label>
                <div className="grid grid-cols-3 gap-2">
                    {['daily', 'weekly', 'interval'].map(type => (
                        <button
                            key={type}
                            onClick={() => setRecurrenceType(type)}
                            className={`py-3 rounded-xl text-xs font-bold capitalize transition-all border ${recurrenceType === type
                                    ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6]'
                                    : 'bg-transparent border-white/5 text-[#4B5563] hover:border-white/10'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {recurrenceType === 'weekly' && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between gap-1">
                        {days.map((day, i) => (
                            <button
                                key={day}
                                onClick={() => toggleDay(i)}
                                className={`w-10 h-10 rounded-full text-[10px] font-black transition-all border ${selectedDays.includes(i)
                                        ? 'bg-[#10B981] border-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                        : 'bg-[#1F2937] border-white/5 text-[#4B5563]'
                                    }`}
                            >
                                {day[0]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {recurrenceType === 'interval' && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Input
                        label="Every X Days"
                        type="number"
                        min="1"
                        value={interval}
                        onChange={e => setIntervalValue(e.target.value)}
                    />
                </div>
            )}

            <div className="flex gap-4 mt-4">
                <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button variant="primary" className="flex-1" onClick={handleSave} disabled={!title}>Save</Button>
            </div>
        </Modal>
    );
};
