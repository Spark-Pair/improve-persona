import { format, getDay } from 'date-fns';

/**
 * Recurrence Object Structure:
 * {
 *   type: 'daily' | 'interval' | 'weekly',
 *   interval: number (for 'interval' type),
 *   days: number[] (0-6 for 'weekly' type)
 * }
 */

export const isTaskDue = (routine, date = new Date()) => {
    const recurrence = routine.recurrence ?? {
        type: routine.recurrenceType ?? 'daily',
        interval: routine.recurrenceInterval ?? null,
        days: routine.recurrenceDays ?? null
    };
    const createdAt = routine.createdAt ?? new Date().toISOString();
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const createdDate = new Date(createdAt);
    createdDate.setHours(0, 0, 0, 0);

    if (targetDate < createdDate) return false;

    switch (recurrence.type) {
        case 'daily':
            return true;

        case 'none':
            return format(targetDate, 'yyyy-MM-dd') === format(createdDate, 'yyyy-MM-dd');

        case 'interval': {
            const diffTime = Math.abs(targetDate - createdDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const interval = Number(recurrence.interval ?? 1);
            return diffDays % interval === 0;
        }

        case 'weekly': {
            const dayOfWeek = getDay(targetDate);
            const days = Array.isArray(recurrence.days) ? recurrence.days : [];
            return days.includes(dayOfWeek);
        }

        default:
            return false;
    }
};

export const getTodayString = () => format(new Date(), 'yyyy-MM-dd');

export const formatTime12 = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const m = parseInt(minutes);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
};
