import React, { useState } from 'react';
import { Modal, Input, Button } from './UI';

export const RoutineModal = ({ isOpen, onClose, onSave, routine = null }) => {
    const [name, setName] = useState(routine?.name || routine?.title || '');
    const [taskType, setTaskType] = useState(routine?.taskType || 'checkbox');
    const [counterTarget, setCounterTarget] = useState(
        routine?.counterTarget != null ? String(routine.counterTarget) : '8'
    );

    const [recurrenceType, setRecurrenceType] = useState(
        routine?.recurrenceType || routine?.recurrence?.type || 'daily'
    );
    const [interval, setIntervalValue] = useState(
        routine?.recurrenceInterval || routine?.recurrence?.interval || 1
    );
    const [selectedDays, setSelectedDays] = useState(
        routine?.recurrenceDays || routine?.recurrence?.days || [1, 2, 3, 4, 5]
    );

    React.useEffect(() => {
        if (routine) {
            setName(routine.name || routine.title || '');
            setTaskType(routine.taskType || 'checkbox');
            setCounterTarget(
                routine.counterTarget != null ? String(routine.counterTarget) : '8'
            );
            setRecurrenceType(routine.recurrenceType || routine.recurrence?.type || 'daily');
            setIntervalValue(routine.recurrenceInterval || routine.recurrence?.interval || 1);
            setSelectedDays(routine.recurrenceDays || routine.recurrence?.days || [1, 2, 3, 4, 5]);
        } else {
            setName('');
            setTaskType('checkbox');
            setCounterTarget('8');
            setRecurrenceType('daily');
            setIntervalValue(1);
            setSelectedDays([1, 2, 3, 4, 5]);
        }
    }, [routine, isOpen]);

    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const toggleDay = (index) => {
        setSelectedDays(prev =>
            prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
        );
    };

    const handleSave = () => {
        const normalizedTaskType = taskType || 'checkbox';
        const normalizedCounterTarget =
            normalizedTaskType === 'counter'
                ? Math.max(1, Number(counterTarget || 1))
                : null;

        const newRoutine = {
            name: name.trim(),
            taskType: normalizedTaskType,
            counterTarget: normalizedCounterTarget,
            recurrenceType,
            recurrenceInterval: recurrenceType === 'interval' ? Number(interval) : null,
            recurrenceDays: recurrenceType === 'weekly' ? selectedDays : null,
            createdAt: routine?.createdAt || new Date().toISOString(),
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
                value={name}
                onChange={e => setName(e.target.value)}
            />

            <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#4B5563] mb-4 px-1">Type</label>
                <div className="grid grid-cols-3 gap-2">
                    {['checkbox', 'counter', 'photo'].map(type => (
                        <button
                            key={type}
                            type="button"
                            disabled={!!routine?.id}
                            onClick={() => setTaskType(type)}
                            className={`py-3 rounded-xl text-xs font-bold capitalize transition-all border ${taskType === type
                                ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
                                : 'bg-transparent border-white/5 text-[#4B5563] hover:border-white/10'
                                } ${routine?.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                {routine?.id && (
                    <p className="mt-3 text-[10px] text-[#4B5563] font-medium px-1">
                        Task type cannot be changed after creation.
                    </p>
                )}
            </div>

            {taskType === 'counter' && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Input
                        label="Target Count"
                        type="number"
                        min="1"
                        value={counterTarget}
                        onChange={(e) => setCounterTarget(e.target.value)}
                    />
                </div>
            )}

            <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#4B5563] mb-4 px-1">Recurrence</label>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { id: 'daily', label: 'Daily' },
                        { id: 'weekly', label: 'Weekly' },
                        { id: 'interval', label: 'Every N' },
                        { id: 'none', label: 'One-time' },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setRecurrenceType(id)}
                            className={`py-3 rounded-xl text-xs font-bold transition-all border ${recurrenceType === id
                                ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6]'
                                : 'bg-transparent border-white/5 text-[#4B5563] hover:border-white/10'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {recurrenceType === 'weekly' && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between gap-1">
                        {days.map((day, i) => (
                            <button
                                key={`${day}-${i}`}
                                type="button"
                                onClick={() => toggleDay(i)}
                                className={`w-10 h-10 rounded-full text-[10px] font-black transition-all border ${selectedDays.includes(i)
                                    ? 'bg-[#10B981] border-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                    : 'bg-[#1F2937] border-white/5 text-[#4B5563]'
                                    }`}
                            >
                                {day}
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
                <Button variant="primary" className="flex-1" onClick={handleSave} disabled={!name.trim()}>Save</Button>
            </div>
        </Modal>
    );
};
